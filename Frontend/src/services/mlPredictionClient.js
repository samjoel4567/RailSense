/**
 * RAIL//AI — ML Prediction API Client
 *
 * This is the ONLY file in the frontend that communicates with the ML backend.
 * No React component ever calls fetch() or axios directly against the ML API.
 *
 * ── Discovered API Contract (TrainSense v0.1.0) ──────────────────────────────
 * Base URL    : import.meta.env.VITE_ML_API_URL  (e.g. http://172.18.238.241:8000)
 * Auth        : None required
 * Method      : All prediction endpoints are GET (polling model, not request/response)
 * Train ID    : Backend uses hyphen format  LOCAL-101 / EXPRESS-202
 *               Frontend uses underscore    LOCAL_101 / EXPRESS_202
 *               Conversion is handled here transparently.
 *
 * ── Endpoints ────────────────────────────────────────────────────────────────
 * GET  /api/v1/health
 * GET  /api/v1/trains                        — All trains with embedded predictions
 * GET  /api/v1/predictions                   — All active ML predictions
 * GET  /api/v1/predictions/{train_id}        — Single train ML prediction
 * GET  /api/v1/alerts                        — Operational risk alerts
 * GET  /api/v1/dashboard                     — Consolidated dashboard state
 * GET  /api/v1/simulation/status             — Backend simulator status
 * POST /api/v1/simulation/start              — Start backend telemetry sim
 * POST /api/v1/simulation/stop               — Stop backend telemetry sim
 * POST /api/v1/simulation/trigger-normal     — Scenario A: Normal ops
 * POST /api/v1/simulation/trigger-conflict   — Scenario B/C: High-risk conflict
 * POST /api/v1/alerts/{alert_id}/acknowledge — Acknowledge alert
 * POST /api/v1/demo/run-scenario             — Full end-to-end trace
 * GET  /api/v1/demo/status                   — Subsystem readiness matrix
 *
 * ── Backend response field mapping ───────────────────────────────────────────
 * train_id                → id (after underscore conversion)
 * current_speed_kmh       → speed
 * current_delay_min       → delay (minutes)
 * predicted_delay         → predictedDelay (minutes, may be null)
 * expected_delay_min      → also predictedDelay (alias)
 * predicted_eta           → etaAbsolute (ISO string, may be null)
 * conflict_probability    → conflictProbability (0.0–1.0, may be null)
 * potential_conflict      → hasConflict (boolean)
 * prediction_confidence   → confidence (0.0–1.0, may be null)
 * recommended_action      → recommendedAction ('PROCEED'|'HOLD')
 * recommendation          → also recommendedAction (alias)
 * estimated_time_saved_min→ estimatedTimeSaved (minutes, may be null)
 * status                  → backendStatus ('OPERATIONAL'|...)
 * is_live                 → isLive (boolean)
 * data_source             → dataSource
 */

const ML_BASE = (import.meta.env.VITE_ML_API_URL || 'http://172.18.238.241:8000').replace(/\/$/, '');
const API_V1  = `${ML_BASE}/api/v1`;

// ── Train ID conversion ───────────────────────────────────────────────────────
// Frontend: LOCAL_101    Backend: LOCAL-101
export function frontendIdToBackendId(frontendId) {
  return (frontendId || '').replace(/_/g, '-');
}
export function backendIdToFrontendId(backendId) {
  return (backendId || '').replace(/-/g, '_');
}

// ── Internal normalised prediction shape ─────────────────────────────────────
// All consumers of the ML client receive this shape.
// Fields that the backend does not provide are set to null — never fabricated.
function normalizePrediction(raw) {
  if (!raw) return null;

  // Resolve recommended action — backend provides both `recommended_action` and `recommendation`
  const recAction = (raw.recommended_action || raw.recommendation || 'PROCEED').toUpperCase();

  return {
    // Identity
    trainId:              backendIdToFrontendId(raw.train_id),
    backendTrainId:       raw.train_id || null,
    isMLPrediction:       true,

    // Core ML outputs
    recommendedAction:    recAction,                                    // 'PROCEED' | 'HOLD'
    conflictProbability:  raw.conflict_probability ?? null,             // 0.0–1.0
    hasConflict:          raw.potential_conflict ?? false,              // boolean
    confidence:           raw.prediction_confidence ?? null,            // 0.0–1.0
    predictedDelay:       raw.predicted_delay ?? raw.expected_delay_min ?? null,  // minutes
    estimatedTimeSaved:   raw.estimated_time_saved_min ?? null,         // minutes
    eta:                  raw.predicted_eta ?? null,                    // ISO string or null
    clearanceTime:        raw.clearance_time ?? null,                   // seconds or null
    affectedTrains:       raw.affected_trains ?? null,                  // array or null
    reason:               raw.reason ?? raw.recommendation_reason ?? raw.explanation ?? null,
    signalAspect:         raw.signal_aspect ?? raw.signalAspect ?? null,

    // Telemetry echoed back
    speed:                raw.current_speed_kmh ?? raw.speed ?? null,   // km/h
    delay:                raw.current_delay_min ?? raw.current_delay ?? null, // minutes

    // Meta
    backendStatus:        raw.status || null,
    isLive:               raw.is_live ?? false,
    dataSource:           raw.data_source || null,
    lastUpdated:          raw.last_updated || null,

    // Raw passthrough (for debugging)
    _raw:                 raw
  };
}

