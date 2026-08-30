/**
 * RAIL//AI — Intrusion Engine
 *
 * Responsibilities:
 *  • Validate incoming intrusion events
 *  • Assign detectedAt timestamp from the simulation clock
 *  • Maintain active / history intrusion state
 *  • Notify registered listeners (SimulationEngine registers one)
 *  • Expose public API used by providers and SimulationContext
 *
 * NOT responsible for:
 *  • Moving trains
 *  • Changing ETAs
 *  • Enforcing speed restrictions (Step 2+)
 *  • Any React state
 *
 * Provider interface:
 *  Any provider (Mock or ML) must call:
 *    intrusionEngine.addIntrusion(config)
 *    intrusionEngine.clearIntrusion(id)
 *
 * Future MLIntrusionProvider replaces MockIntrusionProvider
 * without any change to this engine or the UI.
 */

import {
  INTRUSION_TYPES,
  INTRUSION_SEVERITY,
  INTRUSION_STATUS,
  TRACKS,
  INTRUSION_SOURCE
} from './intrusionTypes';
import { SECTIONS } from '../simulator/networkModel';

// ─────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────
const VALID_TYPES     = new Set(Object.values(INTRUSION_TYPES));
const VALID_SEVERITIES = new Set(Object.values(INTRUSION_SEVERITY));
const VALID_TRACKS    = new Set(Object.values(TRACKS));
const VALID_SOURCES   = new Set(Object.values(INTRUSION_SOURCE));

function validateIntrusion(config) {
  const errors = [];

  if (!config.id || typeof config.id !== 'string') {
    errors.push('id must be a non-empty string');
  }
  if (!VALID_TYPES.has(config.type)) {
    errors.push(`type must be one of: ${[...VALID_TYPES].join(', ')}`);
  }
  if (typeof config.locationKm !== 'number' || config.locationKm < 0) {
    errors.push('locationKm must be a non-negative number');
  }
  if (!config.sectionId || !SECTIONS[config.sectionId]) {
    errors.push(`sectionId must be a valid section ID (e.g. SEC_B_C). Got: ${config.sectionId}`);
  }
  if (!VALID_TRACKS.has(config.track)) {
    errors.push(`track must be one of: ${[...VALID_TRACKS].join(', ')}`);
  }
  if (typeof config.confidence !== 'number' || config.confidence < 0 || config.confidence > 1) {
    errors.push('confidence must be a number between 0 and 1');
  }
  if (!VALID_SEVERITIES.has(config.severity)) {
    errors.push(`severity must be one of: ${[...VALID_SEVERITIES].join(', ')}`);
  }

  // Warn if km doesn't fall in the declared section's range
  if (config.sectionId && SECTIONS[config.sectionId]) {
    const sec = SECTIONS[config.sectionId];
    const fromKm = Math.min(
      ...[sec.fromStation, sec.toStation]
        .map(sid => sec._stationKmPost?.[sid] ?? -Infinity)
    );
    // Non-fatal: just log
  }

  return errors;
}

// ─────────────────────────────────────────────────────────
// IntrusionEngine class
// ─────────────────────────────────────────────────────────
class IntrusionEngine {
  constructor() {
    /** @type {Map<string, Object>} id → intrusion object */
    this._active  = new Map();

    /** @type {Object[]} all cleared/false-positive entries */
    this._history = [];

    /** @type {Set<Function>} registered listener functions */
    this._listeners = new Set();

    /**
     * Clock callback — injected by SimulationEngine so we use the
     * shared simulation time, not wall-clock Date.now().
     * Signature: () => string   e.g. () => '14:32:18'
     */
    this._getSimTime = () => {
      const now = new Date();
      return now.toTimeString().split(' ')[0]; // HH:MM:SS fallback
    };

    /**
     * Event logger callback — injected by SimulationEngine so intrusion
     * events appear in the existing shared event log.
     * Signature: (type, trainId, message) => void
     */
    this._logEvent = () => {};
  }

  // ── Clock / logger injection (called by simulationEngine on init) ──────────

  /**
   * @param {Function} getSimTimeFn — () => 'HH:MM:SS'
   */
  setSimClock(getSimTimeFn) {
    this._getSimTime = getSimTimeFn;
  }

  /**
   * @param {Function} logEventFn — (type, trainId, message, delta?) => void
   */
  setEventLogger(logEventFn) {
    this._logEvent = logEventFn;
  }

  // ── Subscription ───────────────────────────────────────────────────────────

