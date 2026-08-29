import React, { useState } from 'react';

export default function DelayPrevention({ onNavigate }) {
  const [activeScenarioTab, setActiveScenarioTab] = useState('junction-conflict');

  return (
    <section className="delay-prevention-section" id="delay-prevention">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="system-tag-badge font-mono">
            <span className="badge-bullet bg-amber"></span>
            <span>BOTTLENECK ELIMINATION</span>
          </div>

          <h2 className="section-main-title">
            Prevent Delays Before They Propagate
          </h2>

          <p className="section-description">
            When multiple trains converge upon single-track junctions or shared station throats, small variances cause network-wide gridlock. RAIL//AI models arrival trajectories to present deterministic holding decisions.
          </p>
        </div>

        {/* Interactive Scenario Visualizer Box */}
        <div className="scenario-visualizer-box">
          
          <div className="scenario-box-header">
            <div className="scenario-header-left">
              <span className="scenario-badge font-mono">OPERATIONAL SCENARIO CASE STUDY</span>
              <h3 className="scenario-heading">Junction J-02 Converging Corridor Conflict</h3>
            </div>
            
            <div className="scenario-tabs font-mono">
              <button 
                className={`scenario-tab-btn ${activeScenarioTab === 'junction-conflict' ? 'is-active' : ''}`}
                onClick={() => setActiveScenarioTab('junction-conflict')}
              >
                LIVE CONVERGENCE SCENARIO
              </button>
            </div>
          </div>

          <div className="scenario-content-grid">
            
            {/* Left: Converging Trains Telemetry */}
            <div className="scenario-trains-pane">
              <span className="pane-title font-mono">1. APPROACHING JUNCTION ASSETS</span>

              {/* Train 1: EXPRESS_201 */}
              <div className="scenario-train-card card-express">
                <div className="st-head font-mono">
                  <span className="st-train-id font-bold">EXPRESS_201</span>
                  <span className="st-badge bg-green">HIGH SPEED / PRIORITY</span>
                </div>
                <div className="st-body font-mono">
                  <div className="st-row">
                    <span className="st-k">SPEED:</span>
                    <span className="st-v">118 KM/H</span>
                  </div>
                  <div className="st-row">
                    <span className="st-k">CURRENT TRACK:</span>
                    <span className="st-v">DN MAIN</span>
                  </div>
                  <div className="st-row">
                    <span className="st-k">PROJECTED ETA AT J-02:</span>
                    <span className="st-v font-bold text-green">14:04:10</span>
                  </div>
                </div>
                <div className="st-status font-mono">
                  <span>&rarr; Approaching Junction J-02 at Line Speed</span>
                </div>
              </div>

              {/* Train 2: LOCAL_101 */}
              <div className="scenario-train-card card-local">
                <div className="st-head font-mono">
                  <span className="st-train-id font-bold">LOCAL_101</span>
                  <span className="st-badge bg-amber">STOPPING PASSENGER</span>
                </div>
                <div className="st-body font-mono">
                  <div className="st-row">
                    <span className="st-k">SPEED:</span>
                    <span className="st-v">0 KM/H (BERTHED)</span>
                  </div>
                  <div className="st-row">
                    <span className="st-k">CURRENT TRACK:</span>
                    <span className="st-v">DN LOOP (PLATFORM 3)</span>
                  </div>
                  <div className="st-row">
                    <span className="st-k">PROJECTED ETA AT J-02:</span>
                    <span className="st-v font-bold text-amber">14:04:35 (IF DEPARTED)</span>
                  </div>
                </div>
                <div className="st-status font-mono">
                  <span>&rarr; Ready for Departure Request at Station B</span>
                </div>
              </div>
            </div>

            {/* Middle: System Headway & ETA Analysis */}
            <div className="scenario-analysis-pane">
              <span className="pane-title font-mono">2. SYSTEM HEADWAY CALCULATION</span>

              <div className="analysis-computation-card font-mono">
                <div className="comp-item">
                  <span className="comp-label">HEADWAY MARGIN IF LOCAL DEPARTS:</span>
                  <span className="comp-val text-red">25 SEC (VIOLATES 180s SAFETY MIN)</span>
                </div>
                <div className="comp-item">
                  <span className="comp-label">BRAKING FORCED ON EXPRESS_201:</span>
                  <span className="comp-val text-red">-6.5 MIN EXPRESS DELAY</span>
                </div>
                <div className="comp-item">
                  <span className="comp-label">PROJECTED DOWNSTREAM IMPACT:</span>
                  <span className="comp-val text-amber">4 FOLLOWER TRAINS DELAYED</span>
                </div>
              </div>

              {/* Decision Action Node */}
              <div className="analysis-decision-card">
                <div className="dec-head font-mono">
                  <span className="dec-badge">RECOMMENDED ACTION</span>
                  <span className="dec-status font-bold text-green">HOLD / PROCEED VECTOR</span>
                </div>

                <div className="dec-actions-list font-mono">
                  <div className="dec-action-row row-proceed">
                    <span className="action-pill bg-green">PROCEED</span>
                    <span className="action-text">Authorize <strong>EXPRESS_201</strong> through J-02 on DN MAIN</span>
                  </div>
                  <div className="dec-action-row row-hold">
                    <span className="action-pill bg-amber">HOLD</span>
                    <span className="action-text">Hold <strong>LOCAL_101</strong> at Platform 3 for +90 seconds</span>
                  </div>
                </div>

                <div className="dec-savings-row font-mono">
                  <span className="savings-label">NET NETWORK SAVINGS:</span>
                  <span className="savings-val text-green">+8.4 MINUTES ELIMINATED</span>
                </div>
              </div>
            </div>

          </div>

          {/* Critical Human Authority Notice */}
          <div className="scenario-governance-notice">
            <div className="notice-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="notice-text">
              <h4 className="notice-title">Human-in-the-Loop Operational Authority</h4>
              <p className="notice-desc">
                RAIL//AI provides deterministic advisory intelligence and precision time-distance calculations. The AI engine does <strong>not</strong> autonomously control train traction or switch interlocking. Certified human Station Masters and Dispatchers evaluate recommendations and execute the final operational decision.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
