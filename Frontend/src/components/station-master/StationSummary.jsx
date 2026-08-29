import React from 'react';

export default function StationSummary({ summary, selectedPlatformId }) {
  const {
    platformsCount = 3,
    scheduledArrivals = 4,
    scheduledDepartures = 4,
    delayedTrainsCount = 1,
    stationRiskScore = 18,
    riskCategory = 'NORMAL'
  } = summary || {};

  return (
    <div className="sm-summary-strip">
      
      {/* 1. Platforms */}
      <div className="summary-pill">
        <span className="summary-pill-label font-mono">PLATFORMS</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">{platformsCount}</span>
          <span className="summary-pill-sub font-mono text-muted">1 OCCUPIED / 2 CLEAR</span>
        </div>
      </div>

      {/* 2. Arrivals */}
      <div className="summary-pill">
        <span className="summary-pill-label font-mono">ARRIVALS</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">{scheduledArrivals}</span>
          <span className="summary-pill-sub font-mono text-muted">NEXT: 14:28 (EXP_201)</span>
        </div>
      </div>

      {/* 3. Departures */}
      <div className="summary-pill">
        <span className="summary-pill-label font-mono">DEPARTURES</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">{scheduledDepartures}</span>
          <span className="summary-pill-sub font-mono text-muted">NEXT: 14:32 (LOC_101)</span>
        </div>
      </div>

      {/* 4. Delayed Trains */}
      <div className={`summary-pill ${delayedTrainsCount > 0 ? 'is-warning-pill' : ''}`}>
        <span className="summary-pill-label font-mono">DELAYED TRAINS</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono text-amber">{delayedTrainsCount}</span>
          <span className="summary-pill-sub font-mono text-amber">LOCAL_101 (+8m)</span>
        </div>
      </div>

      {/* 5. Station Risk */}
      <div className="summary-pill is-risk-pill">
        <span className="summary-pill-label font-mono">STATION RISK</span>
        <div className="summary-pill-main">
          <div className="risk-num-group">
            <span className="summary-pill-val font-mono">{stationRiskScore}</span>
            <span className="risk-unit font-mono">/ 100</span>
          </div>
          <span className="summary-pill-tag font-mono status-tag-normal">{riskCategory}</span>
        </div>
      </div>

      {/* Dynamic Filter Tag */}
      {selectedPlatformId && (
        <div className="summary-filter-chip font-mono">
          <span className="filter-dot"></span>
          <span>FILTER: {selectedPlatformId}</span>
        </div>
      )}

    </div>
  );
}