function normalizeAlert(raw) {
  if (!raw) return null;
  return {
    id:        raw.alert_id || raw.id || null,
    type:      raw.alert_type || raw.type || 'UNKNOWN',
    severity:  raw.severity || 'MEDIUM',
    trainId:   backendIdToFrontendId(raw.train_id),
    message:   raw.message || raw.description || '',
    timestamp: raw.timestamp || raw.created_at || null,
    acknowledged: raw.acknowledged ?? false,
    _raw:      raw
  };
}

function normalizePredictionLike(raw, fallbackTrainId = null) {
  if (!raw) return null;
  if (raw.train_id || raw.recommended_action || raw.recommendation || raw.prediction_confidence || raw.confidence) {
    return normalizePrediction({
      ...raw,
      train_id: raw.train_id || frontendIdToBackendId(fallbackTrainId)
    });
  }

  const directRecommendation =
    raw.recommendedAction ||
    raw.recommendation ||
    raw.recommended_action ||
    raw.decision ||
    raw.action ||
    null;

  const departure = raw.departureEvaluation || raw.departure_evaluation || null;
  const departureRecommendation =
    departure?.recommendation ||
    departure?.recommendedAction ||
    departure?.decision ||
    null;

  const recommendation = directRecommendation || departureRecommendation;
  if (!recommendation) return null;

  return {
    trainId: fallbackTrainId,
    backendTrainId: raw.train_id || fallbackTrainId || null,
    isMLPrediction: true,
    recommendedAction: String(recommendation).toUpperCase(),
    conflictProbability: raw.conflictProbability ?? departure?.riskScore ?? null,
    hasConflict: raw.hasConflict ?? false,
    confidence: raw.confidence ?? null,
    predictedDelay: raw.predictedDelay ?? departure?.predictedDelay ?? null,
    estimatedTimeSaved: raw.estimatedTimeSaved ?? departure?.estimatedTimeSaved ?? null,
    eta: raw.eta ?? departure?.eta ?? null,
    clearanceTime: raw.clearanceTime ?? departure?.estimatedClearanceTime ?? null,
    affectedTrains: raw.affectedTrains ?? null,
    reason: raw.reason ?? departure?.reason ?? raw.message ?? null,
    signalAspect: raw.signalAspect ?? departure?.signalAspect ?? null,
    speed: raw.speed ?? null,
    delay: raw.delay ?? null,
    backendStatus: raw.status || null,
    isLive: raw.is_live ?? true,
    dataSource: raw.data_source || raw.dataSource || 'dashboard',
    lastUpdated: raw.last_updated || raw.lastUpdated || null,
    _raw: raw
  };
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const url = `${API_V1}${path}`;
  const method = options.method || 'GET';
  const res  = await fetch(url, {
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`[ML API] ${method} ${path} failed → ${res.status}`, text);
    throw new Error(`ML API ${method} ${path} → ${res.status}: ${text}`);
  }

  const json = await res.json();
  const summary = Array.isArray(json)
    ? `array(${json.length})`
    : json && typeof json === 'object'
      ? `keys(${Object.keys(json).slice(0, 8).join(', ')})`
      : String(json);
  console.log(`[ML API] ${method} ${path} OK → ${summary}`);
  return json;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Health check — use to test connectivity before starting polling.
 * @returns {Promise<Object>} raw health object
 */
export async function checkHealth(signal) {
  return apiFetch('/health', { signal });
}

/**
 * Get ML prediction for a specific train.
 * @param {string} frontendTrainId — e.g. 'LOCAL_101'
 * @param {AbortSignal} [signal]
 * @returns {Promise<NormalizedPrediction|null>}
 */
export async function getPrediction(frontendTrainId, signal) {
  const backendId = frontendIdToBackendId(frontendTrainId);
  try {
    const raw = await apiFetch(`/predictions/${backendId}`, { signal });
    return normalizePrediction(raw);
  } catch (err) {
    const isMissingPrediction =
      err?.message?.includes('404') &&
      err?.message?.includes('No active ML prediction found');

    if (isMissingPrediction) {
      console.info(`[ML API] GET /predictions/${backendId} returned no active prediction`);
      try {
        const dashboard = await getDashboard(signal);
        const fromDashboard =
          normalizePredictionLike(dashboard?.cabPrediction, frontendTrainId) ||
          normalizePredictionLike(dashboard?.prediction, frontendTrainId) ||
          normalizePredictionLike(dashboard?.activePrediction, frontendTrainId) ||
          normalizePredictionLike(dashboard?.departureEvaluation, frontendTrainId) ||
          normalizePredictionLike(dashboard, frontendTrainId);

        if (fromDashboard) {
          console.info(`[ML API] dashboard fallback provided prediction for ${backendId}`);
          return fromDashboard;
        }
      } catch (dashboardErr) {
        console.info(`[ML API] dashboard fallback unavailable for ${backendId}: ${dashboardErr.message}`);
      }

      return null;
    }

    throw err;
  }
}

/**
 * Get all active ML predictions.
 * @param {AbortSignal} [signal]
 * @returns {Promise<NormalizedPrediction[]>}
 */
export async function getAllPredictions(signal) {
  const raw = await apiFetch('/predictions', { signal });
  return Array.isArray(raw) ? raw.map(normalizePrediction) : [];
}

/**
 * Get all active trains with embedded telemetry + predictions.
 * @param {AbortSignal} [signal]
 * @returns {Promise<NormalizedPrediction[]>}
 */
export async function getAllTrains(signal) {
  const raw = await apiFetch('/trains', { signal });
  return Array.isArray(raw) ? raw.map(normalizePrediction) : [];
}

/**
 * Get operational risk alerts from the correlation engine.
 * @param {AbortSignal} [signal]
 * @returns {Promise<NormalizedAlert[]>}
 */
export async function getAlerts(signal) {
  const raw = await apiFetch('/alerts', { signal });
  return Array.isArray(raw) ? raw.map(normalizeAlert) : [];
}

/**
 * Get consolidated dashboard state.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function getDashboard(signal) {
  return apiFetch('/dashboard', { signal });
}

/**
 * Get backend simulation status.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function getSimulationStatus(signal) {
  return apiFetch('/simulation/status', { signal });
}

/**
 * Start the backend telemetry simulation.
 * @param {number} [intervalSeconds=2.0] — 0.5 to 10.0
 * @returns {Promise<Object>}
 */
export async function startBackendSimulation(intervalSeconds = 2.0) {
  return apiFetch(`/simulation/start?interval_seconds=${intervalSeconds}`, { method: 'POST' });
}

/**
 * Stop the backend telemetry simulation.
 * @returns {Promise<Object>}
 */
export async function stopBackendSimulation() {
  return apiFetch('/simulation/stop', { method: 'POST' });
}

/**
 * Trigger Scenario A — Normal clear-track operations.
 * @returns {Promise<Object>}
 */
export async function triggerNormalScenario() {
  return apiFetch('/simulation/trigger-normal', { method: 'POST' });
}

/**
 * Trigger Scenario B/C — High-risk conflict + vision intrusion.
 * @returns {Promise<Object>}
 */
export async function triggerConflictScenario() {
  return apiFetch('/simulation/trigger-conflict', { method: 'POST' });
}

/**
 * Acknowledge an operational alert.
 * @param {string} alertId
 * @returns {Promise<Object>}
 */
export async function acknowledgeAlert(alertId) {
  return apiFetch(`/alerts/${alertId}/acknowledge`, { method: 'POST' });
}

/**
 * Get subsystem readiness matrix.
 * @returns {Promise<Object>}
 */
export async function getDemoStatus() {
  return apiFetch('/demo/status');
}

/**
 * Run the full end-to-end demo scenario.
 * @returns {Promise<Object>}
 */
export async function runDemoScenario() {
  return apiFetch('/demo/run-scenario', { method: 'POST' });
}

/**
 * Resolve an evaluation artifact image path returned by the FastAPI backend.
 * @param {string} relativePath
 * @returns {string|null}
 */
export function resolveEvaluationImageUrl(relativePath) {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${ML_BASE}${cleanPath}`;
}

/**
 * Fetch AI Model Performance and Validation Evaluation Report from FastAPI backend.
 * Tries GET /model/evaluation first, then falls back to /api/v1/model/evaluation.
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function getModelEvaluation(signal) {
  // 1. Try direct GET /model/evaluation
  try {
    const url = `${ML_BASE}/model/evaluation`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal
    });
    if (res.ok) {
      const json = await res.json();
      console.log('[ML API] GET /model/evaluation OK');
      return json;
    }
  } catch (err) {
    if (err.name === 'AbortError') throw err;
  }

  // 2. Fallback to GET /api/v1/model/evaluation
  return apiFetch('/model/evaluation', { signal });
}

