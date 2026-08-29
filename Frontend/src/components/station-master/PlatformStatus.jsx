import React from 'react';

export default function PlatformStatus({ 
  stationBPlatforms = [], 
  stationCPlatforms = [], 
  selectedEntity, 
  onSelectPlatform 
}) {
  const getOccupancyClass = (state) => {
    switch (state) {
      case 'OCCUPIED':
        return 'plat-occupied';
      case 'DEPARTING':
        return 'plat-departing';
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
          <h3 className="cr-panel-title">PLATFORM OCCUPANCY (STATION B vs STATION C)</h3>
          <span className="cr-panel-count font-mono">(6 BERTHS TOTAL)</span>
        </div>
        <span className="cr-panel-sub font-mono">ORIGIN vs DESTINATION BERTH STATES</span>
      </div>

      <div className="sm-dual-platform-sections">
        
        {/* =========================================================================
            STATION B PLATFORMS GROUP
            ========================================================================= */}
        <div className="platform-station-group">
          <div className="group-sub-header font-mono">
            <span className="group-title">STATION B (ORIGIN PLATFORMS)</span>
            <span className="group-count">3 PLATFORMS</span>
          </div>

          <div className="sm-platforms-list">
            {stationBPlatforms.map((plat) => {
              const isSelected = selectedEntity === plat.id || selectedEntity === plat.trainId;
              return (
                <div 
                  key={plat.id}
                  className={`sm-plat-item ${getOccupancyClass(plat.state)} ${isSelected ? 'is-selected-plat' : ''}`}
                  onClick={() => onSelectPlatform && onSelectPlatform(plat.id, plat.trainId)}
                >
                  <div className="plat-item-top">
                    <div className="plat-num-group">
                      <span className="plat-big-num font-mono">{plat.number}</span>
                      <div className="plat-meta-lines">
                        <span className="plat-name font-bold">Station B - {plat.name}</span>
                        <span className="plat-track font-mono">{plat.assignedTrack}</span>
                      </div>
                    </div>

                    <div className={`plat-state-badge font-mono ${getOccupancyClass(plat.state)}`}>
                      <span className="plat-state-dot"></span>
                      <span>{plat.state}</span>
                    </div>
                  </div>

                  <div className="plat-detail-box font-mono">
                    {plat.state === 'OCCUPIED' && (
                      <div className="plat-train-assigned">
                        <span className="assigned-label">OCCUPIED BY:</span>
                        <span className="assigned-train text-amber font-bold">{plat.trainId} ({plat.trainType}) ➔ {plat.destination}</span>
                        <span className="assigned-note">DWELL TIME: +{plat.dwellMinutes}m (DELAYED)</span>
                      </div>
                    )}
                    {plat.state === 'DEPARTING' && (
                      <div className="plat-train-assigned">
                        <span className="assigned-label">DEPARTED INTO SECTION B:</span>
                        <span className="assigned-train text-green font-bold">{plat.trainId} ({plat.trainType}) ➔ {plat.destination}</span>
                        <span className="assigned-note">SECTION B TRANSIT ACTIVE</span>
                      </div>
                    )}
                    {plat.state === 'CLEAR' && (
                      <div className="plat-train-assigned">
                        <span className="assigned-label">STANDBY STATUS:</span>
                        <span className="assigned-train text-muted">TRACK VACANT & CLEAR</span>
                        <span className="assigned-note">AVAILABLE FOR INBOUND TRAFFIC</span>
                      </div>
                    )}
                  </div>

                  <div className="plat-specs-row font-mono">
                    <span>LENGTH: {plat.lengthMeters}M</span>
                    <span>SIGNAL: {plat.signalId} [{plat.signalAspect}]</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            STATION C PLATFORMS GROUP
            ========================================================================= */}
        <div className="platform-station-group">
          <div className="group-sub-header font-mono">
            <span className="group-title">STATION C (DESTINATION PLATFORMS)</span>
            <span className="group-count">3 PLATFORMS</span>
          </div>

          <div className="sm-platforms-list">
            {stationCPlatforms.map((plat) => {
              const isSelected = selectedEntity === plat.id || selectedEntity === plat.reservedForTrainId || selectedEntity === plat.trainId;
              return (
                <div 
                  key={plat.id}
                  className={`sm-plat-item ${getOccupancyClass(plat.state)} ${isSelected ? 'is-selected-plat' : ''}`}
                  onClick={() => onSelectPlatform && onSelectPlatform(plat.id, plat.reservedForTrainId || plat.trainId)}
                >
                  <div className="plat-item-top">
                    <div className="plat-num-group">
                      <span className="plat-big-num font-mono">{plat.number}</span>
                      <div className="plat-meta-lines">
                        <span className="plat-name font-bold">Station C - {plat.name}</span>
                        <span className="plat-track font-mono">{plat.assignedTrack}</span>
                      </div>
                    </div>

                    <div className={`plat-state-badge font-mono ${getOccupancyClass(plat.state)}`}>
                      <span className="plat-state-dot"></span>
                      <span>{plat.state}</span>
                    </div>
                  </div>

                  <div className="plat-detail-box font-mono">
                    {plat.state === 'RESERVED' && (
                      <div className="plat-train-assigned">
                        <span className="assigned-label">PRE-RESERVED FOR:</span>
                        <span className="assigned-train text-blue font-bold">{plat.reservedForTrainId} (FROM SECTION B)</span>
                        <span className="assigned-note">ETA: 8 MIN // ROUTE SECURED</span>
                      </div>
                    )}
                    {plat.state === 'OCCUPIED' && (
                      <div className="plat-train-assigned">
                        <span className="assigned-label">OCCUPIED BY:</span>
                        <span className="assigned-train text-green font-bold">{plat.trainId} ({plat.trainType}) ➔ {plat.destination}</span>
                        <span className="assigned-note">BOARDING // DEPART 14:47</span>
                      </div>
                    )}
                    {plat.state === 'CLEAR' && (
                      <div className="plat-train-assigned">
                        <span className="assigned-label">STANDBY STATUS:</span>
                        <span className="assigned-train text-muted">TRACK VACANT & CLEAR</span>
                        <span className="assigned-note">AVAILABLE FOR DIVERSIONS</span>
                      </div>
                    )}
                  </div>

                  <div className="plat-specs-row font-mono">
                    <span>LENGTH: {plat.lengthMeters}M</span>
                    <span>SIGNAL: {plat.signalId} [{plat.signalAspect}]</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="cr-panel-footer font-mono">
        <span>Click any platform to inspect its train allocation and interlocking route locking.</span>
      </div>
    </div>
  );
}
