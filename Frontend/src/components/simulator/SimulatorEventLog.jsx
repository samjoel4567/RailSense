import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorEventLog() {
  const { status } = useSimulation();

  const getStatusDotClass = (phase) => {
    switch (phase) {
      case 5:
        return 'dot-critical';
      case 4:
        return 'dot-conflict';
      case 2:
        return 'dot-warning';
      case 3:
        return 'dot-info';
      case 1:
      default:
        return 'dot-normal';
    }
  };

  return (
    <div className="sim-panel-card sim-event-log-card">
      <div className="sim-panel-header">
        <div className="sim-panel-title-group font-mono">
          <span className="sim-panel-indicator bg-blue"></span>
          <h3 className="sim-panel-title">SIMULATION EVENT LOG</h3>
          <span className="sim-panel-count font-mono">({status.eventLog.length} EVENTS)</span>
        </div>
        <span className="sim-panel-sub font-mono">DETERMINISTIC LIFECYCLE TIMESTAMPS</span>
      </div>

      <div className="sim-event-log-list font-mono">
        {status.eventLog.map((ev, idx) => (
          <div key={idx} className="sim-event-log-item">
            <div className="ev-time-col">
              <span className={`ev-status-bullet ${getStatusDotClass(ev.phase)}`}></span>
              <span className="ev-time-text font-bold">{ev.time}</span>
            </div>

            <div className="ev-phase-badge">
              <span>PHASE {ev.phase}</span>
            </div>

            <div className="ev-desc-col">
              <span className="ev-text">{ev.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="sim-panel-footer font-mono">
        <span>Deterministic event log updates continuously with simulation clock.</span>
      </div>
    </div>
  );
}
