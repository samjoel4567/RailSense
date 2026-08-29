import React, { useState } from 'react';
import { useSimulation, useTrainInspector, useImpactAnalysis } from '../../simulator/SimulationContext';
import { MIN_HEADWAY_SEC } from '../../simulator/headwayEngine';

const TYPE_BADGE_COLORS = {
  EXPRESS:   { bg: '#1e3a5f', border: '#3b82f6', text: '#60a5fa' },
  INTERCITY: { bg: '#1a3a2a', border: '#10b981', text: '#34d399' },
  REGIONAL:  { bg: '#2d1b4e', border: '#8b5cf6', text: '#a78bfa' },
  COMMUTER:  { bg: '#1a2e40', border: '#0ea5e9', text: '#38bdf8' },
  LOCAL:     { bg: '#2d2515', border: '#f59e0b', text: '#fbbf24' }
};

function SpeedGauge({ value, max, limit, label }) {
  const pct = Math.min(100, (value / max) * 100);
  const overLimit = value > limit;
  const color = overLimit ? '#ef4444' : value > limit * 0.8 ? '#f59e0b' : '#10b981';
  return (
    <div className="speed-gauge-block">
      <div className="gauge-label font-mono">{label}</div>
      <div className="gauge-bar-bg">
        <div className="gauge-bar-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="gauge-limit-line" style={{ left: `${(limit / max) * 100}%` }} />
      </div>
      <div className="gauge-value font-mono" style={{ color }}>
        {Math.round(value)} KM/H
      </div>
    </div>
  );
}

