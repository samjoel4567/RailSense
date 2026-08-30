/**
 * RAIL//AI — Authentication Service Client
 * 
 * Handles API communication with the Node.js/Express + MongoDB backend.
 * Provides JWT token management, storage persistence (localStorage vs sessionStorage),
 * and network resilience with fallback support for offline dev environments.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5001/api/auth';


const TOKEN_KEY = 'rail_ai_auth_token';
const USER_KEY = 'rail_ai_auth_user';
const REMEMBER_KEY = 'rail_ai_auth_remember';

/**
 * Get active storage (localStorage for remember-me, sessionStorage otherwise)
 */
function getStorage() {
  const isRemembered = localStorage.getItem(REMEMBER_KEY) === 'true';
  return isRemembered ? localStorage : sessionStorage;
}

export const authService = {
  /**
   * Login user with credentials
   * @param {Object} credentials - { email, password, rememberMe }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async login({ email, password, rememberMe = true }) {
    // Persist remember choice
    localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Authentication failed. Please check your credentials.');
      }

      const { user, token } = data;
      this._saveSession(user, token, rememberMe);
      return { user, token, source: 'API' };
    } catch (err) {
      // If server is unreachable (NetworkError / fetch failed), provide simulated dev fallback
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.warn('[authService] Backend server is offline. Activating local terminal mock authentication.');
        const mockUser = this._createMockUserFromEmail(email);
        const mockToken = `mock-jwt-token-${Date.now()}`;
        this._saveSession(mockUser, mockToken, rememberMe);
        return { user: mockUser, token: mockToken, source: 'LOCAL_FALLBACK' };
      }
      throw err;
    }
  },

  /**
   * Register a new user account
   * @param {Object} userData - { name, email, password, role }
   * @returns {Promise<{ user: Object, token: string }>}
   */
  async signup({ name, email, password, role = 'CONTROL_ROOM', rememberMe = true }) {
    localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');

    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role: normalizeRole(role)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Registration failed. Please try again.');
      }

      const { user, token } = data;
      this._saveSession(user, token, rememberMe);
      return { user, token, source: 'API' };
    } catch (err) {
      // If server is unreachable, provide simulated dev fallback
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        console.warn('[authService] Backend server is offline. Activating local terminal mock account creation.');
        const mockUser = {
          id: `usr_${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: normalizeRole(role),
          createdAt: new Date().toISOString()
        };
        const mockToken = `mock-jwt-token-${Date.now()}`;
        this._saveSession(mockUser, mockToken, rememberMe);
        return { user: mockUser, token: mockToken, source: 'LOCAL_FALLBACK' };
      }
      throw err;
    }
  },

  /**
   * Log out current user and invalidate token
   */
  async logout() {
    const token = this.getToken();
    try {
      if (token && !token.startsWith('mock-')) {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.warn('[authService] Server logout notification skipped:', err.message);
    } finally {
      this._clearSession();
    }
  },

  /**
   * Verify token and fetch current user profile
   * @returns {Promise<Object|null>}
   */
  async getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    // Handle mock token
    if (token.startsWith('mock-')) {
      const storedUser = this.getStoredUser();
      return storedUser;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        this._clearSession();
        return null;
      }

      const data = await response.json();
      if (data.user) {
        // Refresh local cache
        const storage = getStorage();
        storage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch (err) {
      console.warn('[authService] Failed to verify token with backend. Using cached user session:', err.message);
      return this.getStoredUser();
    }
  },

  /**
   * Read stored token from localStorage or sessionStorage
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  },

  /**
   * Read stored user from localStorage or sessionStorage
   */
  getStoredUser() {
    try {
      const str = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return str ? JSON.parse(str) : null;
    } catch {
      return null;
    }
  },

  // ── Internal session helpers ──────────────────────────────
  _saveSession(user, token, rememberMe) {
    this._clearSession();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  _clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  },

  _createMockUserFromEmail(email) {
    const clean = email.split('@')[0];
    const name = clean.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    let role = 'CONTROL_ROOM';
    const lower = email.toLowerCase();
    if (lower.includes('pilot') || lower.includes('loco') || lower.includes('driver')) role = 'LOCO_PILOT';
    else if (lower.includes('station') || lower.includes('sm')) role = 'STATION_MASTER';
    else if (lower.includes('admin')) role = 'ADMIN';

    return {
      id: `usr_mock_${Math.floor(Math.random()*10000)}`,
      name: name || 'Operator',
      email: email.toLowerCase(),
      role,
      badgeNumber: `RAIL-${Math.floor(1000 + Math.random()*9000)}`,
      isMock: true,
      lastLogin: new Date().toISOString()
    };
  }
};

/**
 * Standardize role strings
 */
export function normalizeRole(role) {
  if (!role) return 'CONTROL_ROOM';
  const r = role.toString().trim().toUpperCase().replace(/\s+/g, '_');
  if (r === 'LOCO_PILOT' || r === 'LOCOPILOT' || r === 'PILOT') return 'LOCO_PILOT';
  if (r === 'STATION_MASTER' || r === 'STATIONMASTER') return 'STATION_MASTER';
  if (r === 'CONTROL_ROOM' || r === 'CONTROLROOM' || r === 'CONTROLLER') return 'CONTROL_ROOM';
  if (r === 'ADMIN' || r === 'ADMINISTRATOR') return 'ADMIN';
  return 'CONTROL_ROOM';
}

export const ROLE_LABELS = {
  LOCO_PILOT:     'LOCO PILOT',
  STATION_MASTER: 'STATION MASTER',
  CONTROL_ROOM:   'CONTROL ROOM',
  ADMIN:          'ADMINISTRATOR'
};
