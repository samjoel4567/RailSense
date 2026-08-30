import React from 'react';

export default function NetworkSummary({ 
  activeTrains = 4, 
  delayedTrains = 1, 
  activeAlerts = 2, 
  networkRisk = 23,
  selectedTrainId,
  selectedSectionId 
}) {
  return (
    <div className="cr-summary-strip">
      
      {/* Metric 1: Active Trains */}
      <div className="summary-pill">
        <span className="summary-pill-label font-mono">ACTIVE TRAINS</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">{activeTrains}</span>
          <span className="summary-pill-sub font-mono text-muted">2 LOCAL / 2 EXP</span>
        </div>
      </div>

      {/* Metric 2: Delayed Trains */}
      <div className={`summary-pill ${delayedTrains > 0 ? 'is-warning-pill' : ''}`}>
        <span className="summary-pill-label font-mono">DELAYED</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono text-amber">{delayedTrains}</span>
          <span className="summary-pill-sub font-mono text-amber">LOCAL_101 (+8m)</span>
        </div>
      </div>

      {/* Metric 3: Active Alerts */}
      <div className={`summary-pill ${activeAlerts > 0 ? 'is-alert-pill' : ''}`}>
        <span className="summary-pill-label font-mono">ACTIVE ALERTS</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono text-red">{activeAlerts}</span>
          <span className="summary-pill-sub font-mono text-red">1 WARN / 1 PRED</span>
        </div>
      </div>

      {/* Metric 4: Network Risk */}
      <div className="summary-pill is-risk-pill">
        <span className="summary-pill-label font-mono">NETWORK RISK</span>
        <div className="summary-pill-main">
          <div className="risk-num-group">
            <span className="summary-pill-val font-mono">{networkRisk}</span>
            <span className="risk-unit font-mono">/ 100</span>
          </div>
          <span className="summary-pill-tag font-mono status-tag-normal">NORMAL</span>
        </div>
      </div>

      {/* Dynamic Context Hint if Train/Section selected */}
      {(selectedTrainId || selectedSectionId) && (
        <div className="summary-filter-chip font-mono">
          <span className="filter-dot"></span>
          <span>FILTER: {selectedTrainId || selectedSectionId}</span>
        </div>
      )}
      
    </div>
  );
}
