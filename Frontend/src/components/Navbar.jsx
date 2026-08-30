import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, normalizeRole } from '../auth/authService';

export default function Navbar({ currentPage = 'home', onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [visibleOnHome, setVisibleOnHome] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const isHome = currentPage === 'home';

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 20);

      // On home page, reveal the navbar once user scrolls past the top cinematic intro threshold
      if (isHome) {
        // approx 40% of viewport height or 280px
        const threshold = Math.min(window.innerHeight * 0.45, 320);
        setVisibleOnHome(scrollY > threshold);
      } else {
        setVisibleOnHome(true);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const handleNavClick = (page, hash) => {
    setMenuOpen(false);
    if (onNavigate) {
      onNavigate(page);
    }
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    if (onNavigate) {
      onNavigate('auth');
    } else {
      window.location.hash = '#auth';
    }
  };

  // Determine if the navbar should be physically visible
  const isNavVisible = !isHome || visibleOnHome;
  const userRoleKey = user ? normalizeRole(user.role) : null;
  const userRoleLabel = userRoleKey ? (ROLE_LABELS[userRoleKey] || userRoleKey) : 'OPERATOR';

  return (
    <header 
      className={`nav-header ${scrolled ? 'is-scrolled' : ''} ${!isNavVisible ? 'is-hidden-intro' : 'is-visible-sticky'}`}
      aria-hidden={!isNavVisible}
    >
      <div className="nav-container">
        
        {/* Minimal Swiss Inspired Brand Logo */}
        <a 
          href="#home" 
          className="nav-brand" 
          aria-label="RAIL//SENSE-AI"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
        >
          <div className="brand-symbol">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="4" x2="4" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="20" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="1" y1="9" x2="23" y2="9" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="15" x2="23" y2="15" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">RAIL<span className="brand-slash">//</span>SENSE-AI</span>
            <span className="brand-system-tag font-mono">v2.4 SIL-4</span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className={`nav-menu ${menuOpen ? 'is-open' : ''}`}>
          <button 
            className={`nav-link ${currentPage === 'home' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('home')}
          >
            <span>HOME</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'station-master' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('station-master')}
          >
            <span>STATION MASTER</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'control-room' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('control-room')}
          >
            <span>CONTROL ROOM</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'loco-pilot' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('loco-pilot')}
          >
            <span>LOCO PILOT</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'simulator' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('simulator')}
          >
            <span>SIMULATOR</span>
          </button>
        </nav>

        {/* Right Status & Auth/Simulator Actions */}
        <div className="nav-actions">
          {isAuthenticated && user ? (
            /* Authenticated Operator Badge */
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '4px 10px',
              borderRadius: 6
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)'
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.08em' }}>
                  {userRoleLabel}
                </span>
              </div>
            </div>
          ) : (
            /* Telemetry System Online status when not logged in */
            <div className="telemetry-status-badge font-mono">
              <span className="status-live-dot"></span>
              <span className="status-text">SYSTEM ONLINE</span>
            </div>
          )}

          {/* Primary Action Button: Simulator or Sign In / Logout */}
          {isAuthenticated ? (
            <button 
              className="btn-primary" 
              onClick={handleLogout}
              title="Sign out of operator session"
              style={{ padding: '7px 12px', fontSize: 11, background: '#1e293b' }}
            >
              <span className="font-mono">LOGOUT</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          ) : (
            <button 
              className="btn-primary" 
              onClick={() => handleNavClick('auth')}
              style={{ padding: '7px 14px', fontSize: 11 }}
            >
              <span className="font-mono">OPERATOR SIGN IN</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
            </button>
          )}

          {/* Mobile Menu Button */}
          <button 
            className={`mobile-toggle ${menuOpen ? 'is-active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
          </button>
        </div>

      </div>
    </header>
  );
}

