import React, { useState } from 'react';
import { useSimulation } from '../../simulator/SimulationContext';
import './SimulatorController.css';

export default function SimulatorController() {
  const { state, status, controls } = useSimulation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);

  const express201 = state.trains.find((t) => t.id === 'EXPRESS_201') || {};
  const local102 = state.trains.find((t) => t.id === 'LOCAL_102') || {};
  const risk = state.network.networkRiskScore;
  const activeAlerts = state.network.activeAlertsCount;

  return (
    <div className={`simulator-hud-wrapper ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Top Banner / Floating Header */}
      <div className="sim-hud-card font-mono">
        
        {/* Main Bar Top: Title, Running Dot, Clock, Quick Controls */}
        <div className="sim-hud-main-bar">
          
          {/* Brand & Status */}
          <div className="sim-hud-brand-group">
            <div className="sim-pulse-indicator">
              <span className={`sim-live-bulb ${status.isRunning ? 'is-running' : 'is-paused'}`}></span>
            </div>
            <div className="sim-title-stack">
              <span className="sim-hud-title font-bold">RAIL//AI SIMULATOR</span>
              <span className="sim-hud-state-tag">
                {status.isRunning ? '● RUNNING' : '⏸ PAUSED'}
              </span>
            </div>
          </div>

          {/* Phase Badge & Description */}
          <div className="sim-phase-pill-display">
            <span className="sim-phase-num font-bold">PHASE {status.phase} / {status.totalPhases}</span>
            <span className="sim-phase-desc">{status.phaseMeta?.shortTitle}</span>
            {/* Phase Progress Bar */}
            <div className="sim-phase-mini-progress">
              <div 
                className="sim-phase-mini-fill" 
                style={{ width: `${status.phaseProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Simulation Time Clock */}
          <div className="sim-clock-display">
            <span className="sim-clock-label">SIM TIME</span>
            <span className="sim-clock-digits font-bold">{status.simulationTime}</span>
          </div>

          {/* Playback Controls */}
          <div className="sim-playback-btn-group">
            <button 
              className={`sim-ctrl-btn ${status.isRunning ? 'btn-active-glow' : ''}`}
              onClick={controls.togglePlayPause}
              title={status.isRunning ? 'Pause Simulation' : 'Start Simulation Clock'}
            >
              {status.isRunning ? '⏸ PAUSE' : '▶ PLAY'}
            </button>

            <button 
              className="sim-ctrl-btn"
              onClick={controls.reset}
              title="Reset to Phase 1 Initial State"
            >
              ↺ RESET
            </button>

            <button 
              className="sim-ctrl-btn"
              onClick={controls.prevPhase}
              disabled={status.phase <= 1}
              title="Step to Previous Scenario Phase"
            >
              ← PREV
            </button>

            <button 
              className="sim-ctrl-btn"
              onClick={controls.nextPhase}
              title="Step to Next Scenario Phase"
            >
              NEXT →
            </button>

            <button 
              className={`sim-ctrl-btn ${status.autoPlay ? 'btn-auto-on' : ''}`}
              onClick={controls.toggleAutoPlay}
              title="Toggle Auto Play Mode"
            >
              AUTO [{status.autoPlay ? 'ON' : 'OFF'}]
            </button>
          </div>

          {/* Action Toggles: Event Log & Collapse */}
          <div className="sim-tools-group">
            <button 
              className={`sim-tool-btn ${showEventLog ? 'is-active-tool' : ''}`}
              onClick={() => setShowEventLog(!showEventLog)}
              title="Toggle Deterministic Event Log"
            >
              📋 LOG ({status.eventLog.length})
            </button>

            <button 
              className="sim-tool-btn btn-collapse-toggle"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Simulator Control Bar' : 'Minimize Simulator Bar'}
            >
              {isCollapsed ? '▲ EXPAND' : '▼ HIDE'}
            </button>
          </div>

        </div>

        {/* Phase Jump Pills */}
        {!isCollapsed && (
          <div className="sim-phases-selector-bar">
            <span className="phases-bar-label">SELECT PHASE:</span>
            {[1, 2, 3, 4, 5].map((pNum) => (
              <button
                key={pNum}
                className={`sim-phase-step-btn ${status.phase === pNum ? 'is-current-phase' : ''}`}
                onClick={() => controls.setPhase(pNum)}
              >
                <span className="step-num">{pNum}</span>
                <span className="step-label">
                  {pNum === 1 ? 'NORMAL' : pNum === 2 ? 'LOCAL DELAY' : pNum === 3 ? 'EXPRESS APPROACH' : pNum === 4 ? 'CONFLICT' : 'SAFETY EVENT'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Real-time Telemetry Snapshot Strip */}
        {!isCollapsed && (
          <div className="sim-telemetry-snapshot-strip">
            
            <div className="telem-item">
              <span className="telem-lbl">SCENARIO:</span>
              <span className="telem-val font-bold text-blue">{status.phaseMeta?.shortTitle}</span>
            </div>

            <div className="telem-item">
              <span className="telem-lbl">EXPRESS_201:</span>
              <span className="telem-val font-bold">
                {express201.speed || 0} KM/H · {express201.progressPct || 0}%
              </span>
            </div>

            <div className="telem-item">
              <span className="telem-lbl">LOCAL_102:</span>
              <span className="telem-val font-bold">
                {local102.speed || 0} KM/H · {local102.progressPct || 0}%
              </span>
            </div>

            <div className="telem-item">
              <span className="telem-lbl">NETWORK RISK:</span>
              <span className={`telem-val font-bold ${risk > 60 ? 'text-red' : risk > 30 ? 'text-amber' : 'text-green'}`}>
                {risk} / 100
              </span>
            </div>

            <div className="telem-item">
              <span className="telem-lbl">ACTIVE ALERTS:</span>
              <span className={`telem-val font-bold ${activeAlerts > 0 ? 'text-amber' : 'text-muted'}`}>
                {activeAlerts}
              </span>
            </div>

          </div>
        )}

        {/* Collapsible Deterministic Simulation Event Log */}
        {!isCollapsed && showEventLog && (
          <div className="sim-event-log-drawer">
            <div className="event-log-head">
              <span className="log-title font-bold">SIMULATION EVENT LOG</span>
              <span className="log-sub text-muted">DETERMINISTIC TIMESTAMPS</span>
            </div>
            <div className="event-log-scroll">
              {status.eventLog.map((logItem, idx) => (
                <div key={idx} className="event-log-line">
                  <span className="log-time font-bold">{logItem.time}</span>
                  <span className="log-divider">│</span>
                  <span className="log-phase-tag">[PHASE {logItem.phase}]</span>
                  <span className="log-text">{logItem.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