export default function TrainInspectorPanel({ trainId, onClose, onApplyScenario }) {
  const { state, controls } = useSimulation();
  const { train, affectingTrains, affectedTrains } = useTrainInspector(trainId);
  const { activeScenario, impactReport } = useImpactAnalysis();

  const [modSpeed, setModSpeed] = useState('');
  const [modTargetSpeed, setModTargetSpeed] = useState('');
  const [modDwellTime, setModDwellTime] = useState('');
  const [modDelay, setModDelay] = useState('');
  const [modRestriction, setModRestriction] = useState('');
  const [previewImpact, setPreviewImpact] = useState(null);

  if (!train) {
    return (
      <div className="train-inspector-panel">
        <div className="inspector-header">
          <span className="font-mono text-muted">NO TRAIN SELECTED</span>
          <button className="inspector-close-btn" onClick={onClose}>✕</button>
        </div>
      </div>
    );
  }

  const colors = TYPE_BADGE_COLORS[train.type] || TYPE_BADGE_COLORS.LOCAL;
  const maxSpeed = train.maxSpeed || 160;
  const isAffectedByScenario = activeScenario && (
    activeScenario.trainId === train.id ||
    (impactReport?.affectedTrains || []).includes(train.id)
  );

  function buildParamChange() {
    const change = {};
    if (modSpeed !== '') change.speed = parseFloat(modSpeed);
    if (modTargetSpeed !== '') change.targetSpeed = parseFloat(modTargetSpeed);
    if (modDwellTime !== '') change.dwellTime = parseFloat(modDwellTime);
    if (modDelay !== '') change.departureDelay = parseFloat(modDelay);
    if (modRestriction !== '') change.speedRestriction = parseFloat(modRestriction);
    return change;
  }

  function handlePreview() {
    const change = buildParamChange();
    if (Object.keys(change).length === 0) return;
    const report = controls.getImpactAnalysis(train.id, change);
    setPreviewImpact(report);
  }

  function handleApply() {
    const change = buildParamChange();
    if (Object.keys(change).length === 0) return;
    controls.applyScenario(train.id, change);
    if (onApplyScenario) onApplyScenario(change);
    setPreviewImpact(null);
    setModSpeed('');
    setModTargetSpeed('');
    setModDwellTime('');
    setModDelay('');
    setModRestriction('');
  }

  // Headway display
  const headwayDetails = train.headwayDetails || {};
  const hwMin = headwayDetails.headwayMinutes ?? '–';
  const reqMin = (MIN_HEADWAY_SEC / 60).toFixed(1);
  const marginMin = headwayDetails.marginMinutes ?? '–';

  // Current section label
  const sectionLabel = train.isDwelling
    ? `AT ${train.currentStation || 'STATION'} (P${train.platform || '?'})`
    : train.currentSection?.replace('SEC_', 'SECTION ').replace('_', ' → ') || '–';

  // Baseline vs modified ETA for this train
  const baselineETA = activeScenario?.impactReport?.baseline?.[train.id]?.etaAbsolute;
  const modifiedETA = activeScenario?.impactReport?.modified?.[train.id]?.etaAbsolute;
  const etaDelta = activeScenario?.impactReport?.deltas?.find(d => d.trainId === train.id);

  return (
    <div className="train-inspector-panel font-mono">
      {/* Header */}
      <div className="inspector-header" style={{ borderColor: colors.border }}>
        <div className="inspector-title-group">
          <span className="inspector-type-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
            {train.type}
          </span>
          <h3 className="inspector-train-id">{train.id}</h3>
          {isAffectedByScenario && (
            <span className="inspector-affected-badge">⚡ SCENARIO ACTIVE</span>
          )}
        </div>
        <button className="inspector-close-btn" onClick={onClose}>✕ CLOSE</button>
      </div>

      <div className="inspector-body">

        {/* ── Status Row ── */}
        <div className={`inspector-status-row status-${(train.headwayStatus || 'SAFE').toLowerCase()}`}>
          <span className="status-dot" />
          <span className="status-text">{train.status}</span>
          <span className="status-section">{sectionLabel}</span>
        </div>

        {/* ── Speed Block ── */}
        <div className="inspector-section">
          <div className="inspector-section-title">SPEED TELEMETRY</div>
          <SpeedGauge value={train.speed || 0} max={maxSpeed} limit={train.speedRestriction || maxSpeed} label="CURRENT SPEED" />
          <div className="speed-trio-row">
            <div className="speed-trio-item">
              <span className="trio-lbl">TARGET</span>
              <span className="trio-val">{Math.round(train.targetSpeed || 0)} KM/H</span>
            </div>
            <div className="speed-trio-item">
              <span className="trio-lbl">MAX</span>
              <span className="trio-val">{maxSpeed} KM/H</span>
            </div>
            <div className="speed-trio-item">
              <span className="trio-lbl">RESTRICTION</span>
              <span className="trio-val" style={{ color: train.speedRestriction ? '#ef4444' : '#10b981' }}>
                {train.speedRestriction ? `${train.speedRestriction} KM/H` : 'NONE'}
              </span>
            </div>
          </div>
        </div>

        {/* ── ETA & Route ── */}
        <div className="inspector-section">
          <div className="inspector-section-title">ETA & ROUTE</div>
          <div className="inspector-grid-2">
            <div className="info-cell">
              <span className="cell-lbl">ETA</span>
              <span className="cell-val text-green">{train.etaAbsolute || train.eta || '–'}</span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">DELAY</span>
              <span className={`cell-val ${(train.delay || 0) > 0 ? 'text-amber' : 'text-green'}`}>
                {(train.delay || 0) > 0 ? `+${Math.round(train.delay)} MIN` : 'ON TIME'}
              </span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">ORIGIN</span>
              <span className="cell-val">{train.origin?.replace('STATION_', '') || '–'}</span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">DESTINATION</span>
              <span className="cell-val">{train.destination?.replace('STATION_', '') || '–'}</span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">DIRECTION</span>
              <span className="cell-val">{train.direction === 'SOUTHBOUND' ? '▶ SOUTHBOUND' : '◀ NORTHBOUND'}</span>
            </div>
            <div className="info-cell">
              <span className="cell-lbl">PRIORITY</span>
              <span className="cell-val">{train.priority === 1 ? 'HIGH' : train.priority === 2 ? 'MEDIUM' : 'STANDARD'}</span>
            </div>
          </div>
        </div>

        {/* ── Headway ── */}
        <div className="inspector-section">
          <div className="inspector-section-title">HEADWAY STATUS</div>
          <div className={`headway-status-block hw-${(train.headwayStatus || 'SAFE').toLowerCase()}`}>
            <div className="hw-row">
              <span className="hw-lbl">CURRENT HEADWAY</span>
              <span className="hw-val">{hwMin} MIN</span>
            </div>
            <div className="hw-row">
              <span className="hw-lbl">REQUIRED</span>
              <span className="hw-val">{reqMin} MIN</span>
            </div>
            <div className="hw-row">
              <span className="hw-lbl">MARGIN</span>
              <span className={`hw-val ${headwayDetails.marginSec < 0 ? 'text-red' : 'text-green'}`}>
                {typeof marginMin === 'number' ? (marginMin > 0 ? '+' : '') + marginMin.toFixed(1) : marginMin} MIN
              </span>
            </div>
            <div className="hw-status-badge">STATUS: {train.headwayStatus || 'SAFE'}</div>
          </div>
        </div>

        {/* ── Affecting / Affected Trains ── */}
        {(affectingTrains.length > 0 || affectedTrains.length > 0) && (
          <div className="inspector-section">
            <div className="inspector-section-title">TRAIN INTERACTIONS</div>
            {affectingTrains.length > 0 && (
              <div className="interaction-block">
                <span className="interaction-label text-amber">AFFECTING THIS TRAIN:</span>
                <div className="interaction-list">
                  {affectingTrains.map(t => (
                    <span key={t.id} className="interaction-tag tag-affecting">{t.id}</span>
                  ))}
                </div>
              </div>
            )}
            {affectedTrains.length > 0 && (
              <div className="interaction-block">
                <span className="interaction-label text-blue">DOWNSTREAM AFFECTED:</span>
                <div className="interaction-list">
                  {affectedTrains.map(t => (
                    <span key={t.id} className="interaction-tag tag-affected">{t.id}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Modify Parameters ── */}
        <div className="inspector-section inspector-modify-section">
          <div className="inspector-section-title">✏ MODIFY PARAMETERS</div>
          <div className="modify-disclaimer">⚠ SIMULATION CONTROLS — Operator retains full decision authority</div>

          <div className="modify-grid">
            <div className="modify-row">
              <label className="modify-lbl">SPEED (KM/H)</label>
              <div className="modify-input-group">
                <span className="modify-current">{Math.round(train.speed)}</span>
                <span className="modify-arrow">→</span>
                <input
                  type="number"
                  className="modify-input"
                  placeholder="new speed"
                  min="0" max={maxSpeed}
                  value={modSpeed}
                  onChange={e => setModSpeed(e.target.value)}
                />
              </div>
            </div>

            <div className="modify-row">
              <label className="modify-lbl">TARGET SPEED (KM/H)</label>
              <div className="modify-input-group">
                <span className="modify-current">{Math.round(train.targetSpeed || 0)}</span>
                <span className="modify-arrow">→</span>
                <input
                  type="number"
                  className="modify-input"
                  placeholder="target"
                  min="0" max={maxSpeed}
                  value={modTargetSpeed}
                  onChange={e => setModTargetSpeed(e.target.value)}
                />
              </div>
            </div>

            <div className="modify-row">
              <label className="modify-lbl">SPEED RESTRICTION (KM/H)</label>
              <div className="modify-input-group">
                <span className="modify-current">{train.speedRestriction || 'NONE'}</span>
                <span className="modify-arrow">→</span>
                <input
                  type="number"
                  className="modify-input"
                  placeholder="restriction"
                  min="0" max={maxSpeed}
                  value={modRestriction}
                  onChange={e => setModRestriction(e.target.value)}
                />
              </div>
            </div>

            <div className="modify-row">
              <label className="modify-lbl">DEPARTURE DELAY (MIN)</label>
              <div className="modify-input-group">
                <span className="modify-current">+{Math.round(train.delay || 0)} MIN</span>
                <span className="modify-arrow">→</span>
                <input
                  type="number"
                  className="modify-input"
                  placeholder="add delay"
                  min="0" max="60"
                  value={modDelay}
                  onChange={e => setModDelay(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quick speed presets */}
          <div className="speed-presets">
            <span className="preset-label">QUICK SET SPEED:</span>
            {[20, 40, 60, 80, 100, 120].map(s => (
              <button key={s} className="preset-btn" onClick={() => setModSpeed(String(s))}>
                {s}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="modify-actions">
            <button className="btn-preview" onClick={handlePreview}>
              👁 PREVIEW IMPACT
            </button>
            <button className="btn-apply-scenario" onClick={handleApply}>
              ⚡ APPLY SCENARIO
            </button>
          </div>
        </div>

        {/* ── Preview Impact (before applying) ── */}
        {previewImpact && (
          <div className="inspector-section inspector-preview-section">
            <div className="inspector-section-title">📊 PREDICTED IMPACT [SIMULATION]</div>
            <div className="preview-summary">
              <div className="preview-metric">
                <span>ETA CHANGE</span>
                <span className="text-amber">
                  {previewImpact.summary?.primaryETADelta > 0 ? '+' : ''}{previewImpact.summary?.primaryETADelta?.toFixed(1)} MIN
                </span>
              </div>
              <div className="preview-metric">
                <span>AFFECTED TRAINS</span>
                <span className="text-amber">{previewImpact.summary?.affectedTrainCount || 0}</span>
              </div>
              <div className="preview-metric">
                <span>NETWORK DELAY</span>
                <span className="text-red">+{previewImpact.summary?.totalNetworkDelayMin?.toFixed(1) || 0} MIN</span>
              </div>
              <div className="preview-metric">
                <span>RISK</span>
                <span className={previewImpact.summary?.overallRisk === 'HIGH' ? 'text-red' : 'text-amber'}>
                  {previewImpact.summary?.overallRisk || 'LOW'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Before / After Comparison (when scenario active) ── */}
        {isAffectedByScenario && baselineETA && (
          <div className="inspector-section inspector-comparison-section">
            <div className="inspector-section-title">↔ BEFORE / AFTER [SIMULATION]</div>
            <div className="comparison-block">
              <div className="comparison-row">
                <span className="comp-label">BASELINE ETA</span>
                <span className="comp-val text-green">{baselineETA}</span>
              </div>
              <div className="comparison-row">
                <span className="comp-label">MODIFIED ETA</span>
                <span className="comp-val text-amber">{modifiedETA || '–'}</span>
              </div>
              {etaDelta && (
                <div className="comparison-row">
                  <span className="comp-label">CHANGE</span>
                  <span className={`comp-val ${etaDelta.deltaMinutes > 0 ? 'text-red' : 'text-green'}`}>
                    {etaDelta.deltaMinutes > 0 ? '+' : ''}{etaDelta.deltaMinutes.toFixed(1)} MIN
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reset button if scenario is active */}
        {activeScenario && activeScenario.trainId === train.id && (
          <div className="inspector-section">
            <button className="btn-reset-baseline" onClick={controls.resetToBaseline}>
              ↺ RESET TO BASELINE
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
