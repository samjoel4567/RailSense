/**
 * RAIL//AI Prediction Engine
 * ML-ready interface for departure recommendations, conflict probability, and ETA prediction.
 *
 * Current implementation: MockPredictionProvider (deterministic rules)
 * Future swap: replace MockPredictionProvider with MLPredictionProvider
 * The UI never knows which provider is active.
 *
 * SIMULATION / PREDICTION DATA — For demonstration purposes only.
 */

import { SECTIONS, STATIONS, STATION_CHAIN } from './networkModel';
import { MIN_HEADWAY_SEC, calculateHeadway, findImmediateLeader } from './headwayEngine';

// ─────────────────────────────────────────────────────────
// Provider Interface (swap this for ML later)
// ─────────────────────────────────────────────────────────
let activeProvider = null;

export function setPredictionProvider(provider) {
  activeProvider = provider;
}

/**
 * Main prediction interface.
 * @param {Object} train - the train requesting prediction (typically the cab train)
 * @param {Object} networkState - { trains, stationStates, sectionStates, simulationTimeSec, signalStates }
 * @returns {PredictionResult}
 */
export function predict(train, networkState) {
  if (activeProvider) {
    return activeProvider.predict(train, networkState);
  }
  return mockPredict(train, networkState);
}

// ─────────────────────────────────────────────────────────
// Mock Prediction Provider (deterministic)
// ─────────────────────────────────────────────────────────
export const MockPredictionProvider = {
  predict: mockPredict
};

