/**
 * RAIL//AI Impact Engine
 * Generic cascade propagation: change one train → calculate all downstream effects.
 * ML-ready: replace predict() with mlModel.predict() later without any UI changes.
 *
 * SIMULATION / PREDICTION DATA — For demonstration purposes only.
 */

import { SECTIONS, STATION_CHAIN } from './networkModel';
import { calculateETA } from './etaEngine';
import { calculateHeadway, MIN_HEADWAY_SEC } from './headwayEngine';
import { cloneTrains } from './trainModel';

/**
 * The main prediction interface.
 * This function signature is the ML drop-in point.
 *
 * @param {Object} networkState - current full simulation state
 * @param {string} trainId - the train being modified
 * @param {Object} paramChange - { speed, targetSpeed, dwellTime, departureDelay, speedRestriction }
 * @returns {Object} impactReport
 */
export function predict(networkState, trainId, paramChange) {
  return deterministicPropagate(networkState, trainId, paramChange);
}

/**
 * Deterministic cascade propagation engine.
 * Computes before/after states without mutating the live simulation.
 */
function deterministicPropagate(networkState, trainId, paramChange) {
  const { trains, simulationTimeSec } = networkState;

  if (!trains || !trainId) return null;

  // ── Step 1: Snapshot baseline ETAs ──────────────────────
  const baselineETAs = {};
  trains.forEach(t => {
    const eta = calculateETA(t, simulationTimeSec, {}, trains);
    baselineETAs[t.id] = {
      etaSeconds: eta.etaSeconds,
      etaAbsolute: eta.etaAbsolute,
      etaMinutes: eta.etaMinutes,
      speed: t.speed,
      targetSpeed: t.targetSpeed,
      status: t.status,
      delay: t.delay
    };
  });

  // ── Step 2: Apply change to a cloned train set ───────────
  const modifiedTrains = cloneTrains(trains);
  const modifiedTrain = modifiedTrains.find(t => t.id === trainId);
  if (!modifiedTrain) return null;

  if (paramChange.speed !== undefined) modifiedTrain.speed = paramChange.speed;
  if (paramChange.targetSpeed !== undefined) modifiedTrain.targetSpeed = paramChange.targetSpeed;
  if (paramChange.dwellTime !== undefined) modifiedTrain.dwellTarget = paramChange.dwellTime;
  if (paramChange.departureDelay !== undefined) modifiedTrain.delay = (modifiedTrain.delay || 0) + paramChange.departureDelay;
  if (paramChange.speedRestriction !== undefined) modifiedTrain.speedRestriction = paramChange.speedRestriction;

  // ── Step 3: Propagate effects to followers ───────────────
  const affectedSet = new Set([trainId]);
  const directlyAffected = new Set();
  const indirectlyAffected = new Set();

  // Find trains in same section following modifiedTrain
  const followersInSection = modifiedTrains.filter(t =>
    t.id !== trainId &&
    t.currentSection === modifiedTrain.currentSection &&
    t.direction === modifiedTrain.direction &&
    (modifiedTrain.direction === 'SOUTHBOUND'
      ? t.positionPct < modifiedTrain.positionPct
      : t.positionPct > modifiedTrain.positionPct)
  );

  followersInSection.forEach(follower => {
    const hw = calculateHeadway(follower, modifiedTrain);
    if (hw.status !== 'SAFE') {
      // Follower must slow down
      const prevSpeed = follower.targetSpeed;
      follower.targetSpeed = Math.min(follower.targetSpeed, Math.max(0, modifiedTrain.targetSpeed * 0.9));
      if (follower.targetSpeed < prevSpeed) {
        directlyAffected.add(follower.id);
        affectedSet.add(follower.id);
      }
    }
  });

  // Find trains heading to same destination platform
  if (modifiedTrain.isDwelling || paramChange.dwellTime !== undefined) {
    const platformContenders = modifiedTrains.filter(t =>
      t.id !== trainId &&
      t.destination === modifiedTrain.currentStation &&
      t.positionPct > 60
    );
    platformContenders.forEach(t => {
      indirectlyAffected.add(t.id);
      affectedSet.add(t.id);
    });
  }

  // Second-order: trains following directly-affected trains
  directlyAffected.forEach(affId => {
    const affTrain = modifiedTrains.find(t => t.id === affId);
    if (!affTrain) return;
    const secondFollowers = modifiedTrains.filter(t =>
      t.id !== affId && !affectedSet.has(t.id) &&
      t.currentSection === affTrain.currentSection &&
      t.direction === affTrain.direction
    );
    secondFollowers.forEach(t => {
      const hw = calculateHeadway(t, affTrain);
      if (hw.status !== 'SAFE') {
        indirectlyAffected.add(t.id);
        affectedSet.add(t.id);
      }
    });
  });

  // ── Step 4: Recalculate ETAs in modified scenario ────────
  const modifiedETAs = {};
  modifiedTrains.forEach(t => {
    const eta = calculateETA(t, simulationTimeSec, {}, modifiedTrains);
    modifiedETAs[t.id] = {
      etaSeconds: eta.etaSeconds,
      etaAbsolute: eta.etaAbsolute,
      etaMinutes: eta.etaMinutes,
      speed: t.speed,
      targetSpeed: t.targetSpeed,
      status: t.status,
      delay: t.delay
    };
  });

  // ── Step 5: Compute deltas ───────────────────────────────
  const deltas = [];
  Array.from(affectedSet).forEach(id => {
    const base = baselineETAs[id];
    const mod = modifiedETAs[id];
    if (!base || !mod) return;
    const deltaSeconds = mod.etaSeconds - base.etaSeconds;
    if (Math.abs(deltaSeconds) > 10 || id === trainId) {
      deltas.push({
        trainId: id,
        baseETA: base.etaAbsolute,
        modifiedETA: mod.etaAbsolute,
        deltaSeconds,
        deltaMinutes: parseFloat((deltaSeconds / 60).toFixed(1)),
        isDirectlyAffected: directlyAffected.has(id) || id === trainId,
        isIndirectlyAffected: indirectlyAffected.has(id),
        speedChange: mod.speed !== base.speed ? { from: base.speed, to: mod.speed } : null
      });
    }
  });

  // Sort: primary train first, then by delta magnitude
  deltas.sort((a, b) => {
    if (a.trainId === trainId) return -1;
    if (b.trainId === trainId) return 1;
    return Math.abs(b.deltaSeconds) - Math.abs(a.deltaSeconds);
  });

  // ── Step 6: Network-level impact metrics ─────────────────
  const totalNetworkDelaySec = deltas.reduce((acc, d) => acc + Math.max(0, d.deltaSeconds), 0);
  const affectedStations = new Set();
  Array.from(affectedSet).forEach(id => {
    const t = modifiedTrains.find(tr => tr.id === id);
    if (t) {
      if (t.currentStation) affectedStations.add(t.currentStation);
      if (t.destination) affectedStations.add(t.destination);
    }
  });
  const affectedSections = new Set();
  Array.from(affectedSet).forEach(id => {
    const t = modifiedTrains.find(tr => tr.id === id);
    if (t?.currentSection) affectedSections.add(t.currentSection);
  });

  const primaryDelta = deltas.find(d => d.trainId === trainId);
  const hasHighRisk = deltas.some(d => d.deltaSeconds > 300);
  const headwayRisk = followersInSection.length > 0
    ? (followersInSection.length > 2 ? 'HIGH' : 'MEDIUM')
    : 'LOW';

  return {
    // [SIMULATION PREDICTION — Demo Data]
    trainId,
    paramChange,
    baseline: baselineETAs,
    modified: modifiedETAs,
    deltas,
    affectedTrains: Array.from(affectedSet).filter(id => id !== trainId),
    directlyAffected: Array.from(directlyAffected),
    indirectlyAffected: Array.from(indirectlyAffected),
    summary: {
      primaryETADelta: primaryDelta?.deltaMinutes || 0,
      affectedTrainCount: affectedSet.size - 1,
      affectedStationCount: affectedStations.size,
      affectedSectionCount: affectedSections.size,
      totalNetworkDelayMin: parseFloat((totalNetworkDelaySec / 60).toFixed(1)),
      headwayRisk,
      overallRisk: hasHighRisk ? 'HIGH' : (deltas.length > 3 ? 'MEDIUM' : 'LOW')
    },
    isPrediction: true, // SIMULATION / PREDICTION label flag
    timestamp: new Date().toISOString()
  };
}

export { deterministicPropagate };
