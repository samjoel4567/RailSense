import React from 'react';

export default function LocoHeader({ data, simTime, activeCabId, onSelectCab }) {
  return (
    <div className="loco-header">
      <div className="loco-header-left">
        <div className="loco-status-badge font-mono">
          <span className="loco-live-dot"></span>
          <span className="text-green font-bold">CAB ONLINE</span>
          <span className="badge-sep">|</span>
          <span>{data.signaling.etcsLevel}</span>
          <span className="badge-sep">|</span>
          <span>{data.signaling.mode}</span>
        </div>

        <div className="loco-title-row">
          <h1 className="loco-title">{data.trainId}</h1>
          <span className="loco-service-tag font-mono">{data.trainName}</span>
          <span className="loco-cab-tag font-mono">{data.cabId}</span>
        </div>

        <p className="loco-subtitle font-mono">
          CORRIDOR: {data.route.origin} ➔ {data.route.currentSection} ➔ {data.route.destination} [{data.route.destinationPlatform}]
        </p>

        {/* Cab Selector Tabs */}
        {onSelectCab && (
          <div className="cab-selector-row font-mono" style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem' }}>
            <button
              className={`cab-select-btn ${activeCabId === 'LOCAL_101' ? 'active' : ''}`}
              onClick={() => onSelectCab('LOCAL_101')}
              style={{
                background: activeCabId === 'LOCAL_101' ? '#10b981' : '#1e293b',
                color: activeCabId === 'LOCAL_101' ? '#020617' : '#94a3b8',
                border: '1px solid ' + (activeCabId === 'LOCAL_101' ? '#34d399' : '#334155'),
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🚆 CAB 1: LOCAL_101 (STATION B P1 DEPARTURE)
            </button>
            <button
              className={`cab-select-btn ${activeCabId === 'EXPRESS_201' ? 'active' : ''}`}
              onClick={() => onSelectCab('EXPRESS_201')}
              style={{
                background: activeCabId === 'EXPRESS_201' ? '#38bdf8' : '#1e293b',
                color: activeCabId === 'EXPRESS_201' ? '#020617' : '#94a3b8',
                border: '1px solid ' + (activeCabId === 'EXPRESS_201' ? '#7dd3fc' : '#334155'),
                padding: '0.35rem 0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⚡ CAB 2: EXPRESS_201 (INTERCITY SECTION B)
            </button>
          </div>
        )}
      </div>

      <div className="loco-header-right font-mono">
        <div className="loco-telemetry-pill">
          <span className="pill-lbl">DRIVER ON DUTY</span>
          <span className="pill-val font-bold">{data.driverName}</span>
        </div>

        <div className="loco-clock-box">
          <span className="clock-lbl">SIMULATION TIME</span>
          <span className="clock-val font-bold">{simTime || '14:20:00'} CEST</span>
        </div>
      </div>
    </div>
  );
}
