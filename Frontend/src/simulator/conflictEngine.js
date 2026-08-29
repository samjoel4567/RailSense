/**
 * RAIL//AI Conflict Engine
 * Detects junction conflicts, platform conflicts, and section headway violations.
 */

import { JUNCTIONS, SECTIONS, STATIONS } from './networkModel';
import { calculateHeadway, MIN_HEADWAY_SEC } from './headwayEngine';

/**
 * Predict time for a train to reach a junction (in seconds from now).
 * Returns null if the train won't cross the junction.
 */
function predictTimeToJunction(train, junction) {
  const secDef = SECTIONS[train.currentSection];
  if (!secDef) return null;
  if (secDef.junctionId !== junction.id) {
    // Not directly in the section with this junction — check if in route
    const route = train.route || [];
    let cumDistance = secDef.lengthKm * (1 - train.positionPct / 100);
    let found = false;
    for (let i = route.indexOf(train.currentSection) + 1; i < route.length; i++) {
      const s = SECTIONS[route[i]];
      if (!s) continue;
      if (s.junctionId === junction.id) {
        // Junction is at roughly half the section
        cumDistance += s.lengthKm * 0.5;
        found = true;
        break;
      }
      cumDistance += s.lengthKm;
    }
    if (!found) return null;
    const speedKmH = Math.max(1, train.speed);
    return Math.round((cumDistance / speedKmH) * 3600);
  }

  // Junction is in current section — calculate position within section
  const junctionPosPct = 50; // junctions are roughly at midpoint
  const pctToJunction = junctionPosPct - train.positionPct;
  if (pctToJunction <= 0) return 0; // already past
  const distToJunctionKm = (pctToJunction / 100) * secDef.lengthKm;
  const speedKmH = Math.max(1, train.speed);
  return Math.round((distToJunctionKm / speedKmH) * 3600);
}

/**
 * Detect junction conflicts between trains.
 */
export function detectJunctionConflicts(trains) {
  const conflicts = [];

  Object.values(JUNCTIONS).forEach(junction => {
    // Find all trains approaching this junction
    const approaching = trains.filter(t => {
      if (t.isDwelling || t.hasReachedDestination) return false;
      const eta = predictTimeToJunction(t, junction);
      return eta !== null && eta < 600; // within 10 minutes
    });

    if (approaching.length < 2) return;

    // Check for conflicting movements (different directions approaching same junction)
    const southbound = approaching.filter(t => t.direction === 'SOUTHBOUND');
    const northbound = approaching.filter(t => t.direction === 'NORTHBOUND');

    if (southbound.length > 0 && northbound.length > 0) {
      southbound.forEach(sb => {
        northbound.forEach(nb => {
          const sbETA = predictTimeToJunction(sb, junction);
          const nbETA = predictTimeToJunction(nb, junction);
          if (sbETA === null || nbETA === null) return;
          const timeDiff = Math.abs(sbETA - nbETA);
          if (timeDiff < MIN_HEADWAY_SEC) {
            const risk = timeDiff < 120 ? 'CRITICAL' : timeDiff < 240 ? 'HIGH' : 'MEDIUM';
            conflicts.push({
              type: 'JUNCTION',
              junctionId: junction.id,
              junctionName: junction.name,
              trainAId: sb.id,
              trainBId: nb.id,
              trainAETA: sbETA,
              trainBETA: nbETA,
              headwayGapSec: timeDiff,
              risk,
              description: `${sb.id} (SB, ETA ${Math.round(sbETA / 60)}min) vs ${nb.id} (NB, ETA ${Math.round(nbETA / 60)}min) at ${junction.name}`,
              recommendedAction: `Hold ${nbETA < sbETA ? nb.id : sb.id} for ${Math.round((MIN_HEADWAY_SEC - timeDiff) / 60)} min`
            });
          }
        });
      });
    }

    // Same-direction trains too close to junction
    [...southbound, ...northbound].forEach(group => {
      // Handled by headwayEngine
    });
  });

  return conflicts;
}

/**
 * Detect platform conflicts at stations.
 * Returns list of platforms that have multiple trains trying to use them.
 */
export function detectPlatformConflicts(trains, stationStates) {
  const conflicts = [];

  if (!stationStates) return conflicts;

  Object.entries(stationStates).forEach(([stationId, stationState]) => {
    if (!stationState || !stationState.platforms) return;

    Object.entries(stationState.platforms).forEach(([platId, platState]) => {
      if (!platState) return;

      // Trains currently at this platform
      const at = trains.filter(t => t.isDwelling && t.currentStation === stationId && t.platform === platId);
      // Trains approaching and reserved for this platform
      const reserved = trains.filter(t =>
        !t.isDwelling &&
        t.destination === stationId &&
        t.platform === platId &&
        t.positionPct > 80
      );

      if (at.length + reserved.length > 1) {
        conflicts.push({
          type: 'PLATFORM',
          stationId,
          platformId: platId,
          occupyingTrains: [...at.map(t => t.id), ...reserved.map(t => t.id)],
          risk: at.length > 1 ? 'CRITICAL' : 'HIGH',
          description: `Platform ${platId} at ${stationId} — ${at.length} occupying, ${reserved.length} approaching`
        });
      }
    });
  });

  return conflicts;
}

/**
 * Detect section headway violations.
 */
export function detectSectionConflicts(trains) {
  const conflicts = [];

  // Group trains by section and direction
  const sectionGroups = {};
  trains.forEach(t => {
    if (t.isDwelling || t.hasReachedDestination || !t.currentSection) return;
    const key = `${t.currentSection}_${t.direction}`;
    if (!sectionGroups[key]) sectionGroups[key] = [];
    sectionGroups[key].push(t);
  });

  Object.entries(sectionGroups).forEach(([key, group]) => {
    if (group.length < 2) return;
    // Sort by position
    const sorted = [...group].sort((a, b) =>
      a.direction === 'SOUTHBOUND' ? b.positionPct - a.positionPct : a.positionPct - b.positionPct
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      const leader = sorted[i];
      const follower = sorted[i + 1];
      const headway = calculateHeadway(follower, leader);
      if (headway.status !== 'SAFE') {
        conflicts.push({
          type: 'HEADWAY',
          sectionId: follower.currentSection,
          leaderId: leader.id,
          followerId: follower.id,
          headwaySec: headway.headwaySec,
          marginSec: headway.marginSec,
          risk: headway.status === 'CONSTRAINED' ? 'HIGH' : 'MEDIUM',
          description: `${follower.id} following ${leader.id} in ${follower.currentSection}: ${headway.headwayMinutes.toFixed(1)}min headway (need ${headway.requiredMinutes}min)`
        });
      }
    }
  });

  return conflicts;
}

/**
 * Run all conflict detections and return a unified conflict list.
 */
export function detectAllConflicts(trains, stationStates) {
  const junctionConflicts = detectJunctionConflicts(trains);
  const platformConflicts = detectPlatformConflicts(trains, stationStates);
  const sectionConflicts = detectSectionConflicts(trains);

  return [
    ...junctionConflicts,
    ...platformConflicts,
    ...sectionConflicts
  ];
}
