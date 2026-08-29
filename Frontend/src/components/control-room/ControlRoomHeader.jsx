import React, { useState, useEffect } from 'react';

export default function ControlRoomHeader({ onResetSelection, selectedTrainId }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s} CEST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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
          <span className="cr-clock-label">SYSTEM TIME (UTC+2)</span>
          <span className="cr-clock-val">{time || '14:28:34 CEST'}</span>
        </div>

        {selectedTrainId && (
          <button className="cr-clear-selection-btn font-mono" onClick={onResetSelection}>
            <span>✕ Clear Focus ({selectedTrainId})</span>
          </button>
        )}
      </div>
    </div>
  );
}
