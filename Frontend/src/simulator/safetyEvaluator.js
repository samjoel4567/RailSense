/**
 * RAIL//AI Safety & Conflict Evaluator
 * Pure deterministic safety evaluation module.
 * Ready for future ML model drop-in replacement.
 */

/**
 * Evaluates departure authorization for a given train in the railway network.
 * @param {Object} simContext Current simulation state and train entities
 * @param {string} trainId ID of the train requesting departure (e.g. 'LOCAL_101')
 * @returns {Object} Structured evaluation result
 */
export function evaluateDeparture(simContext, trainId = null) {
  const { phase, trains = [], hazardActive = false } = simContext;

  const localTrain = trains.find((t) => t.id === trainId) || {
    id: trainId,
    status: 'WAITING',
    progressPct: 0
  };

  const expressTrain = trains.find((t) => t.id === 'EXPRESS_201') || {
    id: 'EXPRESS_201',
    progressPct: 0,
    speed: 118
  };

  // Section B total length: 24.8 km; Junction J-02 is at KM 12.4 (progress ~50%-55%)
  const junctionKm = 12.4;
  const expressDistTraversed = expressTrain.distanceTraversedKm ?? (expressTrain.progressPct * 0.248);
  const distToJunction = junctionKm - expressDistTraversed;
  const expressSpeed = Math.max(10, expressTrain.speed || 100);

  // Calculate headway separation time
  const headwaySeconds = distToJunction > 0 
    ? Math.round((distToJunction / expressSpeed) * 3600)
    : 0;

  const mm = Math.floor(headwaySeconds / 60);
  const ss = headwaySeconds % 60;
  const clearanceTimeString = distToJunction > 0 
    ? `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
    : '00:00 (CLEARED)';

  // 1. Emergency or AI Hazard Check (Phase 5 / Obstacle)
  if (hazardActive || phase === 5) {
    return {
      authorized: false,
      reason: 'AI VISION HAZARD DETECTED ON SECTION B — SIL-4 RESTRICTION ACTIVE',
      risk: 86,
      riskCategory: 'CRITICAL',
      recommendation: 'WAIT',
      conflictTrain: 'OBSTACLE_BLOCK',
      headwayStatus: 'UNSAFE',
      headwaySeconds,
      distanceToConflictMeters: Math.round(Math.max(0, distToJunction * 1000)),
      estimatedClearanceTime: 'HOLD INDEFINITELY',
      routeStatus: 'LOCKED / RESTRICTED',
      signalAspect: 'RED'
    };
  }

  // 2. Conflicting Train Approaching Junction Check
  // Express 201 is in conflict zone if it has not yet passed Junction J-02 (progress <= 55% or dist <= 13.5km)
  const isExpressInConflictZone = expressTrain.progressPct < 55 || distToJunction > -1.0;

  if (isExpressInConflictZone) {
    return {
      authorized: false,
      reason: 'EXPRESS_201 APPROACHING JUNCTION J-02 — MOVEMENT HELD',
      risk: phase === 4 ? 68 : phase === 3 ? 48 : 38,
      riskCategory: phase === 4 ? 'HIGH' : 'MODERATE',
      recommendation: 'WAIT',
      conflictTrain: 'EXPRESS_201',
      headwayStatus: 'UNSAFE',
      headwaySeconds,
      distanceToConflictMeters: Math.max(0, Math.round(distToJunction * 1000)),
      estimatedClearanceTime: clearanceTimeString,
      routeStatus: 'LOCKED FOR EXPRESS PRIORITY',
      signalAspect: 'RED'
    };
  }

  // 3. Clear Route — Safe for Departure
  return {
    authorized: true,
    reason: 'JUNCTION J-02 CLEARED — SECTION B INTERLOCKING AVAILABLE',
    risk: 22,
    riskCategory: 'LOW',
    recommendation: 'PROCEED',
    conflictTrain: 'NONE (CLEARED)',
    headwayStatus: 'SAFE',
    headwaySeconds: 0,
    distanceToConflictMeters: 0,
    estimatedClearanceTime: 'AVAILABLE',
    routeStatus: 'AVAILABLE',
    signalAspect: 'GREEN'
  };
}

/**
 * Calculates deterministic network risk score.
 */
export function calculateNetworkRisk(phase, trains = [], hazardActive = false) {
  if (hazardActive || phase === 5) {
    return {
      score: 86,
      category: 'CRITICAL',
      breakdown: { headwayRisk: 30, signalCompliance: 25, speedAdherence: 15, scheduleVariance: 16 }
    };
  }

  const express = trains.find((t) => t.id === 'EXPRESS_201');
  const isApproachingJunction = express && express.progressPct >= 35 && express.progressPct < 58;

  if (phase === 4 || isApproachingJunction) {
    return {
      score: 68,
      category: 'HIGH',
      breakdown: { headwayRisk: 34, signalCompliance: 12, speedAdherence: 8, scheduleVariance: 14 }
    };
  }

  if (phase === 3) {
    return {
      score: 34,
      category: 'MODERATE',
      breakdown: { headwayRisk: 14, signalCompliance: 6, speedAdherence: 5, scheduleVariance: 9 }
    };
  }

  if (phase === 2) {
    return {
      score: 28,
      category: 'LOW',
      breakdown: { headwayRisk: 8, signalCompliance: 4, speedAdherence: 4, scheduleVariance: 12 }
    };
  }

  return {
    score: 18,
    category: 'NOMINAL',
    breakdown: { headwayRisk: 4, signalCompliance: 4, speedAdherence: 4, scheduleVariance: 6 }
  };
}
