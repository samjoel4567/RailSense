import React, { useState } from 'react';
import { useCustomerData } from '../context/CustomerDataContext';

export default function CustomerNavbar({ onSwitchToOperator }) {
  const {
    activeTab,
    setActiveTab,
    pinnedTrainIds,
    isLiveBackend,
    simTime,
    dataStatus
  } = useCustomerData();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="customer-navbar">
      <div className="cust-nav-container">
        
        {/* Brand */}
        <div className="cust-brand" onClick={() => handleTabClick('planner')}>
          <div className="cust-brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <line x1="4" y1="4" x2="4" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="4" x2="20" y2="20" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="1" y1="9" x2="23" y2="9" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="1" y1="15" x2="23" y2="15" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="cust-brand-text">
            <span className="cust-brand-name font-bold">RAIL<span className="text-blue">//</span>AI</span>
            <span className="cust-brand-sub font-mono">PASSENGER PORTAL</span>
          </div>
        </div>

        {/* Center Tabs Navigation */}
        <nav className={`cust-nav-links ${mobileMenuOpen ? 'is-open' : ''}`}>
          <button
            type="button"
            className={`cust-nav-btn ${activeTab === 'planner' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('planner')}
          >
            <span>JOURNEY PLANNER</span>
          </button>

          <button
            type="button"
            className={`cust-nav-btn ${activeTab === 'trains' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('trains')}
          >
            <span>LIVE TRAINS</span>
          </button>

          <button
            type="button"
            className={`cust-nav-btn ${activeTab === 'stations' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('stations')}
          >
            <span>STATIONS</span>
          </button>

          <button
            type="button"
            className={`cust-nav-btn ${activeTab === 'map' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('map')}
          >
            <span>LIVE MAP</span>
          </button>

          <button
            type="button"
            className={`cust-nav-btn ${activeTab === 'my-journey' ? 'is-active' : ''}`}
            onClick={() => handleTabClick('my-journey')}
          >
            <span>MY JOURNEY</span>
            {pinnedTrainIds.length > 0 && (
              <span className="pinned-count-pill font-mono">{pinnedTrainIds.length}</span>
            )}
          </button>
        </nav>

        {/* Right Status & Actions */}
        <div className="cust-nav-actions">
          {/* Live Data Status Indicator */}
          <div className="cust-status-indicator font-mono">
            <span className={`status-beacon ${isLiveBackend ? 'beacon-live' : 'beacon-demo'}`} />
            <span className="status-text">{isLiveBackend ? '● LIVE ETA' : '● SIMULATOR'}</span>
            <span className="status-ago font-mono">{simTime}</span>
          </div>

          {/* Switch to Operator Console */}
          {onSwitchToOperator && (
            <button
              type="button"
              className="btn-switch-operator font-mono"
              onClick={onSwitchToOperator}
              title="Open Railway Operations & Control Center"
            >
              <span>OPERATOR CONSOLE</span>
              <span>⚙</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={`cust-mobile-toggle ${mobileMenuOpen ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
