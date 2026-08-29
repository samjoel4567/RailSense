import React from 'react';

export default function PlatformStatus({ 
  platforms = [], 
  selectedPlatformId, 
  onSelectPlatform 
}) {
  const getOccupancyClass = (state) => {
    switch (state) {
      case 'OCCUPIED':
        return 'plat-occupied';
      case 'RESERVED':
        return 'plat-reserved';
      case 'CLEAR':
      default:
        return 'plat-clear';
    }
  };

  return (
    <div className="cr-panel-card sm-platform-card">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator"></span>
          <h3 className="cr-panel-title">PLATFORM STATUS</h3>
          <span className="cr-panel-count font-mono">({platforms.length} BERTHS)</span>
        </div>
        <span className="cr-panel-sub font-mono">REAL-TIME BERTH OCCUPANCY</span>
      </div>

      {/* Platform Cards List */}
      <div className="sm-platforms-list">
        {platforms.map((plat) => {
          const isSelected = selectedPlatformId === plat.id;
          return (
            <div 
              key={plat.id}
              className={`sm-plat-item ${getOccupancyClass(plat.occupancyState)} ${isSelected ? 'is-selected-plat' : ''}`}
              onClick={() => onSelectPlatform && onSelectPlatform(plat.id)}
            >
              {/* Top Row: Platform Num & State Badge */}
              <div className="plat-item-top">
                <div className="plat-num-group">
                  <span className="plat-big-num font-mono">{plat.number}</span>
                  <div className="plat-meta-lines">
                    <span className="plat-name font-bold">{plat.name}</span>
                    <span className="plat-track font-mono">{plat.assignedTrack}</span>
                  </div>
                </div>

                <div className={`plat-state-badge font-mono ${getOccupancyClass(plat.occupancyState)}`}>
                  <span className="plat-state-dot"></span>
                  <span>{plat.occupancyState}</span>
                </div>
              </div>

              {/* Middle Row: Train / Activity Detail */}
              <div className="plat-detail-box font-mono">
                {plat.occupancyState === 'OCCUPIED' && (
                  <div className="plat-train-assigned">
                    <span className="assigned-label">CURRENT BERTH:</span>
                    <span className="assigned-train text-amber font-bold">{plat.currentTrainId} ({plat.trainType})</span>
                    <span className="assigned-note">DWELL TIME: {plat.dwellTimeCurrentSec}s / 90s</span>
                  </div>
                )}
                {plat.occupancyState === 'RESERVED' && (
                  <div className="plat-train-assigned">
                    <span className="assigned-label">APPROACHING INBOUND:</span>
                    <span className="assigned-train text-green font-bold">{plat.approachingTrainId} ({plat.trainType})</span>
                    <span className="assigned-note">ETA: 4 MIN // SPEED 118 km/h</span>
                  </div>
                )}
                {plat.occupancyState === 'CLEAR' && (
                  <div className="plat-train-assigned">
                    <span className="assigned-label">STANDBY STATUS:</span>
                    <span className="assigned-train text-muted">TRACK VACANT & CLEAR</span>
                    <span className="assigned-note">AVAILABLE FOR DIVERSION</span>
                  </div>
                )}
              </div>

              {/* Bottom Specs Row */}
              <div className="plat-specs-row font-mono">
                <span>LEN: {plat.lengthMeters}M</span>
                <span>SIGNAL: {plat.signalId} [{plat.signalAspect}]</span>
                <span>CATENARY: 25.2kV OK</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="cr-panel-footer font-mono">
        <span>Click any platform to inspect track circuit voltage & balise diagnostics.</span>
      </div>
    </div>
  );
}
