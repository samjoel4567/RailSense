/**
 * RAIL//AI — Intrusion Detection Types
 *
 * Constants shared across MockIntrusionProvider, IntrusionEngine,
 * SimulationContext, and future MLIntrusionProvider.
 *
 * ── Infrastructure references ──────────────────────────────
 * All section IDs match src/simulator/networkModel.js SECTIONS keys.
 * Track names match the twin-track A-J corridor convention:
 *   DN_MAIN — Down Main (SOUTHBOUND, A→J)
 *   UP_MAIN — Up Main  (NORTHBOUND, J→A)
 *
 * Section km ranges (from networkModel.js):
 *   SEC_A_B : km  0 – 28   SEC_B_C : km 28 – 54  ← demo INTR-001 at 40.6
 *   SEC_C_D : km 54 – 78   SEC_D_E : km 78 – 102
 *   SEC_E_F : km 102– 130  SEC_F_G : km 130– 156
 *   SEC_G_H : km 156– 180  SEC_H_I : km 180– 205
 *   SEC_I_J : km 205– 232
 * ────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────
// INTRUSION TYPES
// ─────────────────────────────────────────────────────────
export const INTRUSION_TYPES = {
  PERSON_ON_TRACK:   'PERSON_ON_TRACK',
  OBJECT_ON_TRACK:   'OBJECT_ON_TRACK',
  VEHICLE_INTRUSION: 'VEHICLE_INTRUSION'
};

// ─────────────────────────────────────────────────────────
// SEVERITY LEVELS
// ─────────────────────────────────────────────────────────
export const INTRUSION_SEVERITY = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL'
};

// ─────────────────────────────────────────────────────────
// LIFECYCLE STATUS
// ─────────────────────────────────────────────────────────
export const INTRUSION_STATUS = {
  DETECTED:        'DETECTED',       // Just detected, not yet confirmed
  ACTIVE:          'ACTIVE',         // Confirmed — intrusion is present
  ACKNOWLEDGED:    'ACKNOWLEDGED',   // Controller has acknowledged it
  CLEARED:         'CLEARED',        // No longer present
  FALSE_POSITIVE:  'FALSE_POSITIVE'
};

// ─────────────────────────────────────────────────────────
// TRACKS (corridor convention for the A-J twin-track main line)
// ─────────────────────────────────────────────────────────
export const TRACKS = {
  DN_MAIN: 'DN_MAIN',   // Down Main — SOUTHBOUND (A → J)
  UP_MAIN: 'UP_MAIN'    // Up Main  — NORTHBOUND (J → A)
};

// ─────────────────────────────────────────────────────────
// SOURCE IDENTIFIERS
// ─────────────────────────────────────────────────────────
export const INTRUSION_SOURCE = {
  MOCK:      'MOCK',       // Deterministic test/demo event
  ML_VISION: 'ML_VISION',  // Future: real camera + YOLO pipeline
  MANUAL:    'MANUAL'      // Operator-entered alert
};

// ─────────────────────────────────────────────────────────
// DETERMINISTIC DEMO INTRUSION — INTR-001
// SEC_B_C spans km 28–54; km 40.6 is 12.6 km into the section
// ─────────────────────────────────────────────────────────
export const DEMO_INTRUSION_001 = {
  id:                     'INTR-001',
  type:                   INTRUSION_TYPES.PERSON_ON_TRACK,
  locationKm:             40.6,
  sectionId:              'SEC_B_C',
  track:                  TRACKS.DN_MAIN,
  confidence:             0.96,
  severity:               INTRUSION_SEVERITY.CRITICAL,
  estimatedClearanceTime: 14,     // minutes until expected clearance
  source:                 INTRUSION_SOURCE.MOCK
};