function mockPredict(train, networkState) {
  if (!train || !networkState) return null;
  const { trains = [], simulationTimeSec = 0, signalStates = {} } = networkState;

  // ── 1. Find traffic ahead ─────────────────────────────
  const trafficAhead = findTrafficAhead(train, trains);
  const leader = trafficAhead[0] || null;

  // ── 2. Calculate headway to leader ───────────────────
  let headwayResult = { headwaySec: 9999, status: 'SAFE', headwayMinutes: 999 };
  if (leader) {
    headwayResult = calculateHeadway(train, leader);
  }

  // ── 3. Find junction conflicts ────────────────────────
  const junctionConflict = detectUpcomingJunctionConflict(train, trains);

  // ── 4. Check signal ahead ─────────────────────────────
  const sectionSignal = train.currentSection ? signalStates[train.currentSection] : null;
  const entryAspect = sectionSignal?.entry?.aspect || 'GREEN';

  // ── 5. Calculate ETA to destination ──────────────────
  const etaSeconds = computeSimpleETA(train);
  const etaConfidence = headwayResult.status === 'SAFE' ? 0.92 : 0.72;

  // ── 6. Build recommendation ───────────────────────────
  let recommendedAction = 'PROCEED';
  let reason = 'Headway sufficient. Signal clear. No conflicts detected.';
  let estimatedTimeSaved = 0;
  let conflictProbability = 0.05;
  let predictedDelay = 0;

  if (entryAspect === 'RED') {
    recommendedAction = 'HOLD';
    reason = 'Section signal RED — section occupied ahead.';
    predictedDelay = 3;
    conflictProbability = 0.9;
  } else if (headwayResult.status === 'CONSTRAINED') {
    recommendedAction = 'HOLD';
    const marginMin = Math.abs(headwayResult.marginMinutes || 0).toFixed(1);
    reason = `Insufficient headway: ${headwayResult.headwayMinutes?.toFixed(1) || '?'} min (need ${(MIN_HEADWAY_SEC/60).toFixed(1)} min). Margin: -${marginMin} min.`;
    predictedDelay = Math.ceil((MIN_HEADWAY_SEC - headwayResult.headwaySec) / 60);
    conflictProbability = 0.85;
  } else if (junctionConflict) {
    const clearInMin = Math.round(junctionConflict.clearanceTimeSec / 60);
    if (clearInMin <= 2) {
      recommendedAction = 'PROCEED';
      reason = `${junctionConflict.conflictingTrainId} clears junction in ~${clearInMin} min. Safe to proceed.`;
      estimatedTimeSaved = 3;
      conflictProbability = 0.15;
    } else {
      recommendedAction = 'HOLD';
      reason = `${junctionConflict.conflictingTrainId} expected at junction in ${clearInMin} min. Insufficient clearance.`;
      predictedDelay = clearInMin;
      conflictProbability = 0.65;
    }
  } else if (headwayResult.status === 'CAUTION') {
    recommendedAction = 'PROCEED';
    reason = `Headway caution: ${headwayResult.headwayMinutes?.toFixed(1)} min. Proceed at reduced speed.`;
    estimatedTimeSaved = 1;
    conflictProbability = 0.25;
  } else if (train.delay > 5) {
    recommendedAction = 'PROCEED';
    reason = `Train delayed +${Math.round(train.delay)} min. Proceeding will reduce delay.`;
    estimatedTimeSaved = Math.min(train.delay, 4);
    conflictProbability = 0.08;
  } else {
    recommendedAction = 'PROCEED';
    estimatedTimeSaved = 0;
    conflictProbability = 0.05;
  }

  // ── 7. Affected trains ────────────────────────────────
  const affectedTrains = findAffectedByDecision(train, trains, recommendedAction);

  return {
    // [SIMULATION PREDICTION — Demo Data]
    isPrediction: true,
    trainId: train.id,
    recommendedAction,           // 'PROCEED' | 'HOLD'
    reason,
    conflictProbability,         // 0–1
    predictedDelay,              // minutes
    estimatedTimeSaved,          // minutes
    etaSeconds,
    etaMinutes: Math.round(etaSeconds / 60),
    etaConfidence,               // 0–1
    affectedTrains,              // trainId[]
    headwayStatus: headwayResult.status,
    headwayMinutes: headwayResult.headwayMinutes,
    leaderTrainId: leader?.id || null,
    leaderSpeed: leader?.speed || null,
    junctionConflict: junctionConflict ? {
      junctionId: junctionConflict.junctionId,
      conflictingTrainId: junctionConflict.conflictingTrainId,
      clearanceTimeSec: junctionConflict.clearanceTimeSec
    } : null,
    signalAspect: entryAspect,
    timestamp: simulationTimeSec
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/**
 * Find trains ahead of this train on its route (same direction, same/adjacent section).
 */
function findTrafficAhead(train, trains) {
  if (!train || train.isDwelling) return [];

  return trains.filter(t => {
    if (t.id === train.id || t.hasReachedDestination) return false;
    if (t.direction !== train.direction) return false;

    // Same section, ahead of this train
    if (t.currentSection === train.currentSection && !t.isDwelling) {
      if (train.direction === 'SOUTHBOUND') return t.positionPct > train.positionPct;
      return t.positionPct < train.positionPct;
    }

    // Next section in the route
    const route = train.route || [];
    const curIdx = route.indexOf(train.currentSection);
    if (curIdx === -1) return false;
    return route.slice(curIdx + 1, curIdx + 3).includes(t.currentSection);
  }).sort((a, b) => {
    // Sort by proximity
    if (a.currentSection === train.currentSection && b.currentSection !== train.currentSection) return -1;
    if (b.currentSection === train.currentSection && a.currentSection !== train.currentSection) return 1;
    return 0;
  });
}

/**
 * Check if there's a junction conflict on the train's upcoming route.
 */
function detectUpcomingJunctionConflict(train, trains) {
  if (!train || train.isDwelling) return null;
  const route = train.route || [];
  const curIdx = route.indexOf(train.currentSection);
  if (curIdx === -1) return null;

  // Look at sections ahead for junctions
  for (let i = curIdx; i < Math.min(curIdx + 3, route.length); i++) {
    const sec = SECTIONS[route[i]];
    if (!sec?.junctionId) continue;

    // Find a train approaching the same junction from opposite direction
    const conflicting = trains.find(t => {
      if (t.id === train.id || t.hasReachedDestination) return false;
      if (t.direction === train.direction) return false;
      const tSec = SECTIONS[t.currentSection];
      return tSec?.junctionId === sec.junctionId;
    });

    if (conflicting) {
      // Calculate approx time for conflicting train to clear junction
      const conflictingSec = SECTIONS[conflicting.currentSection];
      const conflictingDistKm = conflictingSec
        ? (conflicting.direction === 'SOUTHBOUND'
            ? conflictingSec.lengthKm * (1 - conflicting.positionPct / 100)
            : conflictingSec.lengthKm * (conflicting.positionPct / 100))
        : 5;
      const clearanceTimeSec = conflictingDistKm / Math.max(1, conflicting.speed) * 3600;
      return {
        junctionId: sec.junctionId,
        conflictingTrainId: conflicting.id,
        clearanceTimeSec
      };
    }
  }
  return null;
}

/**
 * Simple remaining-distance ETA for a train.
 */
function computeSimpleETA(train) {
  if (train.hasReachedDestination) return 0;
  if (train.isDwelling) {
    const dwellRem = Math.max(0, train.dwellTarget - train.dwellTime);
    return dwellRem + estimateRemainingTransitSec(train);
  }
  return estimateRemainingTransitSec(train);
}

function estimateRemainingTransitSec(train) {
  const route = train.route || [];
  const curIdx = route.indexOf(train.currentSection);
  const speed = Math.max(1, train.speed || train.normalSpeed || 80);

  let remainKm = 0;
  if (curIdx !== -1 && SECTIONS[train.currentSection]) {
    const sec = SECTIONS[train.currentSection];
    remainKm += sec.lengthKm * (1 - train.positionPct / 100);
    for (let i = curIdx + 1; i < route.length; i++) {
      const s = SECTIONS[route[i]];
      if (s) remainKm += s.lengthKm;
    }
  }
  return Math.round((remainKm / speed) * 3600);
}

/**
 * Trains affected by the decision (if HOLD, trains behind will be delayed).
 */
function findAffectedByDecision(train, trains, decision) {
  if (decision === 'PROCEED') return [];
  if (!train.currentStation && !train.currentSection) return [];

  return trains.filter(t => {
    if (t.id === train.id) return false;
    if (t.direction !== train.direction) return false;
    if (t.hasReachedDestination) return false;
    // Trains behind this one on the same route
    if (t.currentSection === train.currentSection && !t.isDwelling) {
      if (train.direction === 'SOUTHBOUND') return t.positionPct < train.positionPct;
      return t.positionPct > train.positionPct;
    }
    return false;
  }).map(t => t.id);
}
