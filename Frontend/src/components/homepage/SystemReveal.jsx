import React from 'react';

const interfaceCards = [
  {
    id: 'station-master',
    tag: 'OPERATIONAL INTERFACE 01',
    role: 'STATION MASTER',
    sub: 'Station & Interlocking Control',
    desc: 'Monitor platforms, routes, signals, interlocking and station occupancy.',
    status: 'ACTIVE // 4 PLATFORMS',
    statusColor: 'green',
    metrics: [
      { label: 'PLATFORMS', value: '4 OCCUPIED / 2 FREE' },
      { label: 'INTERLOCKING', value: 'SIL-4 FAIL-SAFE' },
      { label: 'ACTIVE ROUTE', value: '04B ➔ UP MAIN' }
    ],
    features: ['Track Block Occupancy', 'Points & Route Locking', 'Signal Aspect Control', 'Station Berthing Management']
  },
  {
    id: 'control-room',
    tag: 'OPERATIONAL INTERFACE 02',
    role: 'CONTROL ROOM',
    sub: 'Corridor-Wide Central Dispatch',
    desc: 'Monitor the complete railway corridor, train positions, conflicts, delays and network risk.',
    status: 'NOMINAL // 4 TRAINS',
    statusColor: 'green',
    metrics: [
      { label: 'CORRIDOR', value: '24.8 KM DUAL-PAIR' },
      { label: 'LOOKAHEAD', value: '120 MIN HORIZON' },
      { label: 'RISK SCORE', value: '0.08 (NOMINAL)' }
    ],
    features: ['Multi-Train Telemetry', 'Predictive Conflict Radar', 'Delay Propagation Tree', 'Dynamic TSR Matrix']
  },
  {
    id: 'loco-pilot',
    tag: 'OPERATIONAL INTERFACE 03',
    role: 'LOCO PILOT',
    sub: 'Driver Cab DMI & Safety Panel',
    desc: 'Provide the driver with real-time speed, ETA, route status, warnings and movement decisions.',
    status: 'ETCS L2 // NOMINAL',
    statusColor: 'green',
    metrics: [
      { label: 'CURRENT CAB', value: 'LOCAL_101 (WAP-7)' },
      { label: 'SPEED CEILING', value: '100 KM/H TARGET' },
      { label: 'BRAKING CURVE', value: 'DYNAMIC RESTRICTED' }
    ],
    features: ['ETCS Level 2 DMI Dial', 'Braking Target Distance', 'Vigilance / DSD Cycle', 'Live Radio Dispatch Feed']
  },
  {
    id: 'passenger',
    tag: 'CUSTOMER INTERFACE 04',
    role: 'PASSENGER PORTAL',
    sub: 'Journey Planner & Live ETA',
    desc: 'Public traveler portal: search routes, track approaching trains, live station boards, and real-time ETAs.',
    status: 'LIVE // 30 TRAINS',
    statusColor: 'green',
    metrics: [
      { label: 'CORRIDOR', value: '10 STATIONS' },
      { label: 'LIVE TRAFFIC', value: '30 SERVICES' },
      { label: 'PREDICTED ETA', value: 'CONTINUOUS' }
    ],
    features: ['From / To Journey Search', 'Predicted Arrival Times', 'Live Train Progress Track', 'Platform Arrival Boards']
  }
];

export default function SystemReveal({ onNavigate }) {
  return (
    <section className="system-reveal-section" id="system-reveal">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="system-tag-badge font-mono">
            <span className="badge-bullet"></span>
            <span>SYSTEM ARCHITECTURE</span>
          </div>

          <h2 className="section-main-title">
            RAIL<span className="text-red">//</span>AI
            <span className="section-sub-title">RAILWAY DECISION INTELLIGENCE</span>
          </h2>

          <p className="section-quote-lead">
            &ldquo;From real-time train movement to predictive conflict detection.&rdquo;
          </p>

          <p className="section-description">
            A unified deterministic operational picture coordinating station operations, corridor-level dispatch, and in-cab train control with sub-second telemetry precision.
          </p>
        </div>

        {/* 3 Operational Interfaces Grid */}
        <div className="interfaces-grid">
          {interfaceCards.map((card) => (
            <div 
              key={card.id} 
              className="interface-card"
              onClick={() => onNavigate && onNavigate(card.id)}
            >
              <div className="interface-card-header">
                <span className="interface-tag font-mono">{card.tag}</span>
                <div className="interface-status-chip font-mono">
                  <span className={`status-dot status-${card.statusColor}`} />
                  <span>{card.status}</span>
                </div>
              </div>

              <div className="interface-card-body">
                <h3 className="interface-name">{card.role}</h3>
                <span className="interface-subtitle font-mono">{card.sub}</span>
                <p className="interface-desc">{card.desc}</p>
              </div>

              {/* Technical Metrics Strip */}
              <div className="interface-metrics-strip font-mono">
                {card.metrics.map((m, idx) => (
                  <div key={idx} className="interface-metric-item">
                    <span className="m-label">{m.label}</span>
                    <span className="m-val">{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Features List */}
              <ul className="interface-features-list">
                {card.features.map((feat, i) => (
                  <li key={i} className="font-mono">
                    <span className="feat-check">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {/* Launch Action */}
              <div className="interface-card-footer">
                <button 
                  className="btn-interface-launch"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigate) onNavigate(card.id);
                  }}
                >
                  <span>Launch {card.role}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
