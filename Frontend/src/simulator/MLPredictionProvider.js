/**
 * RAIL//AI — ML Prediction Provider
 *
 * Replaces MockPredictionProvider with a live polling connection to the ML backend.
 *
 * Architecture:
 *   predictionEngine.js → MLPredictionProvider → mlPredictionClient → ML API
 *
 * Design rules enforced here:
 * - Predictions are NEVER fetched on every 100ms simulation tick.
 * - Throttle: baseline poll every 1500ms for the active cab train.
 * - Event triggers: immediate fetch when important state changes occur.
 * - Stale cancellation: AbortController per request — an older fetch
 *   that completes after a newer one is silently discarded.
 * - Fallback: if the ML API is unreachable, returns null (engine uses mock).
 * - No React dependency — this is a plain JS class.
 */

import {
  getPrediction,
  getAllPredictions,
  getAllTrains,
  getAlerts,
  startBackendSimulation,
  checkHealth,
  frontendIdToBackendId
} from '../services/mlPredictionClient';

// ── Configuration ─────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS      = 1500;   // baseline poll cadence
const EVENT_DEBOUNCE_MS     = 300;    // debounce for rapid consecutive events
const CONNECT_RETRY_MS      = 8000;   // retry interval when API is unreachable
const SPEED_CHANGE_THRESHOLD = 8;     // km/h delta that qualifies as "significant"

// ── Important event types ─────────────────────────────────────────────────────
export const ML_TRIGGER_EVENTS = {
  SPEED_CHANGE:      'SPEED_CHANGE',
  SIGNAL_CHANGE:     'SIGNAL_CHANGE',
  HEADWAY_CHANGE:    'HEADWAY_CHANGE',
  TRAIN_AHEAD_CHANGE:'TRAIN_AHEAD_CHANGE',
  JUNCTION_CHANGE:   'JUNCTION_CHANGE',
  PLATFORM_CHANGE:   'PLATFORM_CHANGE',
  DELAY_CHANGE:      'DELAY_CHANGE',
  LOCO_PROCEED:      'LOCO_PROCEED',
  LOCO_HOLD:         'LOCO_HOLD',
  CAB_SWITCH:        'CAB_SWITCH',
  PHASE_CHANGE:      'PHASE_CHANGE'
};

export class MLPredictionProvider {
  constructor() {
    // Current active cab train being monitored
    this.activeCabTrainId   = null;

    // Latest normalised prediction from ML backend (or null if unavailable)
    this.latestPrediction   = null;

    // Latest normalised predictions for all active trains
    this.latestPredictions   = [];
    this.predictionsByTrain   = {};

    // Latest alerts from ML backend
    this.latestAlerts       = [];

    // All trains from backend (for cross-referencing IDs)
    this.backendTrains      = [];

    // API connectivity state
    this.isConnected        = false;
    this.lastConnectAttempt = 0;

    // Polling timers
    this._pollTimer           = null;
    this._allPredictionsTimer = null;
    this._alertTimer          = null;   // guarded — never stacked

    // In-flight request controller (for stale cancellation)
    this._currentAbort      = null;
    this._requestSequence   = 0;   // monotonic counter — only accept if matches latest

    // Debounce timer for event-triggered fetches
    this._eventDebounce     = null;

    // State snapshot for change detection
    this._prevSnapshot      = {};

    // Subscribers (the engine registers one listener)
    this._listeners         = new Set();

    // Start connectivity check
    this._checkConnectivity();
  }

  // ── Public interface ────────────────────────────────────────────────────────

