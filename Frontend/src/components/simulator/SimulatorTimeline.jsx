import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorTimeline() {
  const { status, controls } = useSimulation();

  const timelineSteps = [
    { num: 1, label: 'NORMAL' },
    { num: 2, label: 'LOCAL DELAY' },
    { num: 3, label: 'EXPRESS APPROACH' },
    { num: 4, label: 'CONFLICT' },
    { num: 5, label: 'SAFETY EVENT' }
  ];

  // Calculate elapsed and remaining time
  const [hh, mm, ss] = status.simulationTime.split(':').map(Number);
  const totalSec = (hh * 3600) + (mm * 60) + (ss || 0);
  const elapsedSec = Math.max(0, totalSec - (14 * 3600 + 20 * 60));
  const totalDurationSec = 20 * 60; // 20 minutes total demonstration horizon
  const remainingSec = Math.max(0, totalDurationSec - elapsedSec);

  const formatMinSec = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="sim-timeline-card font-mono">
      
      {/* Horizontal Phase Sequence */}
      <div className="sim-timeline-steps-row">
        {timelineSteps.map((step, idx) => {
          const isPassed = status.phase > step.num;
          const isCurrent = status.phase === step.num;
          return (
            <React.Fragment key={step.num}>
              <div 
                className={`timeline-node ${isCurrent ? 'is-current-node' : isPassed ? 'is-passed-node' : 'is-upcoming-node'}`}
                onClick={() => controls.setPhase(step.num)}
              >
                <span className="timeline-node-circle">{step.num}</span>
                <span className="timeline-node-label">{step.label}</span>
              </div>
              {idx < timelineSteps.length - 1 && (
                <div className={`timeline-connector-line ${isPassed ? 'is-passed-line' : ''}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Timing Metrics Row */}
      <div className="sim-timeline-metrics-row">
        <div className="time-metric">
          <span className="metric-lbl">ELAPSED:</span>
          <span className="metric-val font-bold text-navy">{formatMinSec(elapsedSec)}</span>
        </div>
        <div className="metric-sep">│</div>
        <div className="time-metric">
          <span className="metric-lbl">TIME REMAINING:</span>
          <span className="metric-val font-bold text-blue">{formatMinSec(remainingSec)}</span>
        </div>
        <div className="metric-sep">│</div>
        <div className="time-metric">
          <span className="metric-lbl">TOTAL DURATION:</span>
          <span className="metric-val font-bold text-muted">20:00</span>
        </div>
      </div>

    </div>
  );
}
