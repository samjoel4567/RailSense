import React from 'react';

export default function RiskIndicator({ riskScore = 0, riskCategory = 'NOMINAL', breakdown = {} }) {
  const score = Math.min(100, Math.round(riskScore || 0));
  const cat   = riskCategory || 'NOMINAL';

  const catStyle = {
    NOMINAL:   { color: '#15803d', bg: '#f0fdf4', border: '#86efac', dot: '#10b981' },
    MODERATE:  { color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
    HIGH:      { color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', dot: '#f97316' },
    CRITICAL:  { color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444' }
  }[cat] || { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', dot: '#94a3b8' };

  // Build breakdown items from object
  const breakdownItems = typeof breakdown === 'object' && !Array.isArray(breakdown)
    ? [
        { factor: 'DELAYED TRAINS',   value: breakdown.delayed    || 0, weight: Math.min(30, (breakdown.delayed || 0) * 5) },
        { factor: 'HEADWAY CONSTRAINED', value: breakdown.constrained || 0, weight: Math.min(25, (breakdown.constrained || 0) * 6) },
        { factor: 'ACTIVE CONFLICTS',  value: breakdown.conflicts  || 0, weight: Math.min(40, (breakdown.conflicts || 0) * 10) },
        { factor: 'HAZARD EVENTS',     value: breakdown.hazard     || 0, weight: breakdown.hazard ? 30 : 0 }
      ].filter(i => i.value > 0 || i.weight > 0)
    : (breakdown || []);

  const barColor = score > 70 ? '#ef4444' : score > 45 ? '#f97316' : score > 20 ? '#f59e0b' : '#10b981';

  return (
    <div className="cr-panel-card cr-risk-panel">
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator" />
          <h3 className="cr-panel-title">NETWORK RISK INDEX</h3>
        </div>
        <span className="cr-panel-sub font-mono">COMPOSITE OPERATIONAL LOAD</span>
      </div>

      <div className="cr-risk-body">
        {/* Score */}
        <div className="risk-score-display">
          <div className="risk-main-val font-mono">
            <span className="risk-huge-number" style={{ color: barColor }}>{score}</span>
            <span className="risk-max-scale">/ 100</span>
          </div>
          <div
            className="risk-category-badge font-mono"
            style={{ background: catStyle.bg, border: `1px solid ${catStyle.border}`, color: catStyle.color }}
          >
            <span className="risk-status-dot" style={{ background: catStyle.dot }} />
            <span>{cat}</span>
          </div>
        </div>

        {/* Bar */}
        <div className="risk-meter-track">
          <div
            className="risk-meter-fill"
            style={{ width: `${score}%`, background: barColor, transition: 'width 0.5s, background 0.5s' }}
          />
        </div>
        <div className="risk-scale-labels font-mono">
          <span>0 NOMINAL</span>
          <span>50 MODERATE</span>
          <span>100 CRITICAL</span>
        </div>

        {/* Breakdown */}
        {breakdownItems.length > 0 && (
          <div className="risk-breakdown-list font-mono">
            <span className="breakdown-heading">RISK CONTRIBUTORS</span>
            {breakdownItems.map((item, i) => (
              <div key={i} className="breakdown-item">
                <div className="breakdown-meta">
                  <span className="breakdown-factor">{item.factor}</span>
                  <span className="breakdown-weight">{item.value} ({item.weight}%)</span>
                </div>
                <div className="breakdown-bar-bg">
                  <div className="breakdown-bar-fill" style={{ width: `${Math.min(item.weight * 2, 100)}%`, background: barColor }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="cr-panel-footer font-mono">
        <span>Live risk computed from headway, delay, conflict, and hazard factors.</span>
      </div>
    </div>
  );
}
