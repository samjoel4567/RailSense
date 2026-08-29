import React from 'react';

export default function ControlRoomHeader({ onResetSelection, selectedTrainId, simTime, phase }) {

  return (
    <div className="cr-header">
      <div className="cr-header-title-block">
        <div className="cr-header-badge font-mono">
          <span className="cr-status-dot"></span>
          <span>SYSTEM STATUS: OPERATIONAL</span>
          <span className="cr-badge-divider">|</span>
          <span>SIL-4 DETERMINISTIC</span>
        </div>
        <h1 className="cr-title">CONTROL ROOM</h1>
        <p className="cr-subtitle font-mono">LIVE RAILWAY SITUATION // CORRIDOR ALPHA</p>
      </div>

      <div className="cr-header-meta">
        <div className="cr-clock-box font-mono">
          <span className="cr-clock-label">SIM TIME</span>
          <span className="cr-clock-val">{simTime || '14:20:00'}</span>
        </div>
        {phase && <span className="cr-phase-chip font-mono">PHASE {phase}</span>}

        {selectedTrainId && (
          <button className="cr-clear-selection-btn font-mono" onClick={onResetSelection}>
            <span>✕ Clear Focus ({selectedTrainId})</span>
          </button>
        )}
      </div>
    </div>
  );
}
