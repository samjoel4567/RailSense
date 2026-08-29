import React from 'react';

export default function RiskIndicator({ 
  riskScore = 23, 
  riskCategory = 'NORMAL',
  breakdown = [] 
}) {
  return (
    <div className="cr-panel-card cr-risk-panel">
      {/* Panel Header */}
      <div className="cr-panel-header">
        <div className="cr-panel-title-group">
          <span className="cr-panel-indicator"></span>
          <h3 className="cr-panel-title">NETWORK RISK INDEX</h3>
        </div>
        <span className="cr-panel-sub font-mono">COMPOSITE PROBABILISTIC LOAD</span>
      </div>

      <div className="cr-risk-body">
        {/* Large Score Indicator */}
        <div className="risk-score-display">
          <div className="risk-main-val font-mono">
            <span className="risk-huge-number">{riskScore}</span>
            <span className="risk-max-scale">/ 100</span>
          </div>
          
          <div className="risk-category-badge font-mono status-tag-normal">
            <span className="risk-status-dot"></span>
            <span>{riskCategory}</span>
          </div>
        </div>

        {/* Linear Meter Bar */}
        <div className="risk-meter-track">
          <div 
            className="risk-meter-fill"
            style={{ width: `${Math.min(riskScore, 100)}%` }}
          ></div>
        </div>

        <div className="risk-scale-labels font-mono">
          <span>0 (LOW)</span>
          <span>50 (CAUTION)</span>
          <span>100 (CRITICAL)</span>
        </div>

        {/* Risk Factor Contributors Breakdown */}
        {breakdown.length > 0 && (
          <div className="risk-breakdown-list font-mono">
            <span className="breakdown-heading">TOP RISK CONTRIBUTORS:</span>
            {breakdown.map((item, idx) => (
              <div className="breakdown-item" key={idx}>
                <div className="breakdown-meta">
                  <span className="breakdown-factor">{item.factor}</span>
                  <span className="breakdown-weight">+{item.weightPct}%</span>
                </div>
                <div className="breakdown-bar-bg">
                  <div 
                    className="breakdown-bar-fill"
                    style={{ width: `${item.weightPct * 3}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="cr-panel-footer font-mono">
        <span>Headway & dwell time margins within acceptable deterministic limits.</span>
      </div>
    </div>
  );
}
