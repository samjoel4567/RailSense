/**
 * RAIL//AI ETA Engine
 * Deterministic ETA calculation for all trains.
 * No random values. Fully recalculates on parameter change.
 * ML-ready: replace calculateETA with mlModel.predict later.
 */

import { SECTIONS, STATIONS, STATION_CHAIN, SECTION_BETWEEN } from './networkModel';

const BASE_SIM_TIME_SEC = 14 * 3600 + 20 * 60; // 14:20:00

/**
 * Format seconds-to-arrival as HH:MM absolute time string
 */
export function formatAbsoluteETA(simulationTimeSec, etaSeconds) {
  if (etaSeconds <= 0) return 'ARRIVED';
  const arrival = simulationTimeSec + etaSeconds;
  const h = Math.floor(arrival / 3600) % 24;
  const m = Math.floor((arrival % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format ETA in minutes as a readable string
 */
export function formatETAMinutes(etaSeconds) {
  if (etaSeconds <= 0) return 'ARRIVED';
  const m = Math.round(etaSeconds / 60);
  if (m < 1) return '<1 MIN';
  return `${m} MIN`;
}

/**
 * Compute expected remaining distance in km for a train to reach its destination.
 * Takes into account the train's current position within its current section.
 */
export function getRemainingDistanceKm(train, sections) {
  if (train.isDwelling || train.hasReachedDestination) {
    // If dwelling at destination
    if (train.currentStation === train.destination) return 0;
    // If dwelling mid-route
    const route = train.route || [];
    const stationIdx = STATION_CHAIN.indexOf(train.currentStation);
    const destIdx = STATION_CHAIN.indexOf(train.destination);
    let dist = 0;
    if (stationIdx !== -1 && destIdx !== -1) {
      const step = destIdx > stationIdx ? 1 : -1;
      for (let i = stationIdx; i !== destIdx; i += step) {
        const key = `${STATION_CHAIN[i]}_${STATION_CHAIN[i + step]}`;
        const secId = SECTION_BETWEEN?.[key];
        if (secId && SECTIONS[secId]) dist += SECTIONS[secId].lengthKm;
      }
    }
    return dist;
  }

  const secDef = sections[train.currentSection] || SECTIONS[train.currentSection];
  if (!secDef) return 0;

  const sectionLen = secDef.lengthKm;
  // Distance remaining in current section
  const remainInSection = sectionLen * (1 - train.positionPct / 100);

  // Then sum all subsequent sections in route
  const route = train.route || [];
  const currentIdx = route.indexOf(train.currentSection);
  let subsequentDist = 0;
  if (currentIdx !== -1) {
    for (let i = currentIdx + 1; i < route.length; i++) {
      const s = SECTIONS[route[i]];
      if (s) subsequentDist += s.lengthKm;
    }
  }

  return Math.max(0, remainInSection + subsequentDist);
}

/**
 * Calculate headway constraint time for a following train.
 * Returns extra seconds the follower must wait.
 */
export function getHeadwayConstraintSec(follower, leader, minHeadwaySec) {
  if (!leader) return 0;
  const headwayMargin = follower.headwayMarginSec ?? 999;
  if (headwayMargin >= minHeadwaySec) return 0;
  return minHeadwaySec - headwayMargin;
}

/**
 * Main ETA calculation for a single train.
 * Returns etaSeconds (to destination) and etaAbsolute (HH:MM string).
 */
export function calculateETA(train, simulationTimeSec, sectionStates, trainList) {
  // Already arrived
  if (train.hasReachedDestination) {
    return { etaSeconds: 0, etaAbsolute: 'ARRIVED', etaMinutes: 'ARRIVED' };
  }

  // Train is dwelling — ETA = dwell remaining + transit ETA
  const speedKmH = train.speed > 0 ? train.speed : train.targetSpeed;
  const effectiveSpeed = train.speedRestriction
    ? Math.min(speedKmH, train.speedRestriction)
    : speedKmH;

  if (effectiveSpeed <= 0 && !train.isDwelling) {
    return { etaSeconds: 9999, etaAbsolute: 'STANDBY', etaMinutes: 'STANDBY' };
  }

  // Calculate remaining km
  let remainKm = 0;
  if (train.currentStation && !train.isDwelling) {
    // Shouldn't happen — if at station, isDwelling should be true
    remainKm = 0;
  } else if (train.isDwelling) {
    // Find distance from current station to destination
    const stIdx = STATION_CHAIN.indexOf(train.currentStation);
    const dIdx = STATION_CHAIN.indexOf(train.destination);
    if (stIdx === -1 || dIdx === -1 || stIdx === dIdx) {
      remainKm = 0;
    } else {
      const step = dIdx > stIdx ? 1 : -1;
      for (let i = stIdx; i !== dIdx; i += step) {
        const from = STATION_CHAIN[i];
        const to = STATION_CHAIN[i + step];
        // find section
        const sec = Object.values(SECTIONS).find(s =>
          (s.fromStation === from && s.toStation === to) ||
          (s.toStation === from && s.fromStation === to)
        );
        if (sec) remainKm += sec.lengthKm;
      }
    }
  } else {
    // In transit — distance remaining in current section + subsequent sections
    const secDef = SECTIONS[train.currentSection];
    if (secDef) {
      remainKm = secDef.lengthKm * (1 - train.positionPct / 100);
    }
    // Add subsequent sections in route
    const route = train.route || [];
    const curIdx = route.indexOf(train.currentSection);
    if (curIdx !== -1) {
      for (let i = curIdx + 1; i < route.length; i++) {
        const s = SECTIONS[route[i]];
        if (s) remainKm += s.lengthKm;
      }
    }
  }

  // Base travel time in seconds
  const travelSec = effectiveSpeed > 0 ? Math.round((remainKm / effectiveSpeed) * 3600) : 9999;

  // Add dwell time remaining if currently dwelling
  const dwellRemaining = train.isDwelling
    ? Math.max(0, train.dwellTarget - train.dwellTime)
    : 0;

  // Add headway constraint penalty
  const leader = findLeader(train, trainList);
  const MIN_HEADWAY_SEC = 288; // 4.8 min
  const headwayPenalty = leader ? getHeadwayConstraintSec(train, leader, MIN_HEADWAY_SEC) : 0;

  const totalSec = travelSec + dwellRemaining + headwayPenalty;
  const absolute = formatAbsoluteETA(simulationTimeSec, totalSec);

  return {
    etaSeconds: totalSec,
    etaAbsolute: absolute,
    etaMinutes: formatETAMinutes(totalSec),
    remainingKm: parseFloat(remainKm.toFixed(2)),
    dwellRemainingS: dwellRemaining,
    headwayPenaltyS: headwayPenalty
  };
}

/**
 * Find the train immediately ahead of `train` on the same section/route.
 */
function findLeader(train, trainList) {
  if (!trainList || !train.currentSection) return null;
  const sameSection = trainList.filter(t =>
    t.id !== train.id &&
    t.currentSection === train.currentSection &&
    t.direction === train.direction
  );
  if (train.direction === 'SOUTHBOUND') {
    // Leader is the one with highest positionPct ahead of us
    const ahead = sameSection.filter(t => t.positionPct > train.positionPct);
    if (!ahead.length) return null;
    return ahead.reduce((min, t) => t.positionPct < min.positionPct ? t : min);
  } else {
    // NORTHBOUND: lower positionPct is "ahead" (closer to origin)
    const ahead = sameSection.filter(t => t.positionPct < train.positionPct);
    if (!ahead.length) return null;
    return ahead.reduce((max, t) => t.positionPct > max.positionPct ? t : max);
  }
}

export { findLeader };

/**
 * Recalculate ETAs for all trains in the network.
 * Returns a map: trainId → { etaSeconds, etaAbsolute, etaMinutes }
 */
export function recalculateAllETAs(trains, simulationTimeSec, sectionStates) {
  const etaMap = {};
  trains.forEach(train => {
    etaMap[train.id] = calculateETA(train, simulationTimeSec, sectionStates, trains);
  });
  return etaMap;
}
