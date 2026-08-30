import React from 'react';
import introVideo from './name_is_RailSense.mp4';

export default function CinematicIntro({ onScrollEnter }) {
  const handleScrollClick = () => {
    if (onScrollEnter) {
      onScrollEnter();
    } else {
      const el = document.getElementById('system-reveal');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="cinematic-intro-section" id="intro">
      {/* Background Video Layer */}
      <div className="cinematic-video-container">
        <video
          className="cinematic-video"
          src={introVideo}
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />
        {/* Subtle cinematic gradient vignette & contrast overlay */}
        <div className="cinematic-overlay-vignette" />
        <div className="cinematic-grid-overlay" />
      </div>

      {/* Control System Corner HUD Brackets */}
      <div className="hud-corner hud-corner-tl font-mono">
        <span>SYS//ID: RAIL-AI-902</span>
        <span className="hud-status-chip">ONLINE</span>
      </div>
      <div className="hud-corner hud-corner-tr font-mono">
        <span>CENELEC EN 50128</span>
        <span className="hud-status-chip">SIL-4</span>
      </div>
      <div className="hud-corner hud-corner-bl font-mono">
        <span>CORRIDOR: NORTH-WEST ARTERIAL</span>
        <span className="hud-status-chip">24.8 KM</span>
      </div>
      <div className="hud-corner hud-corner-br font-mono">
        <span>LOOKAHEAD: 120 MIN</span>
        <span className="hud-status-chip">NOMINAL</span>
      </div>

      {/* Main Hero Overlay Content */}
      <div className="cinematic-content">
        <div className="cinematic-badge font-mono">
          <span>REAL-TIME PREDICTIVE SAFETY ARCHITECTURE</span>
        </div>

        <h1 className="cinematic-title">
          RAIL<span className="title-slash">//</span>SENSE
        </h1>

        <p className="cinematic-subtitle">
          Deterministic Railway Decision Intelligence
        </p>

        {/* Minimal status ticker */}
        <div className="cinematic-telemetry-row font-mono">
          <div className="cinematic-telemetry-item">
            <span className="telemetry-key">LATENCY:</span>
            <span className="telemetry-val">&lt; 12ms</span>
          </div>
          <div className="cinematic-telemetry-divider">/</div>
          <div className="cinematic-telemetry-item">
            <span className="telemetry-key">INTERLOCKING:</span>
            <span className="telemetry-val text-green">LOCKED &amp; VERIFIED</span>
          </div>
          <div className="cinematic-telemetry-divider">/</div>
          <div className="cinematic-telemetry-item">
            <span className="telemetry-key">NETWORK RISK:</span>
            <span className="telemetry-val text-green">0.08 LOW</span>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Indicator */}
      <button 
        className="cinematic-scroll-indicator" 
        onClick={handleScrollClick}
        aria-label="Scroll to enter system"
      >
        <span className="scroll-arrow">EXPLORE<span style={{ paddingLeft: '10px' }}> </span>  :)</span>
      </button>
    </section>
  );
}
