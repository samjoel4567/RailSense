import React from 'react';

const pipelineSteps = [
  {
    step: '01',
    label: 'TRAIN MOVEMENT',
    tag: 'PHYSICAL SENSING',
    desc: 'Axle counters, balise telegrams, and GPS/INS track continuously moving trains.',
    detail: 'Telemetry frequency: 100ms'
  },
  {
    step: '02',
    label: 'REAL-TIME STATE',
    tag: 'TOPOLOGY FUSION',
    desc: 'Instantaneous correlation with track circuit locks, interlocking points, and switch alignment.',
    detail: 'SIL-4 Solid-State Interlocking'
  },
  {
    step: '03',
    label: 'ETA PREDICTION',
    tag: 'TRAJECTORY MATH',
    desc: 'Kinematic calculation accounting for train weight, braking curve, track gradient, and speed limit.',
    detail: '120-min forward lookahead'
  },
  {
    step: '04',
    label: 'CONFLICT DETECTION',
    tag: 'HEADWAY RADAR',
    desc: 'Identifies converging routes, platform bottlenecks, and headway margin violations before they occur.',
    detail: 'Zero false-positive threshold'
  },
  {
    step: '05',
    label: 'RECOMMENDED ACTION',
    tag: 'DECISION SUPPORT',
    desc: 'Generates deterministic "Hold / Proceed / Divert" options with calculated delay savings.',
    detail: 'Operator advisory protocol'
  },
  {
    step: '06',
    label: 'SAFER / FASTER OPERATION',
    tag: 'SYSTEM OUTCOME',
    desc: 'Zero collision risk, reduced energy consumption from avoided braking, and eliminated cascading delays.',
    detail: 'Deterministic Network Flow'
  }
];

export default function PredictiveIntelligence() {
  return (
    <section className="predictive-intel-section" id="intelligence">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="system-tag-badge font-mono">
            <span className="badge-bullet bg-green"></span>
            <span>PREDICTIVE SAFETY</span>
          </div>

          <h2 className="section-main-title">
            Detect Conflicts Before They Happen
          </h2>

          <p className="section-description">
            The RAIL//AI predictive engine translates live physical corridor telemetry into deterministic operational foresight, eliminating cascading bottlenecks before trains reach shared junctions.
          </p>
        </div>

        {/* 6-Step Visual Progression Grid */}
        <div className="predictive-flow-grid">
          {pipelineSteps.map((item, index) => (
            <div key={item.step} className="flow-step-card">
              
              <div className="step-card-top font-mono">
                <span className="step-number">{item.step}</span>
                <span className="step-tag">{item.tag}</span>
              </div>

              <div className="step-card-body">
                <h3 className="step-title font-mono">{item.label}</h3>
                <p className="step-desc">{item.desc}</p>
              </div>

              <div className="step-card-bottom font-mono">
                <span className="step-detail-label">METRIC:</span>
                <span className="step-detail-val">{item.detail}</span>
              </div>

              {/* Sequential Connector Arrow */}
              {index < pipelineSteps.length - 1 && (
                <div className="step-connector-arrow">
                  <span>&rarr;</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Intelligence Mathematical Benchmark Strip */}
        <div className="intel-benchmark-bar font-mono">
          <div className="bench-cell">
            <span className="bench-val">120 MIN</span>
            <span className="bench-lbl">Forward Conflict Horizon</span>
          </div>
          <div className="bench-divider">|</div>
          <div className="bench-cell">
            <span className="bench-val">&lt; 12 MS</span>
            <span className="bench-lbl">Inference Resolution Time</span>
          </div>
          <div className="bench-divider">|</div>
          <div className="bench-cell">
            <span className="bench-val">100%</span>
            <span className="bench-lbl">Deterministic Conflict Validation</span>
          </div>
          <div className="bench-divider">|</div>
          <div className="bench-cell">
            <span className="bench-val">CENELEC</span>
            <span className="bench-lbl">EN 50128 SIL-4 Certified Logic</span>
          </div>
        </div>

      </div>
    </section>
  );
}