  /**
   * Called by simulationEngine every tick to check for important changes.
   * Does NOT fetch — only schedules a fetch if something material changed.
   * @param {Object} train — current cab train from simulation state
   * @param {Object} networkState — full network state snapshot
   */
  onSimulationTick(train, networkState) {
    if (!train || !this.isConnected) return;

    // Switch cab train
    if (train.id !== this.activeCabTrainId) {
      this.activeCabTrainId = train.id;
      this._triggerEvent(ML_TRIGGER_EVENTS.CAB_SWITCH);
      return;
    }

    const prev = this._prevSnapshot;

    // Detect significant changes
    let triggerReason = null;

    const speedDelta = Math.abs((train.speed || 0) - (prev.speed || 0));
    if (speedDelta >= SPEED_CHANGE_THRESHOLD) {
      triggerReason = ML_TRIGGER_EVENTS.SPEED_CHANGE;
    }

    const signalNow  = networkState.signalStates?.[train.currentSection]?.entry?.aspect;
    const signalPrev = prev.signalAspect;
    if (signalNow && signalNow !== signalPrev) {
      triggerReason = ML_TRIGGER_EVENTS.SIGNAL_CHANGE;
    }

    const hwNow  = train.headwayStatus;
    const hwPrev = prev.headwayStatus;
    if (hwNow && hwNow !== hwPrev) {
      triggerReason = ML_TRIGGER_EVENTS.HEADWAY_CHANGE;
    }

    const leaderNow  = this._findLeaderId(train, networkState.allTrains);
    const leaderPrev = prev.leaderId;
    if (leaderNow !== leaderPrev) {
      triggerReason = ML_TRIGGER_EVENTS.TRAIN_AHEAD_CHANGE;
    }

    const delayDelta = Math.abs((train.delay || 0) - (prev.delay || 0));
    if (delayDelta >= 0.5) {  // 30 seconds
      triggerReason = ML_TRIGGER_EVENTS.DELAY_CHANGE;
    }

    if (triggerReason) {
      this._triggerEvent(triggerReason);
    }

    // Save snapshot for next comparison
    this._prevSnapshot = {
      speed:        train.speed,
      signalAspect: signalNow,
      headwayStatus: hwNow,
      leaderId:     leaderNow,
      delay:        train.delay
    };
  }

  /**
   * Force an immediate prediction fetch — called on Loco Pilot decisions.
   * @param {string} eventType — ML_TRIGGER_EVENTS.*
   */
  onLocoPilotDecision(eventType) {
    // Clear debounce so decision triggers immediately
    if (this._eventDebounce) clearTimeout(this._eventDebounce);
    this._fetchPrediction(`decision:${eventType}`);
  }

  /**
   * Called when phase changes in the simulation.
   */
  onPhaseChange() {
    this._triggerEvent(ML_TRIGGER_EVENTS.PHASE_CHANGE);
  }

  /**
   * Register a listener that receives { prediction, alerts } when updated.
   * Returns unsubscribe function.
   */
  subscribe(listener) {
    this._listeners.add(listener);
    // Immediately emit current state
    if (this.latestPrediction || this.latestAlerts.length || this.latestPredictions.length) {
      listener({
        prediction: this.latestPrediction,
        predictions: this.latestPredictions,
        predictionsByTrain: this.predictionsByTrain,
        alerts: this.latestAlerts,
        isConnected: this.isConnected
      });
    }
    return () => this._listeners.delete(listener);
  }

  /**
   * Start polling for the given cab train.
   * @param {string} trainId — frontend format e.g. 'LOCAL_101'
   */
  startPolling(trainId) {
    this.activeCabTrainId = trainId;
    this._prevSnapshot    = {};
    this._stopPoll();
    if (!this.isConnected) { this._checkConnectivity(); return; }
    this._beginPoll();
  }

