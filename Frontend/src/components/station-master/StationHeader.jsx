import React, { useState, useEffect } from 'react';

export default function StationHeader({ 
  stationName = 'STATION B',
  junctionName = 'CENTRAL JUNCTION',
  stationCode = 'STA-B',
  onResetSelection,
  selectedPlatformId 
}) {
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
    <div className="sm-header">
      <div className="sm-header-title-block">
        <div className="sm-header-badge font-mono">
          <span className="sm-status-dot"></span>
          <span>SYSTEM STATUS: OPERATIONAL</span>
          <span className="sm-badge-divider">|</span>
          <span>STATION MASTER DESK</span>
        </div>
        <div className="sm-title-row">
          <h1 className="sm-title">{stationName}</h1>
          <span className="sm-title-junction font-mono">// {junctionName}</span>
        </div>
        <p className="sm-subtitle font-mono">INTERLOCKING NODE [{stationCode}] // PLATFORM CONTROLLER</p>
      </div>

      <div className="sm-header-meta">
        <div className="sm-clock-box font-mono">
          <span className="sm-clock-label">LIVE STATION CLOCK (UTC+2)</span>
          <span className="sm-clock-val">{time || '14:28:45 CEST'}</span>
        </div>

        {selectedPlatformId && (
          <button className="sm-clear-selection-btn font-mono" onClick={onResetSelection}>
            <span>✕ Clear Selection ({selectedPlatformId})</span>
          </button>
        )}
      </div>
    </div>
  );
}
