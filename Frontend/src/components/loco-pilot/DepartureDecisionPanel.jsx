import React from 'react';
import { signalAspectColor } from '../../simulator/signalEngine';

/**
 * DepartureDecisionPanel — The core Loco Pilot decision workflow.
 * Shows live AI prediction + PROCEED / HOLD buttons.
 * The AI NEVER moves the train — the Loco Pilot decides.
 *
 * [SIMULATION PREDICTION — Demo Data]
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
  if (!cabTrain) return null;

  const pred = prediction || {};
  const rec  = pred.recommendedAction || 'PROCEED';
  const isHeld = decision === 'HOLD' || cabTrain.status === 'HELD';

  // Signal aspect styling
  const signalColor = signalAspectColor(pred.signalAspect || 'GREEN');
  const recColor = rec === 'PROCEED' ? '#15803d' : '#b91c1c';
  const recBg    = rec === 'PROCEED' ? '#f0fdf4' : '#fef2f2';
  const recBorder = rec === 'PROCEED' ? '#86efac' : '#fca5a5';

  return (
    <div className="departure-decision-card">

      {/* Header */}
      <div className="dept-header">
        <div className="dept-header-left">
          <span className="dept-badge font-mono">AI TRAFFIC PREDICTION</span>
          <h3 className="dept-title">DEPARTURE DECISION SUPPORT</h3>
          <p className="dept-subtitle font-mono">SIMULATION · PREDICTION — Operator retains full authority</p>
        </div>
        <div className={`dept-status-indicator ${isHeld ? 'status-held' : 'status-waiting'}`}>
          <span className="dept-status-dot" />
          <span className="dept-status-text font-mono">
            {isHeld ? 'HELD' : cabTrain.status || 'WAITING'}
          </span>
        </div>
      </div>

      <div className="dept-body">

        {/* ── Traffic Ahead Summary ── */}
        {pred.leaderTrainId && (
          <div className="dept-traffic-block">
            <div className="traffic-block-label font-mono">TRAFFIC AHEAD</div>
            <div className="traffic-detail-row">
              <div className="traffic-train-chip font-mono">{pred.leaderTrainId}</div>
              <div className="traffic-metrics font-mono">
                <span>
                  {pred.leaderSpeed !== null ? `${Math.round(pred.leaderSpeed || 0)} KM/H` : '–'}
                </span>
                <span className="traffic-sep">·</span>
                <span>
                  HEADWAY {pred.headwayMinutes !== undefined ? `${pred.headwayMinutes?.toFixed(1)} MIN` : '–'}
                </span>
                <span className={`headway-badge hw-badge-${(pred.headwayStatus || 'safe').toLowerCase()}`}>
                  {pred.headwayStatus || 'SAFE'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Junction Conflict ── */}
        {pred.junctionConflict && (
          <div className="dept-junction-block">
            <span className="junction-label font-mono">JUNCTION {pred.junctionConflict.junctionId}</span>
            <span className="junction-train font-mono">{pred.junctionConflict.conflictingTrainId}</span>
            <span className="junction-eta font-mono">
              CLEARS IN ~{Math.round(pred.junctionConflict.clearanceTimeSec / 60)} MIN
            </span>
          </div>
        )}

        {/* ── Signal State ── */}
        <div className="dept-signal-row">
          <span className="signal-row-label font-mono">ENTRY SIGNAL</span>
          <span
            className="signal-aspect-badge font-mono"
            style={{ color: signalColor, borderColor: signalColor, background: `${signalColor}15` }}
          >
            {pred.signalAspect || 'GREEN'}
          </span>
        </div>

        {/* ── AI Recommendation ── */}
        <div
          className="dept-recommendation-block"
          style={{ background: recBg, border: `1px solid ${recBorder}` }}
        >
          <div className="rec-header">
            <span className="rec-label font-mono">RECOMMENDATION</span>
            <span
              className="rec-action font-mono font-bold"
              style={{ color: recColor }}
            >
              {rec}
            </span>
          </div>
          <p className="rec-reason">{pred.reason || 'Calculating...'}</p>

          <div className="rec-metrics-row font-mono">
            {pred.estimatedTimeSaved > 0 && (
              <div className="rec-metric green">
                <span>TIME SAVED</span>
                <span>~{pred.estimatedTimeSaved} MIN</span>
              </div>
            )}
            {pred.predictedDelay > 0 && (
              <div className="rec-metric amber">
                <span>DELAY IF HELD</span>
                <span>+{pred.predictedDelay} MIN</span>
              </div>
            )}
            {pred.conflictProbability !== undefined && (
              <div className={`rec-metric ${pred.conflictProbability > 0.5 ? 'red' : 'muted'}`}>
                <span>CONFLICT PROB</span>
                <span>{Math.round(pred.conflictProbability * 100)}%</span>
              </div>
            )}
            {pred.etaConfidence !== undefined && (
              <div className="rec-metric muted">
                <span>ETA CONFIDENCE</span>
                <span>{Math.round(pred.etaConfidence * 100)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Decision Buttons ── */}
        <div className="dept-action-buttons">
          <div className="action-buttons-label font-mono">LOCO PILOT DECISION</div>
          <div className="action-buttons-row">
            <button
              className={`btn-depart-proceed ${decision === 'PROCEED' ? 'btn-active-proceed' : ''}`}
              onClick={onProceed}
              disabled={decision === 'PROCEED' && !cabTrain.isDwelling}
            >
              <span className="btn-icon">▶</span>
              <span>PROCEED</span>
            </button>

            <button
              className={`btn-depart-hold ${decision === 'HOLD' ? 'btn-active-hold' : ''}`}
              onClick={onHold}
            >
              <span className="btn-icon">■</span>
              <span>HOLD</span>
            </button>
          </div>

          {/* Decision confirmation */}
          {decision === 'PROCEED' && (
            <div className="decision-confirmed green font-mono">
              ✓ PROCEED CONFIRMED — Train is departing
            </div>
          )}
          {decision === 'HOLD' && (
            <div className="decision-confirmed amber font-mono">
              ■ HOLD CONFIRMED — Train held at station. Delay accumulating.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