  /**
   * Stop all polling and in-flight requests.
   */
  stop() {
    this._stopPoll();
    if (this._allPredictionsTimer) { clearInterval(this._allPredictionsTimer); this._allPredictionsTimer = null; }
    this._abortCurrent();
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  _triggerEvent(reason) {
    if (!this.isConnected) return;
    // Debounce so rapid consecutive changes collapse into one request
    if (this._eventDebounce) clearTimeout(this._eventDebounce);
    this._eventDebounce = setTimeout(() => {
      this._fetchPrediction(reason);
    }, EVENT_DEBOUNCE_MS);
  }

  _beginPoll() {
    this._stopPoll();
    this._fetchAllPredictions('poll');
    // Fetch immediately, then set recurring timer
    this._fetchPrediction('poll');
    this._pollTimer = setInterval(() => {
      this._fetchPrediction('poll');
    }, POLL_INTERVAL_MS);
    if (!this._allPredictionsTimer) {
      this._allPredictionsTimer = setInterval(() => {
        this._fetchAllPredictions('poll');
      }, 5000);
    }
  }

  _stopPoll() {
    if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    if (this._allPredictionsTimer) { clearInterval(this._allPredictionsTimer); this._allPredictionsTimer = null; }
  }

  async _fetchAllPredictions(reason = 'poll') {
    if (!this.isConnected) return;
    try {
      const [predRes, trainsRes] = await Promise.allSettled([
        getAllPredictions(),
        getAllTrains()
      ]);

      const predictions = predRes.status === 'fulfilled' && Array.isArray(predRes.value)
        ? predRes.value
        : [];
      const trains = trainsRes.status === 'fulfilled' && Array.isArray(trainsRes.value)
        ? trainsRes.value
        : [];

      // Merge both lists into a per-train map (predictions take priority over raw train telemetry)
      const mergedByTrain = {};
      const upsert = (pred) => {
        if (!pred?.trainId) return;
        mergedByTrain[pred.trainId] = {
          ...(mergedByTrain[pred.trainId] || {}),
          ...pred,
          _raw: {
            ...((mergedByTrain[pred.trainId] || {})._raw || {}),
            ...(pred._raw || {})
          }
        };
      };

      trains.forEach(upsert);
      predictions.forEach(upsert);  // predictions override train telemetry

      this.latestPredictions  = Object.values(mergedByTrain);
      this.predictionsByTrain = mergedByTrain;

      // Update latestPrediction only if a fresher full-prediction exists for the cab train
      if (this.activeCabTrainId && mergedByTrain[this.activeCabTrainId]) {
        const candidate = mergedByTrain[this.activeCabTrainId];
        // Only replace latestPrediction if it has real ML fields (not just telemetry echo)
        if (candidate.conflictProbability != null || candidate.recommendedAction) {
          this.latestPrediction = candidate;
        }
      }

      this._notifyListeners();
    } catch (err) {
      // Non-critical — silently log
      console.info(`[MLPredictionProvider] All-predictions fetch unavailable (${reason}):`, err.message);
    }
  }

  _abortCurrent() {
    if (this._currentAbort) {
      try { this._currentAbort.abort(); } catch (_) {}
      this._currentAbort = null;
    }
  }

  async _fetchPrediction(reason = 'poll') {
    if (!this.activeCabTrainId) return;

    // Cancel any in-flight request
    this._abortCurrent();
    const abortCtrl   = new AbortController();
    this._currentAbort = abortCtrl;

    // Sequence number for stale detection
    const seq = ++this._requestSequence;

    try {
      const prediction = await getPrediction(this.activeCabTrainId, abortCtrl.signal);

      // Discard if a newer request was already started
      if (seq !== this._requestSequence) return;

      this.latestPrediction = prediction;
      this._notifyListeners();
    } catch (err) {
      if (err.name === 'AbortError') return;  // Expected cancellation

      // API unreachable — mark disconnected and schedule reconnect
      if (!this.isConnected) return;
      console.warn(`[MLPredictionProvider] Fetch failed (${reason}):`, err.message);
      this.isConnected = false;
      this.latestPrediction = null;
      this._notifyListeners();
      this._scheduleReconnect();
    }
  }

  async _fetchAlerts() {
    try {
      const abortCtrl = new AbortController();
      const alerts = await getAlerts(abortCtrl.signal);
      this.latestAlerts = alerts;
      this._notifyListeners();
    } catch (_) {
      // Non-critical — silently ignore alert fetch failures
    }
  }

  _notifyListeners() {
    const payload = {
      prediction:  this.latestPrediction,
      predictions: this.latestPredictions,
      predictionsByTrain: this.predictionsByTrain,
      alerts:      this.latestAlerts,
      isConnected: this.isConnected
    };
    this._listeners.forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } });
  }

  async _checkConnectivity() {
    try {
      await checkHealth();
      this.isConnected        = true;
      this.lastConnectAttempt = Date.now();

      // Auto-start backend simulation so predictions start populating
      try {
        await startBackendSimulation(2.0);
        console.info('[MLPredictionProvider] Backend simulation started (interval=2s)');
      } catch (e) {
        // May already be running — not an error
        console.info('[MLPredictionProvider] Backend simulation may already be running:', e.message);
      }

      // Begin polling if a cab train is already set
      if (this.activeCabTrainId) this._beginPoll();

      // Initial alert fetch
      this._fetchAlerts();

      // Alert polling — GUARDED: never create more than one interval across reconnects
      if (!this._alertTimer) {
        this._alertTimer = setInterval(() => { if (this.isConnected) this._fetchAlerts(); }, 5000);
      }

      console.info('[MLPredictionProvider] ✅ Connected to ML backend:', import.meta.env.VITE_ML_API_URL);
    } catch (err) {
      this.isConnected = false;
      console.warn('[MLPredictionProvider] ⚠️ ML backend unreachable — using mock predictions. Will retry.');
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    setTimeout(() => this._checkConnectivity(), CONNECT_RETRY_MS);
  }

  _findLeaderId(train, allTrains = []) {
    if (!train || train.isDwelling) return null;
    const leader = allTrains.find(t =>
      t.id !== train.id &&
      t.direction === train.direction &&
      t.currentSection === train.currentSection &&
      (train.direction === 'SOUTHBOUND'
        ? t.positionPct > train.positionPct
        : t.positionPct < train.positionPct)
    );
    return leader?.id || null;
  }
}

// Global singleton — one provider for all pages
export const mlPredictionProvider = new MLPredictionProvider();
