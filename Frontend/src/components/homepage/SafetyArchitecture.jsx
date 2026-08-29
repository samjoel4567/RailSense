import React from 'react';

const safetyModules = [
  {
    id: 'emergency-brake',
    code: 'SAFE-01',
    title: 'EMERGENCY BRAKE',
    category: 'PNEUMATIC ATP INTERVENTION',
    badge: 'SUB-SECOND',
    badgeColor: 'red',
    desc: 'Fail-safe automatic train protection (ATP) venting brake pipe pressure instantaneously upon SPAD or integrity breach.',
    specs: ['Response: < 250ms', 'CENELEC SIL-4', 'Triple-modular redundant valve line']
  },
  {
    id: 'vigilance-dsd',
    code: 'SAFE-02',
    title: 'VIGILANCE / DSD',
    category: 'DRIVER SAFETY DEVICE',
    badge: '60S CYCLE',
    badgeColor: 'amber',
    desc: 'Continuous vigilance cycle checking driver alertness via foot pedal and acknowledge console with progressive audible warnings.',
    specs: ['Cycle: 60s nominal / 8s warn', 'Auto-brake trigger on timeout', 'Telemetry sync to OCC']
  },
  {
    id: 'dispatcher-radio',
    code: 'SAFE-03',
    title: 'DISPATCHER RADIO',
    category: 'MISSION-CRITICAL VOICE & DATA',
    badge: 'GSM-R / LTE-R',
    badgeColor: 'blue',
    desc: 'Direct full-duplex digital voice link and emergency broadcast channel between Loco Pilot, Station Master, and Central Dispatch.',
    specs: ['Priority 0 Emergency Call', 'QoS 99.999% reliability', 'Encrypted digital telemetry link']
  },
  {
    id: 'traction-trip',
    code: 'SAFE-04',
    title: 'TRACTION TRIP',
    category: '25KV OHE ISOLATION',
    badge: 'HIGH VOLTAGE',
    badgeColor: 'red',
    desc: 'Immediate pantograph lower and sub-station vacuum circuit breaker (VCB) cutoff in the event of track obstruction or de-wire risk.',
    specs: ['Arc suppression < 40ms', 'Sectionalized substation trip', 'Automatic SCADA handshake']
  },
  {
    id: 'speed-restriction',
    code: 'SAFE-05',
    title: 'SPEED RESTRICTION',
    category: 'DYNAMIC TSR ENFORCEMENT',
    badge: 'ETCS LEVEL 2',
    badgeColor: 'amber',
    desc: 'Continuous braking curve calculation supervising permissible ceiling, warning speed, and intervention speed dynamically.',
    specs: ['Dynamic gradient compensation', 'Track condition advisory', 'Automatic service brake clamp']
  },
  {
    id: 'route-interlocking',
    code: 'SAFE-06',
    title: 'ROUTE INTERLOCKING',
    category: 'SOLID STATE FAIL-SAFE',
    badge: 'FAIL-SAFE',
    badgeColor: 'green',
    desc: 'Electronic interlocking (EI) verifying complete switch point detection and track circuit clearance prior to signal clearance.',
    specs: ['2-out-of-3 architecture', 'Flank protection locked', 'Zero conflicting route release']
  }
];

export default function SafetyArchitecture() {
  return (
    <section className="safety-architecture-section" id="safety">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="system-tag-badge font-mono">
            <span className="badge-bullet bg-red"></span>
            <span>FAIL-SAFE INTEGRITY</span>
          </div>

          <h2 className="section-main-title">
            Safety &amp; Emergency Architecture
          </h2>

          <p className="section-description">
            Engineered in strict compliance with international railway RAMS standards (CENELEC EN 50126, EN 50128, EN 50129) and ETCS Level 2 specifications.
          </p>
        </div>

        {/* 6 Clean Technical Safety Cards Grid */}
        <div className="safety-cards-grid">
          {safetyModules.map((module) => (
            <div key={module.id} className="safety-module-card">
              
              <div className="safety-card-header font-mono">
                <span className="module-code">{module.code}</span>
                <span className={`module-badge badge-${module.badgeColor}`}>{module.badge}</span>
              </div>

              <div className="safety-card-body">
                <h3 className="module-title font-mono">{module.title}</h3>
                <span className="module-cat font-mono">{module.category}</span>
                <p className="module-desc">{module.desc}</p>
              </div>

              {/* Technical Specifications List */}
              <div className="safety-card-specs font-mono">
                {module.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="spec-item">
                    <span className="spec-dot">&bull;</span>
                    <span>{spec}</span>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
