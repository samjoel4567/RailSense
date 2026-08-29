import React from 'react';

export default function CabDmiSpeedometer({ telemetry, route, signaling, safety }) {
  const speed = telemetry.currentSpeed;
  const limit = telemetry.permittedSpeedLimit;
  const target = telemetry.targetSpeed;
  const progress = route.progressPct;

  // Percentage of speed limit utilized
  const speedRatio = Math.min(100, Math.round((speed / limit) * 100));

  return (
    <div className="loco-panel-card loco-dmi-card">
      {/* Panel Toolbar */}
      <div className="loco-panel-toolbar font-mono">
        <div className="toolbar-left">
          <span className="live-pulse-dot"></span>
          <span className="toolbar-title">CAB DMI // ETCS DRIVER MACHINE INTERFACE</span>
        </div>
        <div className="toolbar-right">
          <span className="dmi-status-pill text-green">RBC LINK: ACTIVE (100%)</span>
          <span className="dmi-mode-pill">FS (FULL SUPERVISION)</span>
        </div>
      </div>

      <div className="loco-dmi-body">
        
        {/* Main Speed Gauge / Digital Instrument */}
        <div className="dmi-speed-hud">
          <div className="speed-hud-left">
            <span className="speed-kicker font-mono">CURRENT TRAIN SPEED</span>
            <div className="speed-digital-display">
              <span className="speed-digits font-display">{speed}</span>
              <div className="speed-units-column font-mono">
                <span className="speed-unit-text">{telemetry.speedUnit}</span>
                <span className="speed-nominal-tag text-green">NOMINAL CRUISE</span>
              </div>
            </div>

            {/* Speed ceiling & target comparison */}
            <div className="speed-envelope-row font-mono">
              <div className="envelope-item">
                <span className="env-lbl">PERMITTED LIMIT:</span>
                <span className="env-val text-bold">{limit} KM/H</span>
              </div>
              <span className="env-sep">|</span>
              <div className="envelope-item">
                <span className="env-lbl">APPROACH TARGET:</span>
                <span className="env-val text-blue text-bold">{target} KM/H (KM 23.4)</span>
              </div>
            </div>

            {/* Visual Speed Scale Bar */}
            <div className="speed-scale-container">
              <div className="speed-scale-track">
                <div 
                  className="speed-scale-fill" 
                  style={{ width: `${speedRatio}%` }}
                ></div>
                {/* Permitted limit marker */}
                <div className="speed-limit-marker" style={{ left: '100%' }}>
                  <span className="limit-tick"></span>
                  <span className="limit-txt font-mono">140 MAX</span>
                </div>
                {/* Target approach marker */}
                <div className="speed-target-marker" style={{ left: '28.5%' }}>
                  <span className="target-tick"></span>
                  <span className="target-txt font-mono">40 TARGET</span>
                </div>
              </div>
              <div className="speed-scale-ticks font-mono">
                <span>0</span>
                <span>40</span>
                <span>80</span>
                <span>120</span>
                <span>140 KM/H</span>
              </div>
            </div>
          </div>

          {/* Quick HUD Metrics Matrix */}
          <div className="speed-hud-right font-mono">
            
            {/* Status Item 1: Current Status */}
            <div className="hud-metric-box">
              <span className="hud-lbl">CURRENT STATUS</span>
              <span className="hud-val-bold text-blue">IN SECTION B</span>
              <span className="hud-sub">SOUTHBOUND ➔ STATION C</span>
            </div>

            {/* Status Item 2: Destination & ETA */}
            <div className="hud-metric-box">
              <span className="hud-lbl">NEXT DESTINATION</span>
              <div className="hud-val-group">
                <span className="hud-val-bold">{route.destination}</span>
                <span className="hud-plat-pill text-blue">P1</span>
              </div>
              <span className="hud-sub text-green font-bold">ETA: {route.etaToDestination} (14:36)</span>
            </div>

            {/* Status Item 3: Progress Traversed */}
            <div className="hud-metric-box">
              <span className="hud-lbl">SECTION B PROGRESS</span>
              <div className="hud-progress-main">
                <span className="hud-val-bold">{progress}%</span>
                <span className="hud-dist">({route.distanceTraversedKm} / {route.currentSectionLengthKm} KM)</span>
              </div>
              <div className="hud-mini-bar">
                <div className="hud-mini-fill" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {/* Status Item 4: Signal & Safety */}
            <div className="hud-metric-box is-signal-box">
              <span className="hud-lbl">APPROACH SIGNAL & SAFETY</span>
              <div className="hud-signal-aspect">
                <span className="signal-led is-green"></span>
                <span className="signal-text text-green font-bold">{signaling.nextSignalId} — {signaling.aspectLabel}</span>
              </div>
              <span className="hud-sub text-green">SAFETY STATUS: {safety.overallStatus} ({safety.safetyCategory})</span>
            </div>

          </div>
        </div>

        {/* Cab Powertrain Diagnostics Sub-Strip */}
        <div className="loco-diagnostics-strip font-mono">
          <div className="diag-item">
            <span className="diag-lbl">LINE VOLTAGE:</span>
            <span className="diag-val">{telemetry.lineVoltageKV} kV (AC)</span>
          </div>
          <div className="diag-item">
            <span className="diag-lbl">TRACTION CURRENT:</span>
            <span className="diag-val">{telemetry.tractionCurrentAmps} A</span>
          </div>
          <div className="diag-item">
            <span className="diag-lbl">BRAKE PIPE:</span>
            <span className="diag-val text-green">{telemetry.brakePipePressureBar} BAR (CHARGED)</span>
          </div>
          <div className="diag-item">
            <span className="diag-lbl">MAIN RESERVOIR:</span>
            <span className="diag-val">{telemetry.mainReservoirBar} BAR</span>
          </div>
          <div className="diag-item">
            <span className="diag-lbl">VIGILANCE / DSD:</span>
            <span className="diag-val text-green">{safety.vigilanceDsdStatus}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
