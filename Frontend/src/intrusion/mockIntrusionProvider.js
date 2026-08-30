/**
 * RAIL//AI — Mock Intrusion Provider (Step 1 / MOCK only)
 *
 * Generates deterministic intrusion events and routes them through
 * IntrusionEngine into the shared simulation state.
 *
 * Architecture:
 *   MockIntrusionProvider  →  IntrusionEngine  →  SimulationContext
 *
 * Design rules:
 *  • NO random values — same input always produces the same output.
 *  • NO React dependency — plain JS class / singleton.
 *  • NO separate simulation clock — uses intrusionEngine._getSimTime().
 *  • Future MLIntrusionProvider implements the same public API; UI is unaware.
 *
 * Public API (matches future MLIntrusionProvider interface):
 *   triggerIntrusion(config)          → { ok, intrusion?, errors? }
 *   triggerDemoIntrusion()            → { ok, intrusion?, errors? }
 *   clearIntrusion(id)                → { ok, intrusion?, error? }
 *   acknowledgeIntrusion(id)          → { ok, intrusion?, error? }
 *   markFalsePositive(id)             → { ok, intrusion?, error? }
 *   getActiveIntrusions()             → Object[]
 *   getHistory()                      → Object[]
 *   subscribe(listener)               → unsubscribe fn
 */

import { intrusionEngine } from './intrusionEngine';
import { DEMO_INTRUSION_001, INTRUSION_SOURCE } from './intrusionTypes';

class MockIntrusionProvider {
  constructor() {
    this._source = INTRUSION_SOURCE.MOCK;

    // Sequence counter for deterministic ID generation
    // (demo uses INTR-001; programmatic triggers use INTR-002, INTR-003, …)
    this._sequence = 1;
  }

  // ── Subscription (delegates to engine) ────────────────────────────────────

  /**
   * Subscribe to intrusion state changes.
   * Listener receives { active: [], history: [] } on every change.
   * @param {Function} listener
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    return intrusionEngine.subscribe(listener);
  }

  // ── Trigger ────────────────────────────────────────────────────────────────

  /**
   * Trigger the deterministic DEMO intrusion (INTR-001).
   * Always produces the same event regardless of call time.
   * Useful for presentations, end-to-end tests, and dev mode.
   *
   * @returns {{ ok: boolean, intrusion?: Object, errors?: string[] }}
   */
  triggerDemoIntrusion() {
    return this.triggerIntrusion(DEMO_INTRUSION_001);
  }

  /**
   * Trigger a custom intrusion event.
   * The provider stamps it with source=MOCK if no source is provided.
   * An auto-generated ID is assigned if config.id is omitted.
   *
   * @param {Object} config
   * @param {string} [config.id]                — defaults to INTR-NNN
   * @param {string} config.type                — INTRUSION_TYPES.*
   * @param {number} config.locationKm
   * @param {string} config.sectionId           — SEC_A_B … SEC_I_J
   * @param {string} config.track               — DN_MAIN | UP_MAIN
   * @param {number} config.confidence          — 0.0–1.0
   * @param {string} config.severity            — INTRUSION_SEVERITY.*
   * @param {number} [config.estimatedClearanceTime] — minutes
   * @returns {{ ok: boolean, intrusion?: Object, errors?: string[] }}
   */
  triggerIntrusion(config) {
    const enriched = {
      ...config,
      id:     config.id || this._nextId(),
      source: config.source || this._source
    };
    return intrusionEngine.addIntrusion(enriched);
  }

  // ── Clear / lifecycle ──────────────────────────────────────────────────────

  /**
   * Clear an active intrusion by ID.
   * @param {string} id
   * @returns {{ ok: boolean, intrusion?: Object, error?: string }}
   */
  clearIntrusion(id) {
    return intrusionEngine.clearIntrusion(id);
  }

  /**
   * Acknowledge an active intrusion (operator has seen it).
   * @param {string} id
   * @returns {{ ok: boolean, intrusion?: Object, error?: string }}
   */
  acknowledgeIntrusion(id) {
    return intrusionEngine.acknowledgeIntrusion(id);
  }

  /**
   * Mark an intrusion as a false positive.
   * @param {string} id
   * @returns {{ ok: boolean, intrusion?: Object, error?: string }}
   */
  markFalsePositive(id) {
    return intrusionEngine.markFalsePositive(id);
  }

  // ── Query ──────────────────────────────────────────────────────────────────

  /**
   * Get current active intrusions.
   * @returns {Object[]}
   */
  getActiveIntrusions() {
    return intrusionEngine.getActiveIntrusions();
  }

  /**
   * Get cleared / false-positive history.
   * @returns {Object[]}
   */
  getHistory() {
    return intrusionEngine.getHistory();
  }

  /**
   * Snapshot of current intrusion state.
   * @returns {{ active: Object[], history: Object[] }}
   */
  getState() {
    return intrusionEngine.getState();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _nextId() {
    this._sequence += 1;
    return `INTR-${String(this._sequence).padStart(3, '0')}`;
  }
}

// Global singleton
export const mockIntrusionProvider = new MockIntrusionProvider();
