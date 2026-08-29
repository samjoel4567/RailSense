import React from 'react';

/**
 * TrafficAheadPanel — Shows trains that MATERIALLY AFFECT the cab train.
 * The Loco Pilot controls only their own train.
 * Other trains are shown for situational awareness only.
 */
export default function TrafficAheadPanel({ cabTrain, trafficAhead = [], prediction }) {
  if (!cabTrain || trafficAhead.length === 0) return null;

  return (
    <div className="traffic-ahead-card">
      <div className="traffic-card-header">
        <div className="traffic-header-left">
          <span className="traffic-badge font-mono">SITUATIONAL AWARENESS</span>
          <h4 className="traffic-title">TRAFFIC AHEAD</h4>
        </div>
        <span className="traffic-count font-mono">{trafficAhead.length} TRAIN{trafficAhead.length > 1 ? 'S' : ''}</span>
      </div>

      <div className="traffic-list">
        {trafficAhead.map((train, idx) => {
          const headwayMin = train.headwayDetails?.headwayMinutes;
          const speedDiff  = Math.round((train.speed || 0) - (cabTrain.speed || 0));
          const distKm     = train.distanceToNextTrain || cabTrain.distanceToNextTrain;

          return (
            <div key={train.id} className={`traffic-item ${idx === 0 ? 'traffic-item-primary' : ''}`}>
              <div className="traffic-item-header font-mono">
                <span className="traffic-item-id">{train.id}</span>
                <span className={`traffic-item-badge type-${train.type?.toLowerCase()}`}>
                  {train.type}
                </span>
                {idx === 0 && <span className="traffic-immediate-badge">IMMEDIATE</span>}
              </div>

              <div className="traffic-item-metrics font-mono">
                <div className="traffic-metric-cell">
                  <span className="tmc-label">SPEED</span>
                  <span className="tmc-val">{Math.round(train.speed || 0)} KM/H</span>
                  {speedDiff !== 0 && (
                    <span className={`tmc-delta ${speedDiff > 0 ? 'delta-fast' : 'delta-slow'}`}>
                      {speedDiff > 0 ? '+' : ''}{speedDiff}
                    </span>
                  )}
                </div>

                <div className="traffic-metric-cell">
                  <span className="tmc-label">SECTION</span>
                  <span className="tmc-val">
                    {train.currentSection?.replace('SEC_','').replace('_','→') ||
                     train.currentStation?.replace('STATION_','') || '–'}
                  </span>
                </div>

                {distKm && (
                  <div className="traffic-metric-cell">
                    <span className="tmc-label">SEPARATION</span>
                    <span className="tmc-val">{distKm.toFixed(1)} KM</span>
                  </div>
                )}

                {headwayMin !== undefined && (
                  <div className="traffic-metric-cell">
                    <span className="tmc-label">HEADWAY</span>
                    <span className={`tmc-val hw-${(train.headwayStatus || 'safe').toLowerCase()}`}>
                      {headwayMin?.toFixed(1) || '–'} MIN
                    </span>
                  </div>
                )}
              </div>

              <div className="traffic-item-status font-mono">
                <span className={`traffic-status-dot dot-${(train.status || '').toLowerCase().replace(/\s/g,'-')}`} />
                <span>{train.status}</span>
                {train.etaAbsolute && <span className="traffic-eta">ETA {train.etaAbsolute}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Note: Loco Pilot cannot control these trains */}
      <div className="traffic-note font-mono">
        ℹ️ Situational awareness only — You control {cabTrain.id} only
      </div>
    </div>
  );
}
