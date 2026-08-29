import React, { useState, useEffect } from 'react';

export default function Navbar({ currentPage = 'home', onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  return (
    <header className={`nav-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="nav-container">
        
        {/* Minimal Swiss Inspired Brand Logo */}
        <a 
          href="#home" 
          className="nav-brand" 
          aria-label="RAIL//AI Home"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }}
        >
          <div className="brand-symbol">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="5" y1="3" x2="5" y2="21" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="19" y1="3" x2="19" y2="21" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="2" y1="8" x2="22" y2="8" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="16" x2="22" y2="16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="brand-text-group">
            <span className="brand-name">RAIL<span className="brand-slash">/</span>AI</span>
            <span className="brand-system-tag font-mono">v2.4</span>
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
            className={`nav-link ${currentPage === 'simulator' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('simulator')}
          >
            <span>SIMULATOR</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'control-room' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('control-room')}
          >
            <span>CONTROL ROOM</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'station-master' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('station-master')}
          >
            <span>STATION MASTER</span>
          </button>

          <button 
            className={`nav-link ${currentPage === 'loco-pilot' ? 'is-active-nav' : ''}`}
            onClick={() => handleNavClick('loco-pilot')}
          >
            <span>LOCO PILOT</span>
          </button>

          <button 
            className="nav-link" 
            onClick={() => handleNavClick('home', '#intelligence')}
          >
            <span>INTELLIGENCE</span>
          </button>

          <button 
            className="nav-link" 
            onClick={() => handleNavClick('home', '#demo')}
          >
            <span>DEMO</span>
          </button>

          <button 
            className="nav-link" 
            onClick={() => handleNavClick('home', '#about')}
          >
            <span>ABOUT</span>
          </button>
        </nav>

        {/* Right Status & Simulator Action */}
        <div className="nav-actions">
          <div className="telemetry-status-badge">
            <span className="status-live-dot"></span>
            <span className="status-text font-mono">ONLINE</span>
            <span className="status-divider">·</span>
            <span className="status-metric font-mono">9ms</span>
          </div>

          <button 
            className="btn-primary" 
            onClick={() => handleNavClick(currentPage === 'simulator' ? 'home' : 'simulator')}
          >
            <span>{currentPage === 'simulator' ? 'Exit to Home' : 'Simulator'}</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

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
