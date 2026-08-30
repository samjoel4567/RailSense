import React from 'react';
import { signalAspectColor } from '../../simulator/signalEngine';
import { useMLStatus } from '../../simulator/SimulationContext';

/**
 * DepartureDecisionPanel — The core Loco Pilot decision workflow.
 * Displays REAL ML predictions from the backend when connected.
 * Falls back to deterministic mock predictions when ML is unreachable.
 * The AI NEVER moves the train — the Loco Pilot decides.
 */
export default function DepartureDecisionPanel({
  cabTrain,
  prediction,
  decision,
  trafficAhead,
  departureEvaluation,
  onProceed,
  onHold
}) {
  const { isConnected: mlConnected } = useMLStatus();
  if (!cabTrain) return null;

  const pred = prediction || {};
  const backendReason = pred.reason || pred._raw?.reason || pred._raw?.recommendation_reason || pred._raw?.explanation || '';
  const rec  = (pred.recommendedAction || 'PROCEED').toUpperCase();
  const isHeld = decision === 'HOLD' || cabTrain.status === 'HELD';

  // Signal aspect styling
  const signalColor = signalAspectColor(pred.signalAspect || 'GREEN');
  const recColor  = rec === 'PROCEED' ? '#15803d' : '#b91c1c';
  const recBg     = rec === 'PROCEED' ? '#f0fdf4' : '#fef2f2';
  const recBorder = rec === 'PROCEED' ? '#86efac' : '#fca5a5';

  // Format ML-sourced values — null means backend hasn't provided them yet
  const conflictPct = pred.conflictProbability != null
    ? `${Math.round(pred.conflictProbability * 100)}%`
    : '—';
  const confidencePct = pred.confidence != null
    ? `${Math.round(pred.confidence * 100)}%`
    : '—';
  const timeSaved = pred.estimatedTimeSaved != null
    ? `${parseFloat(pred.estimatedTimeSaved).toFixed(1)} MIN`
    : '—';
  const predictedDelay = pred.predictedDelay != null
    ? `+${parseFloat(pred.predictedDelay).toFixed(1)} MIN`
    : null;

  // Data source badge
  const isLiveML  = pred.isMLPrediction && mlConnected && pred.isLive;
  const isMockML  = pred.isMLPrediction && mlConnected && !pred.isLive;
  const isMock    = !pred.isMLPrediction;

  return (
    <div className="departure-decision-card">

      {/* Header */}
      <div className="dept-header">
        <div className="dept-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dept-badge font-mono">AI TRAFFIC PREDICTION</span>
            {/* ML connectivity badge */}
            <span
              className="font-mono"
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                padding: '2px 8px', borderRadius: 3, border: '1px solid',
                ...(mlConnected
                  ? isLiveML
                    ? { background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }
                    : { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }
                  : { background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' })
              }}
            >
              {mlConnected ? (isLiveML ? '● ML LIVE' : '○ ML CONNECTED') : '○ ML OFFLINE'}
            </span>
          </div>
          <h3 className="dept-title">DEPARTURE DECISION SUPPORT</h3>
          <p className="dept-subtitle font-mono">
            {isLiveML
              ? `REAL ML PREDICTION · ${pred.dataSource || 'TRAINSENSE'} · Operator retains full authority`
              : isMockML
              ? 'ML CONNECTED · Simulation data active · Operator retains full authority'
              : 'DETERMINISTIC MODEL · ML backend offline · Operator retains full authority'}
          </p>
        </div>

        <div
          className={`dept-status-indicator ${isHeld ? 'status-held' : 'status-waiting'}`}
        >
          <span className="dept-status-dot" />
          <span className="dept-status-text font-mono">
            {isHeld ? 'TRAIN HELD' : cabTrain.status || 'DWELLING'}
          </span>
        </div>
      </div>

      <div className="dept-body">

        {/* ── Traffic Ahead ───────────────────────────────── */}
        {trafficAhead && trafficAhead.length > 0 && (
          <div className="dept-traffic-block">
            <div className="traffic-block-label font-mono">IMMEDIATE TRAFFIC AHEAD</div>
            {trafficAhead.slice(0, 2).map((t, i) => (
              <div key={i} className="traffic-detail-row">
                <span className="traffic-train-chip font-mono">{t.id}</span>
                <div className="traffic-metrics font-mono">
                  <span>{t.speed ?? '—'} km/h</span>
                  <span className="traffic-sep">|</span>
                  <span>
                    {t.etaAbsolute
                      ? `ETA ${new Date(t.etaAbsolute).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                      : t.etaMinutes
                        ? `ETA ~${Math.round(t.etaMinutes)} min`
                        : '—'
                    }
                  </span>
                  <span className="traffic-sep">|</span>
                  <span
                    className={`headway-badge font-mono hw-badge-${
                      t.headwayStatus === 'CONSTRAINED' ? 'constrained'
                      : t.headwayStatus === 'CAUTION'   ? 'caution'
                      : 'safe'
                    }`}
                  >
                    {t.headwayStatus || 'SAFE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Signal ──────────────────────────────────────── */}
        <div className="dept-signal-row">
          <span className="signal-row-label font-mono">DEPARTURE SIGNAL</span>
          <span
            className="signal-aspect-badge font-mono"
            style={{
              color: signalColor.text,
              background: signalColor.bg,
              borderColor: signalColor.border
            }}
          >
            {pred.signalAspect || 'GREEN'}
          </span>
          {pred.clearanceTime != null && (
            <span className="font-mono" style={{ fontSize: 10, color: '#64748b', marginLeft: 8 }}>
              CLEARS IN {pred.clearanceTime}s
            </span>
          )}
        </div>

        {/* ── ML Recommendation block ──────────────────────── */}
        <div
          className="dept-recommendation-block"
          style={{ background: recBg, border: `1px solid ${recBorder}` }}
        >
          <div className="rec-header">
            <span className="rec-label font-mono">ML RECOMMENDATION</span>
            <span className="font-mono" style={{ fontSize: 13, fontWeight: 800, color: recColor, letterSpacing: '0.06em' }}>
              {rec}
            </span>
          </div>

          {backendReason && (
            <p className="rec-reason font-mono">{backendReason}</p>
          )}

          {/* Metrics grid — only show fields the backend actually returned */}
          <div className="rec-metrics-row">

            <div className={`rec-metric font-mono ${conflictPct !== '—' && pred.conflictProbability > 0.3 ? 'amber' : 'green'}`}>
              <span>CONFLICT PROB</span>
              <span>{conflictPct}</span>
            </div>

            <div className={`rec-metric font-mono ${confidencePct !== '—' ? 'green' : 'muted'}`}>
              <span>CONFIDENCE</span>
              <span>{confidencePct}</span>
            </div>

            <div className={`rec-metric font-mono ${timeSaved !== '—' ? 'green' : 'muted'}`}>
              <span>TIME SAVED</span>
              <span>{timeSaved}</span>
            </div>

            {predictedDelay && (
              <div className="rec-metric font-mono amber">
                <span>PREDICTED DELAY</span>
                <span>{predictedDelay}</span>
              </div>
            )}

            {cabTrain.headwaySec != null && (
              <div className={`rec-metric font-mono ${cabTrain.headwaySec > 480 ? 'green' : cabTrain.headwaySec > 288 ? 'amber' : 'red'}`}>
                <span>HEADWAY</span>
                <span>{Math.round(cabTrain.headwaySec / 60)} MIN</span>
              </div>
            )}

          </div>
        </div>

        {/* ── Decision Buttons ─────────────────────────────── */}
        <div className="dept-action-buttons">
          <span className="action-buttons-label font-mono">LOCO PILOT DECISION — OPERATOR HAS FINAL AUTHORITY</span>
          <div className="action-buttons-row">
            <button
              className={`btn-depart-proceed font-mono ${decision === 'PROCEED' ? 'btn-active-proceed' : ''}`}
              onClick={onProceed}
            >
              <span className="btn-icon">▶</span>
              PROCEED
            </button>
            <button
              className={`btn-depart-hold font-mono ${decision === 'HOLD' ? 'btn-active-hold' : ''}`}
              onClick={onHold}
            >
              <span className="btn-icon">⏸</span>
              HOLD
            </button>
          </div>
          {decision && (
            <div className={`decision-confirmed font-mono ${decision === 'PROCEED' ? 'green' : 'amber'}`}>
              ✓ DECISION RECORDED: {decision}
              {pred.lastMLUpdate && (
                <span style={{ marginLeft: 8, fontWeight: 400, fontSize: 9, color: '#94a3b8' }}>
                  · ML {new Date(pred.lastMLUpdate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
