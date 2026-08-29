import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorHeader() {
  const { status, controls } = useSimulation();

  return (
    <div className="sim-header-card">
      <div className="sim-header-top">
        
        {/* Left Title & Status */}
        <div className="sim-title-group">
          <div className="sim-badge-row">
            <span className={`sim-status-pill font-mono ${status.isRunning ? 'status-running' : 'status-paused'}`}>
              <span className="status-dot"></span>
              {status.isRunning ? 'RUNNING' : 'PAUSED'}
            </span>
            <span className="sim-corridor-tag font-mono">CENTRAL RAILWAY // CSMT TO KALYAN CORRIDOR</span>
          </div>

          <h1 className="sim-main-title">RAIL//AI SIMULATOR</h1>
          <p className="sim-subtitle font-mono">
            OPERATIONAL LIFECYCLE: STATION B (VIKHROLI) ➔ SECTION B (24.8 KM) ➔ STATION C (NAHUR)
          </p>
        </div>

        {/* Right Clock & Playback Actions */}
        <div className="sim-controls-wrapper font-mono">
          
          {/* Simulation Clock Display */}
          <div className="sim-header-clock-box">
            <span className="sim-clock-lbl">SIMULATION TIME</span>
            <span className="sim-clock-val">{status.simulationTime}</span>
          </div>

          {/* Action Buttons */}
          <div className="sim-header-btn-row">
            <button 
              className={`sim-btn ${status.isRunning ? 'sim-btn-active' : 'sim-btn-primary'}`}
              onClick={controls.togglePlayPause}
            >
              {status.isRunning ? 'Ⅱ PAUSE' : '▶ PLAY'}
            </button>

            <button 
              className="sim-btn sim-btn-secondary"
              onClick={controls.reset}
            >
              ↻ RESET
            </button>

            <button 
              className="sim-btn sim-btn-secondary"
              onClick={controls.prevPhase}
              disabled={status.phase <= 1}
            >
              ← PREV
            </button>

            <button 
              className="sim-btn sim-btn-secondary"
              onClick={controls.nextPhase}
            >
              NEXT →
            </button>

            <button 
              className={`sim-btn ${status.autoPlay ? 'sim-btn-auto-on' : 'sim-btn-secondary'}`}
              onClick={controls.toggleAutoPlay}
            >
              AUTO PLAY [{status.autoPlay ? 'ON' : 'OFF'}]
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
