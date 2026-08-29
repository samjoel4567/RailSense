import React from 'react';

export default function StationSummary({ summary, selectedEntity }) {
  const {
    activeMovements = 4,
    trainsAtStationB = 1,
    trainsInSectionB = 2,
    trainsAtStationC = 1,
    stationRiskScore = 18,
    riskCategory = 'NORMAL'
  } = summary || {};

  return (
    <div className="sm-summary-strip">
      
      {/* 1. Station B Platforms */}
      <div className="summary-pill">
        <span className="summary-pill-label font-mono">STATION B (ORIGIN)</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">3 PLATS</span>
          <span className="summary-pill-sub font-mono text-muted">1 OCCUPIED / 1 DEPARTING</span>
        </div>
      </div>

      {/* 2. Section B Corridor */}
      <div className="summary-pill is-corridor-pill">
        <span className="summary-pill-label font-mono">SECTION B (24.8 KM)</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">{trainsInSectionB} TRAINS</span>
          <span className="summary-pill-sub font-mono text-muted">EXP_201 (118 km/h) ↓ / LOC_102 ↑</span>
        </div>
      </div>

      {/* 3. Station C Platforms */}
      <div className="summary-pill">
        <span className="summary-pill-label font-mono">STATION C (DESTINATION)</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono">3 PLATS</span>
          <span className="summary-pill-sub font-mono text-muted">P1 RESERVED FOR EXP_201</span>
        </div>
      </div>

      {/* 4. Delayed Trains */}
      <div className="summary-pill is-warning-pill">
        <span className="summary-pill-label font-mono">DELAYED TRAINS</span>
        <div className="summary-pill-main">
          <span className="summary-pill-val font-mono text-amber">1</span>
          <span className="summary-pill-sub font-mono text-amber">LOCAL_101 (+8m AT B)</span>
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
      {selectedEntity && (
        <div className="summary-filter-chip font-mono">
          <span className="filter-dot"></span>
          <span>FOCUS: {selectedEntity}</span>
        </div>
      )}

    </div>
  );
}
