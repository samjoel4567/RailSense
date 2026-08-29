import React from 'react';
import TrainScene from './TrainScene';
import IntelligenceStrip from './IntelligenceStrip';

export default function Hero({ onNavigate }) {
  return (
    <div className="hero-section" id="home">
      {/* Background Architectural Grid Lines */}
      <div className="hero-subtle-grid"></div>

      <div className="hero-wrapper">
        {/* Top 2-Column Split: Editorial & Live Perception Console */}
        <div className="hero-split-layout">
          
          {/* Left Column: Mission Critical Dispatch Editorial */}
          <div className="hero-editorial">
            
            {/* System Specification Tag */}
            <div className="system-spec-badge">
              <span className="spec-indicator-dot"></span>
              <span className="spec-code font-mono">ETCS L2 // ATO COMPATIBLE</span>
              <span className="spec-sep">/</span>
              <span className="spec-label font-mono">SIL-4 ARCHITECTURE</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-main-title">
              INTELLIGENCE
              <span className="title-emphasis">FOR THE RAILWAY</span>
            </h1>

            {/* Precise Supporting Statement */}
            <p className="hero-lead-text">
              Predict route conflicts. Detect asset degradation. Turn high-density telemetry into deterministic decision support for railway dispatchers.
            </p>

            {/* Action Group */}
            <div className="hero-action-row">
              <button 
                className="btn-action-primary" 
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('control-room');
                  } else {
                    window.location.href = '#intelligence';
                  }
                }}
              >
                <span>Enter Control Room</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <a href="#platform" className="btn-action-secondary">
                <span>System Specifications</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </a>
            </div>

            {/* Verified Benchmark Metrics */}
            <div className="hero-metrics-grid">
              <div className="metric-cell">
                <div className="metric-number font-mono">&lt; 12ms</div>
                <div className="metric-caption">Edge Inference Latency</div>
              </div>
              <div className="metric-cell">
                <div className="metric-number font-mono">120 min</div>
                <div className="metric-caption">Lookahead Conflict Horizon</div>
              </div>
              <div className="metric-cell">
                <div className="metric-number font-mono">SIL-4</div>
                <div className="metric-caption">Safety Integrity Standard</div>
              </div>
            </div>

          </div>

          {/* Right Column: Live Rail Perception Console */}
          <div className="hero-visual-pane">
            <TrainScene />
          </div>

        </div>

        {/* Intelligence Architecture Pipeline */}
        <IntelligenceStrip />

      </div>
    </div>
  );
}
