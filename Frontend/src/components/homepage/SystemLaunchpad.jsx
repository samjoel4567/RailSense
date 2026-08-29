import React from 'react';

export default function SystemLaunchpad({ onNavigate }) {
  return (
    <section className="system-launchpad-section" id="launchpad">
      <div className="section-container">
        
        <div className="launchpad-card">
          
          <div className="launchpad-brand-header">
            <div className="launchpad-badge font-mono">
              <span className="badge-bullet bg-green"></span>
              <span>SYSTEM READY // SIL-4 HARDENED</span>
            </div>

            <h2 className="launchpad-brand-title">
              RAIL<span className="text-red">//</span>AI
            </h2>

            <p className="launchpad-tagline">
              One operational picture. Three coordinated interfaces. Predictive railway safety.
            </p>

            <p className="launchpad-subtext">
              Select an operational console to enter the live railway dispatch and simulation environment.
            </p>
          </div>

          {/* 4 Direct Navigation Buttons Grid */}
          <div className="launchpad-buttons-grid">
            
            <button 
              className="launchpad-action-card"
              onClick={() => onNavigate && onNavigate('station-master')}
            >
              <div className="btn-card-top font-mono">
                <span className="btn-card-code">CONSOLE 01</span>
                <span className="btn-card-status text-green">READY</span>
              </div>
              <h3 className="btn-card-title">STATION MASTER</h3>
              <p className="btn-card-desc">Platforms, signals, routes, and station occupancy management.</p>
              <div className="btn-card-arrow font-mono">
                <span>OPEN INTERFACE</span>
                <span>&rarr;</span>
              </div>
            </button>

            <button 
              className="launchpad-action-card"
              onClick={() => onNavigate && onNavigate('control-room')}
            >
              <div className="btn-card-top font-mono">
                <span className="btn-card-code">CONSOLE 02</span>
                <span className="btn-card-status text-green">LIVE</span>
              </div>
              <h3 className="btn-card-title">CONTROL ROOM</h3>
              <p className="btn-card-desc">Corridor-wide multi-track telemetry, risk radar, and conflict map.</p>
              <div className="btn-card-arrow font-mono">
                <span>OPEN INTERFACE</span>
                <span>&rarr;</span>
              </div>
            </button>

            <button 
              className="launchpad-action-card"
              onClick={() => onNavigate && onNavigate('loco-pilot')}
            >
              <div className="btn-card-top font-mono">
                <span className="btn-card-code">CONSOLE 03</span>
                <span className="btn-card-status text-green">ACTIVE CAB</span>
              </div>
              <h3 className="btn-card-title">LOCO PILOT</h3>
              <p className="btn-card-desc">ETCS Level 2 DMI speedometer, braking target, and cab emergency controls.</p>
              <div className="btn-card-arrow font-mono">
                <span>OPEN INTERFACE</span>
                <span>&rarr;</span>
              </div>
            </button>

            <button 
              className="launchpad-action-card launchpad-action-simulator"
              onClick={() => onNavigate && onNavigate('simulator')}
            >
              <div className="btn-card-top font-mono">
                <span className="btn-card-code">SCENARIO ENGINE</span>
                <span className="btn-card-status text-blue">5 PHASES</span>
              </div>
              <h3 className="btn-card-title">SIMULATOR</h3>
              <p className="btn-card-desc">Interactive end-to-end multi-phase railway conflict resolution engine.</p>
              <div className="btn-card-arrow font-mono">
                <span>LAUNCH SIMULATOR</span>
                <span>&rarr;</span>
              </div>
            </button>

          </div>

          {/* Bottom Security / Architecture Certifications */}
          <div className="launchpad-cert-row font-mono">
            <div className="cert-item">
              <span className="cert-dot"></span>
              <span>CENELEC EN 50126 (RAMS)</span>
            </div>
            <div className="cert-item">
              <span className="cert-dot"></span>
              <span>CENELEC EN 50128 (Software SIL-4)</span>
            </div>
            <div className="cert-item">
              <span className="cert-dot"></span>
              <span>ERTMS / ETCS Level 2 Baseline 3</span>
            </div>
            <div className="cert-item">
              <span className="cert-dot"></span>
              <span>IEEE 1474 CBTC Standard</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
