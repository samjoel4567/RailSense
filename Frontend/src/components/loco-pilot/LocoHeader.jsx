import React, { useState, useEffect } from 'react';

export default function LocoHeader({ data }) {
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
      </div>

      <div className="loco-header-right font-mono">
        <div className="loco-telemetry-pill">
          <span className="pill-lbl">DRIVER ON DUTY</span>
          <span className="pill-val font-bold">{data.driverName}</span>
        </div>

        <div className="loco-clock-box">
          <span className="clock-lbl">CAB TIME (UTC+2)</span>
          <span className="clock-val font-bold">{time || '14:28:45 CEST'}</span>
        </div>
      </div>
    </div>
  );
}
