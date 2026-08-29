import React from 'react';

const pipelineStages = [
  {
    step: '01',
    title: 'PREDICT',
    sub: 'HORIZON MODELING',
    desc: 'Forecast conflict zones & headway bottlenecks up to 120 minutes ahead across multi-track corridors.',
    badge: 'PROBABILISTIC'
  },
  {
    step: '02',
    title: 'DETECT',
    sub: 'ASSET INTEGRITY',
    desc: 'Identify track circuit drift, balise telemetry loss, and track intrusions with zero false-alarm flood.',
    badge: 'EDGE VISION'
  },
  {
    step: '03',
    title: 'CORRELATE',
    sub: 'NETWORK FUSION',
    desc: 'Unify real-time SCADA feeds, interlocking matrices, and locomotive axle counter telemetry.',
    badge: 'SYNCHRONIZED'
  },
  {
    step: '04',
    title: 'ESCALATE',
    sub: 'DISPATCH ADVISORY',
    desc: 'Generate deterministic, SIL-4 compliant resolution vectors for human dispatchers.',
    badge: 'OPERATOR PROTOCOL'
  }
];

export default function IntelligenceStrip() {
  return (
    <section className="pipeline-section" id="intelligence">
      <div className="pipeline-wrapper">
        
        {/* Section Header */}
        <div className="pipeline-header">
          <div className="pipeline-header-tag font-mono">
            <span className="tag-dot"></span>
            <span>SYSTEM PIPELINE ARCHITECTURE</span>
          </div>
          <h2 className="pipeline-title">Deterministic Operational Sequence</h2>
        </div>

        {/* 4-Stage Light Industrial Sequence Grid */}
        <div className="pipeline-grid">
          {pipelineStages.map((stage, idx) => (
            <div className="pipeline-node" key={stage.step}>
              <div className="node-box">
                
                <div className="node-head">
                  <span className="node-num font-mono">{stage.step}</span>
                  <span className="node-tag font-mono">{stage.badge}</span>
                </div>

                <div className="node-content">
                  <h3 className="node-heading">{stage.title}</h3>
                  <div className="node-subline font-mono">{stage.sub}</div>
                  <p className="node-paragraph">{stage.desc}</p>
                </div>

                <div className="node-foot font-mono">
                  <span className="foot-status">STATUS: NOMINAL</span>
                  <span className="foot-arrow">→</span>
                </div>

              </div>

              {/* Connecting flow arrow between nodes */}
              {idx < pipelineStages.length - 1 && (
                <div className="pipeline-flow-arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Operator Safety Mandate Callout */}
        <div className="operator-mandate-card" id="safety">
          <div className="mandate-header">
            <div className="mandate-shield-badge font-mono">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <span>SAFETY INTEGRITY PRINCIPLE // CENELEC EN 50128</span>
            </div>
          </div>

          <blockquote className="mandate-quote">
            “Decision support for railway operators — not autonomous train control.”
          </blockquote>
          
          <div className="mandate-caption font-mono">
            Deterministic human-in-the-loop verification required at every interlocking junction and switch.
          </div>
        </div>

      </div>
    </section>
  );
}
