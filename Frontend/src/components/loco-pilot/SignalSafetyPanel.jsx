import React from 'react';

export default function SignalSafetyPanel({ signaling, safety, route }) {
  return (
    <div className="loco-panel-card loco-signal-card">
      {/* Panel Toolbar */}
      <div className="loco-panel-toolbar font-mono">
        <div className="toolbar-left">
          <span className="live-pulse-dot is-green-dot"></span>
          <span className="toolbar-title">SIGNALING & SIL-4 SAFETY STATUS</span>
        </div>
        <span className="dmi-mode-pill">{signaling.etcsLevel}</span>
      </div>

      <div className="loco-signal-body">
        
        {/* Signal Aspect Display Box */}
        <div className="signal-mast-card font-mono">
          <div className="aspect-optical-housing">
            <div className={`aspect-lens lens-green ${signaling.currentAspect === 'GREEN' ? 'is-lit' : ''}`}></div>
            <div className={`aspect-lens lens-amber ${signaling.currentAspect === 'AMBER' ? 'is-lit' : ''}`}></div>
            <div className={`aspect-lens lens-red ${signaling.currentAspect === 'RED' ? 'is-lit' : ''}`}></div>
          </div>

          <div className="aspect-details">
            <span className="aspect-signal-name">{signaling.nextSignalId}</span>
            <span className="aspect-state-text text-green font-bold">{signaling.aspectLabel}</span>
            <span className="aspect-location">{signaling.nextSignalLocation}</span>
            <span className="aspect-dist-text">DISTANCE TO SIGNAL: {signaling.distanceToNextSignalMeters}M</span>
          </div>
        </div>

        {/* Safety & Movement Authority Breakdown */}
        <div className="safety-metrics-grid font-mono">
          
          <div className="safety-cell">
            <span className="safety-lbl">MOVEMENT AUTHORITY (EOA):</span>
            <span className="safety-val text-green font-bold">+{signaling.movementAuthorityMeters} M (CLEAR)</span>
            <span className="safety-sub">UNRESTRICTED UP TO KM 24.8</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">RADIO BLOCK CENTER:</span>
            <span className="safety-val">{signaling.radioBlockCenter}</span>
            <span className="safety-sub">TELEMETRY LATENCY: 9ms</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">WHEEL SLIP PROTECTION:</span>
            <span className="safety-val text-green font-bold">{safety.wheelSlipProtection}</span>
            <span className="safety-sub">DRY RAIL TANGENT</span>
          </div>

          <div className="safety-cell">
            <span className="safety-lbl">TRACK CIRCUIT CLEARANCE:</span>
            <span className="safety-val text-green font-bold">{safety.trackCircuitOccupancy}</span>
            <span className="safety-sub">SECTION B BLOCKS 01-14 LOCKED</span>
          </div>

        </div>

      </div>
    </div>
  );
}
