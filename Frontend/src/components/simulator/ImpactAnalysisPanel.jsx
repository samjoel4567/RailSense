import React from 'react';
import { useSimulation, useImpactAnalysis } from '../../simulator/SimulationContext';

function RiskBadge({ level }) {
  const colors = {
    HIGH: { bg: '#450a0a', border: '#ef4444', text: '#fca5a5' },
    MEDIUM: { bg: '#431407', border: '#f97316', text: '#fdba74' },
    LOW: { bg: '#052e16', border: '#10b981', text: '#6ee7b7' }
  };
  const c = colors[level] || colors.LOW;
  return (
    <span className="risk-badge font-mono" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {level}
    </span>
  );
}

export default function ImpactAnalysisPanel({ onSelectTrain }) {
  const { state, controls } = useSimulation();
  const { activeScenario, impactReport } = useImpactAnalysis();

  if (!activeScenario || !impactReport) {
    return (
      <div className="impact-panel-empty font-mono">
        <div className="impact-empty-icon">📊</div>
        <div className="impact-empty-title">NO ACTIVE SCENARIO</div>
        <div className="impact-empty-sub">Select a train and apply parameter changes to see cascade effects</div>
        <div className="impact-prediction-label">SIMULATION / PREDICTION ENGINE READY</div>
      </div>
    );
  }

  const { trainId, paramChange, summary, deltas, directlyAffected, indirectlyAffected, baseline, modified } = impactReport;
  const { controls: simControls } = useSimulation();

  // Build change description
  const changeDesc = Object.entries(paramChange)
    .map(([k, v]) => {
      if (k === 'speed') return `SPEED: ${baseline[trainId]?.speed || '?'} → ${v} KM/H`;
      if (k === 'targetSpeed') return `TARGET SPEED: ${v} KM/H`;
      if (k === 'speedRestriction') return `RESTRICTION: ${v} KM/H`;
      if (k === 'departureDelay') return `+${v} MIN DEPARTURE DELAY`;
      return `${k.toUpperCase()}: ${v}`;
    })
    .join(' · ');

  return (
    <div className="impact-analysis-panel font-mono">

      {/* Panel Header */}
      <div className="impact-panel-header">
        <div className="impact-header-left">
          <span className="impact-badge">⚡ SCENARIO ACTIVE</span>
          <h3 className="impact-title">IMPACT ANALYSIS</h3>
          <div className="impact-subtitle">SIMULATION · PREDICTION — Demo Data</div>
        </div>
        <button className="btn-reset-small" onClick={controls.resetToBaseline}>
          ↺ RESET
        </button>
      </div>

      {/* Scenario Description */}
      <div className="impact-scenario-desc">
        <span className="impact-train-id">{trainId}</span>
        <span className="impact-arrow">→</span>
        <span className="impact-change-desc">{changeDesc}</span>
      </div>

      {/* Summary Metrics */}
      <div className="impact-metrics-grid">
        <div className="impact-metric-card">
          <span className="impact-metric-val text-amber">
            {summary.primaryETADelta > 0 ? '+' : ''}{summary.primaryETADelta?.toFixed(1)} MIN
          </span>
          <span className="impact-metric-lbl">DIRECT ETA IMPACT</span>
        </div>
        <div className="impact-metric-card">
          <span className="impact-metric-val text-amber">{summary.affectedTrainCount}</span>
          <span className="impact-metric-lbl">AFFECTED TRAINS</span>
        </div>
        <div className="impact-metric-card">
          <span className="impact-metric-val">{summary.affectedStationCount}</span>
          <span className="impact-metric-lbl">AFFECTED STATIONS</span>
        </div>
        <div className="impact-metric-card">
          <span className="impact-metric-val">{summary.affectedSectionCount}</span>
          <span className="impact-metric-lbl">AFFECTED SECTIONS</span>
        </div>
        <div className="impact-metric-card">
          <RiskBadge level={summary.headwayRisk} />
          <span className="impact-metric-lbl">HEADWAY RISK</span>
        </div>
        <div className="impact-metric-card">
          <span className="impact-metric-val text-red">+{summary.totalNetworkDelayMin?.toFixed(1)} MIN</span>
          <span className="impact-metric-lbl">NETWORK DELAY</span>
        </div>
      </div>

      {/* Before / After Delta Table */}
      <div className="impact-delta-section">
        <div className="delta-section-title">TRAIN-LEVEL IMPACT — BEFORE / AFTER</div>
        <div className="delta-table">
          <div className="delta-table-header">
            <span>TRAIN</span>
            <span>BASELINE ETA</span>
            <span>MODIFIED ETA</span>
            <span>Δ</span>
            <span>TYPE</span>
          </div>
          {deltas.map(delta => {
            const base = baseline[delta.trainId];
            const mod = modified[delta.trainId];
            const isSelected = delta.trainId === trainId;
            return (
              <div
                key={delta.trainId}
                className={`delta-row ${isSelected ? 'delta-row-primary' : ''} ${delta.isDirectlyAffected ? 'delta-direct' : 'delta-indirect'}`}
                onClick={() => onSelectTrain && onSelectTrain(delta.trainId)}
              >
                <span className="delta-train-id" style={{ cursor: onSelectTrain ? 'pointer' : 'default' }}>
                  {isSelected ? '⚡ ' : ''}{delta.trainId}
                </span>
                <span className="delta-eta-base">{delta.baseETA}</span>
                <span className="delta-eta-mod">{delta.modifiedETA}</span>
                <span className={`delta-change ${delta.deltaMinutes > 0 ? 'text-red' : delta.deltaMinutes < 0 ? 'text-green' : 'text-muted'}`}>
                  {delta.deltaMinutes > 0 ? '+' : ''}{delta.deltaMinutes?.toFixed(1)} MIN
                </span>
                <span className="delta-type">
                  {isSelected ? 'PRIMARY' : delta.isDirectlyAffected ? 'DIRECT' : 'INDIRECT'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cascade Chain Visualization */}
      <div className="impact-cascade-section">
        <div className="delta-section-title">CASCADE CHAIN [SIMULATION PREDICTION]</div>
        <div className="cascade-flow">
          <div className="cascade-node primary-node">
            <span className="cascade-train">{trainId}</span>
            <span className="cascade-desc">PARAMETER CHANGED</span>
          </div>
          {directlyAffected.length > 0 && (
            <>
              <div className="cascade-arrow">↓</div>
              <div className="cascade-row">
                {directlyAffected.slice(0, 4).map(id => (
                  <div key={id} className="cascade-node direct-node">
                    <span className="cascade-train">{id}</span>
                    <span className="cascade-desc">DIRECTLY AFFECTED</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {indirectlyAffected.length > 0 && (
            <>
              <div className="cascade-arrow">↓</div>
              <div className="cascade-row">
                {indirectlyAffected.slice(0, 4).map(id => (
                  <div key={id} className="cascade-node indirect-node">
                    <span className="cascade-train">{id}</span>
                    <span className="cascade-desc">INDIRECTLY AFFECTED</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
