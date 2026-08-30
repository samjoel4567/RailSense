import React from 'react';

const TYPE_COLORS = {
  EXPRESS:   { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  INTERCITY: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
  REGIONAL:  { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce' },
  COMMUTER:  { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  LOCAL:     { bg: '#fffbeb', border: '#fde68a', text: '#92400e' }
};

const TRAIN_OPTIONS_MAX = 8; // max trains shown in dropdown

export default function LocoHeader({ data, simTime, activeCabId, cabTrain, allTrains = [], onSelectCab }) {
  const colors = cabTrain ? TYPE_COLORS[cabTrain.type] || TYPE_COLORS.LOCAL : TYPE_COLORS.LOCAL;
  const delayMin = Math.round(cabTrain?.delay || 0);
  const trainName = data?.trainName || cabTrain?.id || 'LIVE CAB';
  const serviceType = data?.serviceType || cabTrain?.type || 'RAIL';
  const locoModel = data?.locoModel || 'LIVE ROLLING STOCK';
  const cabId = data?.cabId || activeCabId;
  const driverName = data?.driverName || 'ASSIGNED CREW';

  // Trains available for cab selection (show first 8 per type priority)
  const cabOptions = allTrains
    .filter(t => !t.hasReachedDestination)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, TRAIN_OPTIONS_MAX);

  return (
    <div className="loco-header-card">
      <div className="loco-header-top">
        {/* Left: Mode badge */}
        <div className="loco-header-left">
          <div className="loco-mode-badge-row">
            <span className="loco-mode-badge font-mono">LOCO PILOT CONSOLE</span>
            <span className="loco-phase-chip font-mono">SIM {simTime}</span>
          </div>

          {/* Active cab info */}
          <div className="loco-active-train-row">
            <div className="loco-my-train-label font-mono">MY TRAIN</div>
            <div
              className="loco-train-id-badge font-mono"
              style={{ background: colors.bg, border: `2px solid ${colors.border}`, color: colors.text }}
            >
              {activeCabId}
            </div>
            {cabTrain && (
              <div className="loco-train-meta font-mono">
                <span className="loco-meta-type" style={{ color: colors.text }}>{serviceType}</span>
                <span className="loco-meta-sep">·</span>
                <span>{data?.route?.origin || cabTrain.origin?.replace('STATION_','') || '–'} → {data?.route?.destination || cabTrain.destination?.replace('STATION_','') || '–'}</span>
                {delayMin > 0 && (
                  <span className="loco-delay-chip">+{delayMin} MIN DELAY</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Status + cab selector */}
        <div className="loco-header-right">
          {/* Live status */}
          {cabTrain && (
            <div className="loco-status-chips">
            <div className={`loco-status-chip chip-${(cabTrain.status || '').toLowerCase().replace(/\s/g,'-')}`}>
              <span className="status-dot" />
              {cabTrain.status || 'STANDBY'}
            </div>
            <div className={`loco-headway-chip hw-${(cabTrain.headwayStatus || 'SAFE').toLowerCase()}`}>
              HW {cabTrain.headwayStatus || 'SAFE'}
            </div>
          </div>
          )}

          {/* Cab switcher */}
          <div className="loco-cab-switcher font-mono">
            <label className="cab-switcher-label">SWITCH CAB</label>
            <select
              className="cab-switcher-select"
              value={activeCabId}
              onChange={e => onSelectCab && onSelectCab(e.target.value)}
            >
              {cabOptions.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id} — {t.type} ({t.status || 'TRANSIT'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="loco-header-bottom font-mono" style={{ marginTop: 10, color: '#64748b', fontSize: 12 }}>
        <span style={{ marginRight: 12 }}>{trainName}</span>
        <span style={{ marginRight: 12 }}>{locoModel}</span>
        <span style={{ marginRight: 12 }}>{cabId}</span>
        <span>{driverName}</span>
      </div>
    </div>
  );
}
