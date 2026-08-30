import React from 'react';

export default function TrackProfileMap({ waypoints, route, telemetry }) {
  const sectionLabel = route?.currentSection || 'LIVE TRACK PROFILE';
  const originLabel = route?.origin || 'ORIGIN';
  const destinationLabel = route?.destination || 'DESTINATION';
  const currentTrainId = route?.trainId || 'LIVE TRAIN';
  const traversedKm = route?.distanceTraversedKm ?? 0;
  const remainingKm = route?.distanceRemainingKm ?? 0;

  return (
    <div className="loco-panel-card loco-profile-card">
      
      {/* Panel Toolbar */}
      <div className="loco-panel-toolbar font-mono">
        <div className="toolbar-left">
          <span className="live-pulse-dot"></span>
          <span className="toolbar-title">LINEAR TRACK PROFILE // {sectionLabel}</span>
        </div>
        <div className="toolbar-right">
          <span className="profile-heading-tag">
            {route?.direction || 'SOUTHBOUND'} {route?.directionArrow || '➔'} {destinationLabel} [{route?.platform || 'P1'}]
          </span>
        </div>
      </div>

      {/* Main Track Schematic Visual */}
      <div className="loco-profile-body">
        
        {/* Top Summary Banner */}
        <div className="profile-hero-bar font-mono">
          <div className="hero-bar-node">
            <span className="node-badge node-origin">ORIGIN</span>
            <span className="node-name font-bold">{originLabel}</span>
            <span className="node-km">KM 0.0 [{route?.currentStation ? 'AT PLATFORM' : 'DEPARTED'}]</span>
          </div>

          <div className="hero-bar-mid">
            <div className="mid-corridor-line">
              <span className="line-dir-arrow">➔ ➔ ➔</span>
              <span className="line-text">SECTION TRANSIT ({(route?.currentSectionLengthKm || 0).toFixed(1)} KM)</span>
              <span className="line-dir-arrow">➔ ➔ ➔</span>
            </div>
            <div className="current-pos-flag">
              <span className="flag-train-icon">🚆</span>
              <span className="flag-train-id font-bold">{currentTrainId}</span>
              <span className="flag-metrics">
                {telemetry.currentSpeed} KM/H // AT KM {(route?.distanceTraversedKm ?? 0).toFixed(1)} ({route?.progressPct ?? 0}%)
              </span>
            </div>
          </div>

          <div className="hero-bar-node">
            <span className="node-badge node-dest">DESTINATION</span>
            <span className="node-name font-bold">{destinationLabel}</span>
            <span className="node-km text-blue font-bold">KM {(route?.currentSectionLengthKm || 0).toFixed(1)} [{route?.platform || 'P1'}]</span>
          </div>
        </div>

        {/* Detailed High-Contrast Linear Track Elevation & Waypoints Strip */}
        <div className="linear-track-wrapper">
          <div className="linear-track-bed">
            
            {/* Parallel Steel Rails & Ties */}
            <div className="profile-steel-rails"></div>
            <div className="profile-rail-ties"></div>

            {/* Active Progress Overlay */}
              <div 
                className="profile-traversed-fill" 
                style={{ width: `${route?.progressPct || 0}%` }}
              ></div>

            {/* Active Moving Train Position Marker */}
            <div 
              className="profile-train-marker"
              style={{ left: `${route?.progressPct || 0}%` }}
            >
              <div className="marker-speech-bubble font-mono">
                <span className="bubble-id">{currentTrainId}</span>
                <span className="bubble-speed">{telemetry.currentSpeed} KM/H</span>
                <span className="bubble-arrow">▼</span>
              </div>
              <div className="marker-core-dot">
                <span className="dot-ripple"></span>
              </div>
              <div className="marker-stem-line">
                <span className="stem-label font-mono">▲ CURRENT POSITION</span>
              </div>
            </div>

            {/* Waypoint Pins along the track */}
            <div className="profile-waypoints-overlay">
              {waypoints.map((wp, idx) => {
                const leftPct = route?.currentSectionLengthKm
                  ? (wp.km / route.currentSectionLengthKm) * 100
                  : 0;
                return (
                  <div 
                    key={idx} 
                    className={`waypoint-node-pin ${wp.isCurrent ? 'is-current-pin' : ''} ${wp.passed ? 'is-passed-pin' : 'is-upcoming-pin'}`}
                    style={{ left: `${leftPct}%` }}
                  >
                    <div className="pin-tick"></div>
                    <div className="pin-meta-box font-mono">
                      <span className="pin-name font-bold">{wp.name}</span>
                      <span className="pin-km">KM {wp.km.toFixed(1)}</span>
                      <span className="pin-note">{wp.note}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Linear Track Footer Legend */}
        <div className="loco-profile-footer font-mono">
          <div className="legend-item">
            <span className="legend-box box-passed"></span>
            <span>TRAVERSED SECTION ({traversedKm.toFixed(1)} KM)</span>
          </div>
          <div className="legend-item">
            <span className="legend-box box-upcoming"></span>
            <span>UPCOMING CLEAR CORRIDOR ({remainingKm.toFixed(1)} KM)</span>
          </div>
          <div className="legend-item">
            <span className="legend-box box-target"></span>
            <span>DECELERATION ZONE (LIVE APPROACH)</span>
          </div>
          <div className="legend-item text-green">
            <span>END OF AUTHORITY (EOA): {destinationLabel} BUFFER STOPS</span>
          </div>
        </div>

      </div>
    </div>
  );
}
