import React, { useState } from 'react';

export default function EmergencyControls({ safety }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [radioLinked, setRadioLinked] = useState(true);

  return (
    <div className="loco-panel-card loco-emergency-card">
      {/* Panel Toolbar */}
      <div className="loco-panel-toolbar font-mono">
        <div className="toolbar-left">
          <span className="live-pulse-dot is-amber-dot"></span>
          <span className="toolbar-title">EMERGENCY & SAFETY OVERRIDE CONSOLE</span>
        </div>
        <span className="emergency-mode-pill font-mono">STANDBY / SAFETY PROTOCOLS ARMED</span>
      </div>

      <div className="loco-emergency-body">
        
        {/* Button 1: Emergency Brake (EOB) Button */}
        <div className="emergency-action-tile is-eob-tile">
          <div className="tile-top font-mono">
            <span className="tile-indicator is-eob-indicator"></span>
            <span className="tile-badge text-red">FAILSAFE EB</span>
          </div>
          <button 
            className="btn-emergency-eob font-mono"
            onClick={() => alert('Emergency Brake Override Standby: System is in nominal Full Supervision mode.')}
          >
            <span className="eob-icon">🛑</span>
            <span className="eob-main-text">EMERGENCY BRAKE (EB)</span>
            <span className="eob-sub-text">DIRECT VENT TO ATMOSPHERE</span>
          </button>
          <span className="tile-status-note font-mono text-muted">STATUS: ARMED / ZERO LEAKAGE</span>
        </div>

        {/* Button 2: Driver Safety Device (DSD) Vigilance Reset */}
        <div className="emergency-action-tile">
          <div className="tile-top font-mono">
            <span className="tile-indicator is-green-dot"></span>
            <span className="tile-badge text-green">VIGILANCE / DSD</span>
          </div>
          <button 
            className={`btn-safety-action font-mono ${acknowledged ? 'is-ack' : ''}`}
            onClick={() => setAcknowledged(!acknowledged)}
          >
            <span className="action-icon">⏱️</span>
            <span className="action-main-text">
              {acknowledged ? 'DSD VIGILANCE CONFIRMED' : 'ACKNOWLEDGE DSD (RESET 60s)'}
            </span>
            <span className="action-sub-text">CYCLIC DEADMAN CYCLE</span>
          </button>
          <span className="tile-status-note font-mono text-green">CYCLE: NOMINAL (24s REMAINING)</span>
        </div>

        {/* Button 3: Dispatcher Direct Voice Radio */}
        <div className="emergency-action-tile">
          <div className="tile-top font-mono">
            <span className="tile-indicator is-green-dot"></span>
            <span className="tile-badge text-blue">CAB-TO-GROUND</span>
          </div>
          <button 
            className="btn-safety-action font-mono"
            onClick={() => setRadioLinked(!radioLinked)}
          >
            <span className="action-icon">🎙️</span>
            <span className="action-main-text">DISPATCHER RADIO (CH-04)</span>
            <span className="action-sub-text">CENTRAL CORRIDOR CONTROLLER</span>
          </button>
          <span className="tile-status-note font-mono text-muted">LINK: 100% SIGNAL DUPLEX</span>
        </div>



      </div>

      <div className="cr-panel-footer font-mono">
        <span>Emergency override panel reserved for SIL-4 automatic failsafe and simulated driver intervention.</span>
      </div>
    </div>
  );
}
