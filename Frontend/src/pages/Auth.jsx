/**
 * RAIL//AI — Operator Authentication Terminal Page
 * 
 * Production-quality authentication terminal supporting Login and Signup.
 * Embodies the Swiss/Linear industrial railway aesthetic with tactile cards,
 * hairline borders, monospace telemetry, and responsive layout.
 */

import React, { useState, useEffect } from 'react';
import LoginForm from '../auth/LoginForm';
import SignupForm from '../auth/SignupForm';
import { useAuth } from '../auth/AuthContext';
import './Auth.css';

export default function Auth({ onNavigate, initialMode = 'login' }) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'signup'
  const { isAuthenticated, user } = useAuth();

  // If already authenticated, redirect to simulator
  useEffect(() => {
    if (isAuthenticated) {
      if (onNavigate) {
        onNavigate('simulator');
      } else {
        window.location.hash = '#simulator';
      }
    }
  }, [isAuthenticated, onNavigate]);

  const handleAuthSuccess = (authenticatedUser) => {
    // Determine landing page based on role or default to simulator
    let target = 'simulator';
    if (authenticatedUser?.role === 'LOCO_PILOT') target = 'loco-pilot';
    else if (authenticatedUser?.role === 'STATION_MASTER') target = 'station-master';
    else if (authenticatedUser?.role === 'CONTROL_ROOM') target = 'control-room';

    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.hash = `#${target}`;
    }
  };

  return (
    <div className="auth-page-root">
      {/* Precision Railway Background Tracks */}
      <div className="auth-bg-canvas" aria-hidden="true">
        <div className="auth-track-line track-h1" />
        <div className="auth-track-line track-h2" />
        <div className="auth-track-rail-glow" />
        <div className="auth-grid-overlay" />
      </div>

      <div className="auth-page-container">
        {/* Branding Header */}
        <header className="auth-brand-header">
          <div className="auth-logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="4" x2="4" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="20" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="1" y1="9" x2="23" y2="9" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="15" x2="23" y2="15" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="auth-brand-title">RAIL<span className="auth-slash">//</span>SENSE-AI</span>
          </div>
          <div className="auth-tagline font-mono">OPERATIONAL INTELLIGENCE PLATFORM · SIL-4 CERTIFIED</div>
        </header>

        {/* Mode Toggle Switch */}
        <div className="auth-mode-toggle-bar">
          <div className="auth-toggle-pill font-mono">
            <button
              type="button"
              className={`toggle-btn ${authMode === 'login' ? 'is-active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              OPERATOR SIGN IN
            </button>
            <button
              type="button"
              className={`toggle-btn ${authMode === 'signup' ? 'is-active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              ENROLL NEW OPERATOR
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="auth-card-container">
          {authMode === 'login' ? (
            <LoginForm
              onSwitchToSignup={() => setAuthMode('signup')}
              onSuccess={handleAuthSuccess}
            />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setAuthMode('login')}
              onSuccess={handleAuthSuccess}
            />
          )}
        </div>

        {/* Terminal Telemetry Footer */}
        <footer className="auth-footer-telemetry font-mono">
          <div className="telemetry-item">
            <span className="telemetry-dot dot-green" />
            <span>INTERLOCK: ACTIVE</span>
          </div>
          <div className="telemetry-item">
            <span>NETWORK: 10 STATIONS · 30 TRAINS</span>
          </div>
          <div className="telemetry-item">
            <span>ENCRYPTION: TLS 1.3 / AES-256</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
