import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorPhaseNav() {
  const { status, controls } = useSimulation();

  const phases = [
    {
      num: 1,
      title: 'NORMAL',
      phaseLabel: 'PHASE 1',
      subtitle: 'NORMAL OPERATIONS',
      desc: 'Nominal corridor transit flow from Station B to Station C'
    },
    {
      num: 2,
      title: 'LOCAL DELAY',
      phaseLabel: 'PHASE 2',
      subtitle: 'LOCAL TRAIN DELAY',
      desc: 'LOCAL_101 dwell exceeded (+8m) at Station B Platform 1'
    },
    {
      num: 3,
      title: 'EXPRESS APPROACH',
      phaseLabel: 'PHASE 3',
      subtitle: 'EXPRESS APPROACHES',
      desc: 'EXPRESS_201 enters Section B approach to Station C P1'
    },
    {
      num: 4,
      title: 'CONFLICT',
      phaseLabel: 'PHASE 4',
      subtitle: 'PREDICTED CONFLICT',
      desc: 'Junction J-02 predictive conflict (87% probability)'
    },
    {
      num: 5,
      title: 'SAFETY EVENT',
      phaseLabel: 'PHASE 5',
      subtitle: 'SAFETY / VISION EVENT',
      desc: 'AI Vision track obstacle detected on Section B (96% conf)'
    }
  ];

  return (
    <div className="sim-phase-nav-container">
      <div className="sim-phase-grid font-mono">
        {phases.map((p) => {
          const isActive = status.phase === p.num;
          return (
            <button
              key={p.num}
              className={`sim-phase-card ${isActive ? 'is-active-phase' : ''}`}
              onClick={() => controls.setPhase(p.num)}
            >
              <div className="phase-card-top">
                <span className="phase-num-badge">{p.num}</span>
                <span className="phase-card-title">{p.title}</span>
              </div>
              <div className="phase-card-body">
                <div className="phase-main-label font-bold">{p.subtitle}</div>
                <div className="phase-desc-text">{p.desc}</div>
              </div>
              {isActive && (
                <div className="phase-active-indicator">
                  <span>ACTIVE PHASE</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