  /**
   * Register a listener. Called with the latest intrusion state every time
   * addIntrusion / clearIntrusion / acknowledgeIntrusion mutates state.
   * Returns an unsubscribe function.
   * @param {Function} listener — (state: { active, history }) => void
   */
  subscribe(listener) {
    this._listeners.add(listener);
    // Emit current state immediately on subscribe
    listener(this._buildState());
    return () => this._listeners.delete(listener);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Add a new intrusion event.
   * Idempotent: if an intrusion with the same id already exists and is active,
   * this is a no-op (prevents duplicate entries from rapid triggers).
   *
   * @param {Object} config
   * @param {string} config.id
   * @param {string} config.type          — INTRUSION_TYPES.*
   * @param {number} config.locationKm
   * @param {string} config.sectionId     — SEC_A_B … SEC_I_J
   * @param {string} config.track         — DN_MAIN | UP_MAIN
   * @param {number} config.confidence    — 0.0–1.0
   * @param {string} config.severity      — INTRUSION_SEVERITY.*
   * @param {number} [config.estimatedClearanceTime] — minutes
   * @param {string} [config.source]      — INTRUSION_SOURCE.*
   * @param {string} [config.status]      — defaults to ACTIVE
   * @returns {{ ok: boolean, errors?: string[], intrusion?: Object }}
   */
  addIntrusion(config) {
    // Idempotency guard
    if (this._active.has(config.id)) {
      return { ok: true, intrusion: this._active.get(config.id) };
    }

    const errors = validateIntrusion(config);
    if (errors.length > 0) {
      console.error('[IntrusionEngine] Validation failed:', errors);
      return { ok: false, errors };
    }

    const intrusion = {
      id:                     config.id,
      type:                   config.type,
      locationKm:             config.locationKm,
      sectionId:              config.sectionId,
      track:                  config.track,
      confidence:             config.confidence,
      severity:               config.severity,
      status:                 config.status || INTRUSION_STATUS.ACTIVE,
      detectedAt:             this._getSimTime(),
      estimatedClearanceTime: config.estimatedClearanceTime ?? null,
      source:                 config.source || INTRUSION_SOURCE.MOCK,
      acknowledgedAt:         null,
      clearedAt:              null
    };

    this._active.set(intrusion.id, intrusion);

    this._logEvent(
      'CRITICAL',
      null,
      `INTRUSION DETECTED — ${intrusion.id} · ${intrusion.type} · KM ${intrusion.locationKm} · ${intrusion.severity} · Section ${intrusion.sectionId}`
    );

    this._notify();
    return { ok: true, intrusion };
  }

  /**
   * Acknowledge an intrusion (controller has seen it).
   * Status changes from ACTIVE → ACKNOWLEDGED.
   * @param {string} id
   */
  acknowledgeIntrusion(id) {
    const intrusion = this._active.get(id);
    if (!intrusion) return { ok: false, error: `No active intrusion with id ${id}` };

    intrusion.status = INTRUSION_STATUS.ACKNOWLEDGED;
    intrusion.acknowledgedAt = this._getSimTime();

    this._logEvent('WARNING', null, `INTRUSION ACKNOWLEDGED — ${id}`);
    this._notify();
    return { ok: true, intrusion };
  }

  /**
   * Clear an intrusion (no longer present on track).
   * Moves from active → history with status CLEARED.
   * @param {string} id
   */
  clearIntrusion(id) {
    const intrusion = this._active.get(id);
    if (!intrusion) {
      return { ok: false, error: `No active intrusion with id ${id}` };
    }

    const cleared = {
      ...intrusion,
      status:    INTRUSION_STATUS.CLEARED,
      clearedAt: this._getSimTime()
    };

    this._active.delete(id);
    this._history.push(cleared);

    this._logEvent(
      'SYSTEM',
      null,
      `INTRUSION CLEARED — ${id} · KM ${cleared.locationKm} · Section ${cleared.sectionId}`
    );

    this._notify();
    return { ok: true, intrusion: cleared };
  }

  /**
   * Mark an intrusion as a false positive.
   * @param {string} id
   */
  markFalsePositive(id) {
    const intrusion = this._active.get(id);
    if (!intrusion) return { ok: false, error: `No active intrusion with id ${id}` };

    const fp = {
      ...intrusion,
      status:    INTRUSION_STATUS.FALSE_POSITIVE,
      clearedAt: this._getSimTime()
    };

    this._active.delete(id);
    this._history.push(fp);

    this._logEvent('SYSTEM', null, `INTRUSION FALSE POSITIVE — ${id}`);
    this._notify();
    return { ok: true, intrusion: fp };
  }

  /**
   * Get current active intrusions as an array.
   * @returns {Object[]}
   */
  getActiveIntrusions() {
    return Array.from(this._active.values());
  }

  /**
   * Get full history (cleared + false positive).
   * @returns {Object[]}
   */
  getHistory() {
    return [...this._history];
  }

  /**
   * Returns the full state snapshot — used by SimulationEngine.buildState()
   * @returns {{ active: Object[], history: Object[] }}
   */
  getState() {
    return this._buildState();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _buildState() {
    return {
      active:  this.getActiveIntrusions(),
      history: this.getHistory()
    };
  }

  _notify() {
    const state = this._buildState();
    this._listeners.forEach(fn => {
      try { fn(state); } catch (e) { console.error('[IntrusionEngine] Listener error:', e); }
    });
  }
}

// Global singleton — shared across all modules
export const intrusionEngine = new IntrusionEngine();
