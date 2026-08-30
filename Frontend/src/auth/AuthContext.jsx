/**
 * RAIL//AI — Authentication Context
 * 
 * Provides unified authentication state across the entire React application.
 * Persists session across page refreshes via authService and handles login/signup/logout.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, normalizeRole } from './authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Verify stored session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[AuthContext] Session verification error:', err);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user
   */
  const login = useCallback(async ({ email, password, rememberMe = true }) => {
    setAuthError(null);
    try {
      const result = await authService.login({ email, password, rememberMe });
      setUser(result.user);
      return { success: true, user: result.user, source: result.source };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  /**
   * Register new user account
   */
  const signup = useCallback(async ({ name, email, password, role = 'CONTROL_ROOM', rememberMe = true }) => {
    setAuthError(null);
    try {
      const result = await authService.signup({ name, email, password, role, rememberMe });
      setUser(result.user);
      return { success: true, user: result.user, source: result.source };
    } catch (err) {
      const msg = err.message || 'Signup failed. Please try again.';
      setAuthError(msg);
      throw new Error(msg);
    }
  }, []);

  /**
   * Log out user
   */
  const logout = useCallback(async () => {
    setAuthError(null);
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  /**
   * Check if the authenticated user has any of the specified roles
   * @param {string|string[]} roles
   * @returns {boolean}
   */
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const userRole = normalizeRole(user.role);
    if (userRole === 'ADMIN') return true; // Administrator has universal access
    
    if (Array.isArray(roles)) {
      return roles.map(normalizeRole).includes(userRole);
    }
    return userRole === normalizeRole(roles);
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    authError,
    login,
    signup,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume authentication state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
