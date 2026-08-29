import React, { useState, useEffect, useRef } from 'react';
import trainVideo from '../assets/135986-764371099.mp4';

export default function TrainScene() {
  const [telemetry, setTelemetry] = useState({
    speed: 142.4,
    limit: 160.0,
    targetSpeed: 160.0,
    gradient: -0.4,
    accel: '+0.12',
    distanceToTarget: 1420,
    brakeCurve: 'NOMINAL',
    aspect: 'PROCEED',
    signalId: 'SIG-24B',
    signalColor: 'green',
    segment: 'SEC-09A // KM 142.850',
    interlocking: 'LOCKED // ROUTE 04B',
    baliseId: 'B-8842',
    timestamp: '12:36:12.400'
  });

  const [activeMode, setActiveMode] = useState('optical'); // optical | braking | topology
  const videoRef = useRef(null);

  // Live telemetry & timestamp clock
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}.${String(Math.floor(now.getUTCMilliseconds() / 10)).padStart(2, '0')}`;
      
      setTelemetry(prev => ({
        ...prev,
        speed: +(141.6 + Math.sin(Date.now() / 2400) * 2.6).toFixed(1),
        accel: (Math.sin(Date.now() / 3200) * 0.16).toFixed(2),
        timestamp: timeStr
      }));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="console-wrapper">
      <div className="console-container">
        
        {/* Minimal Light Header Toolbar */}
        <div className="console-header">
          <div className="console-header-left">
            <div className="feed-indicator">
              <span className="feed-rec-dot"></span>
              <span className="feed-label font-mono">FORWARD BOGIE SENSOR</span>
            </div>
            <span className="console-header-divider">/</span>
            <span className="feed-segment font-mono">{telemetry.segment}</span>
          </div>

          <div className="console-mode-tabs">
            <button 
              className={`mode-tab ${activeMode === 'optical' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('optical')}
            >
              Optical
            </button>
            <button 
              className={`mode-tab ${activeMode === 'braking' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('braking')}
            >
              Braking
            </button>
            <button 
              className={`mode-tab ${activeMode === 'topology' ? 'is-active' : ''}`}
              onClick={() => setActiveMode('topology')}
            >
              Interlocking
            </button>
          </div>
        </div>

        {/* Video Canvas Area */}
        <div className={`viewport-container mode-${activeMode}`}>
          <video
            ref={videoRef}
            src={trainVideo}
            autoPlay
            loop
            muted
            playsInline
            className="viewport-video"
          />

          {/* Clean Film Layer */}
          <div className="viewport-overlay-grade"></div>

          {/* Minimal Floating Frosted Telemetry Pills */}
          <div className="viewport-top-hud">
            <div className="hud-meta-badge font-mono">
              <span className="badge-dim">UTC:</span>
              <span className="badge-val">{telemetry.timestamp}</span>
            </div>
            <div className="hud-meta-badge font-mono">
              <span className="badge-dim">POS:</span>
              <span className="badge-val">47.3769°N 8.5417°E</span>
            </div>
            <div className="hud-meta-badge font-mono">
              <span className="badge-dim">BALISE:</span>
              <span className="badge-val">{telemetry.baliseId}</span>
            </div>
          </div>

          {/* Track Geometry Vectors */}
          <svg className="track-vector-layer" viewBox="0 0 800 450" preserveAspectRatio="none">
            <path 
              d="M 60 450 Q 380 340 760 270" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.55)" 
              strokeWidth="1.5" 
              strokeDasharray="6 4"
            />
            <path 
              d="M 160 450 Q 430 345 780 280" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.35)" 
              strokeWidth="1.2"
            />

            {/* Target End of Authority Marker */}
            <circle cx="485" cy="310" r="3" fill="#10B981" />
            <text x="495" y="306" fill="#FFFFFF" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">
              EOA: +1,420m [CLEAR]
            </text>
          </svg>

          {/* Minimal Railway Signal Aspect Head */}
          <div className="signal-aspect-head">
            <div className="signal-mast-box">
              <div className="signal-lamp green is-lit" title="Proceed / Clear"></div>
              <div className="signal-lamp amber" title="Caution"></div>
              <div className="signal-lamp red" title="Stop"></div>
            </div>
            <div className="signal-annotation font-mono">
              <span className="sig-name">{telemetry.signalId}</span>
              <span className="sig-code font-semibold">CLEAR</span>
            </div>
          </div>

          {/* High-Precision Locomotive Speed Dock (Frosted Glass Minimalist) */}
          <div className="telemetry-speed-dock">
            <div className="speed-primary">
              <div className="speed-digits font-mono">{telemetry.speed}</div>
              <div className="speed-unit-group font-mono">
                <span className="unit-label">KM/H</span>
                <span className="limit-label">MAX {telemetry.limit}</span>
              </div>
            </div>

            <div className="speed-progress-bar">
              <div 
                className="speed-progress-fill" 
                style={{ width: `${(telemetry.speed / telemetry.limit) * 100}%` }}
              ></div>
            </div>

            <div className="speed-secondary-row font-mono">
              <span className="sec-stat">ACCEL: {telemetry.accel} m/s²</span>
              <span className="sec-stat">GRAD: {telemetry.gradient}%</span>
            </div>
          </div>

          {/* Interlocking Status Dock */}
          <div className="telemetry-interlock-dock font-mono">
            <div className="dock-row">
              <span className="dock-key">INTERLOCKING</span>
              <span className="dock-val text-green font-semibold">ROUTE LOCKED</span>
            </div>
            <div className="dock-row">
              <span className="dock-key">CAB SIGNAL</span>
              <span className="dock-val">ETCS LEVEL 2</span>
            </div>
            <div className="dock-row">
              <span className="dock-key">BRAKE ADVISORY</span>
              <span className="dock-val text-blue font-semibold">NOMINAL COAST</span>
            </div>
          </div>

        </div>

        {/* Console Light Bottom Status Bar */}
        <div className="console-footer font-mono">
          <div className="console-footer-col">
            <span className="footer-status-indicator"></span>
            <span>EDGE INFERENCE ACTIVE</span>
          </div>
          <div className="console-footer-col">
            <span>ETCS L2 ATO READY</span>
          </div>
          <div className="console-footer-col">
            <span>SIL-4 CERTIFIED</span>
          </div>
        </div>

      </div>
    </div>
  );
}
