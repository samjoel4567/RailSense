/**
 * RAIL//AI Headway Engine
 * Enforces minimum safe separation between trains on the same section.
 * MIN_HEADWAY_SEC = 288 seconds (4.8 minutes)
 */

import { SECTIONS } from './networkModel';

export const MIN_HEADWAY_SEC = 288;         // 4.8 minutes
export const CAUTION_HEADWAY_SEC = 360;     // 6.0 minutes — caution threshold
export const SAFE_HEADWAY_SEC = 480;        // 8.0 minutes — fully safe

/**
 * Calculate the headway (in seconds) between a follower and its leader.
 * Headway = time for follower to reach the current position of the leader at follower's speed.
 */
export function calculateHeadway(follower, leader) {
  if (!leader || !follower) return { headwaySec: 9999, marginSec: 9999, status: 'SAFE' };

  // Are they on the same section?
  if (follower.currentSection !== leader.currentSection) {
    // Different sections — calculate approx based on section distance
    return { headwaySec: SAFE_HEADWAY_SEC * 2, marginSec: SAFE_HEADWAY_SEC, status: 'SAFE' };
  }

  const secDef = SECTIONS[follower.currentSection];
  if (!secDef) return { headwaySec: 9999, marginSec: 9999, status: 'SAFE' };

  // Distance between them in km
  const positionDiffPct = Math.abs(leader.positionPct - follower.positionPct);
  const distBetweenKm = (positionDiffPct / 100) * secDef.lengthKm;

  const followerSpeedKmH = Math.max(1, follower.speed);
  const headwaySec = Math.round((distBetweenKm / followerSpeedKmH) * 3600);
  const marginSec = headwaySec - MIN_HEADWAY_SEC;

  let status;
  if (headwaySec < MIN_HEADWAY_SEC) {
    status = 'CONSTRAINED';
  } else if (headwaySec < CAUTION_HEADWAY_SEC) {
    status = 'CAUTION';
  } else {
    status = 'SAFE';
  }

  return {
    headwaySec,
    marginSec,
    distanceBetweenKm: parseFloat(distBetweenKm.toFixed(2)),
    status,
    requiredSec: MIN_HEADWAY_SEC,
    headwayMinutes: parseFloat((headwaySec / 60).toFixed(1)),
    requiredMinutes: parseFloat((MIN_HEADWAY_SEC / 60).toFixed(1)),
    marginMinutes: parseFloat((marginSec / 60).toFixed(1))
  };
}

/**
 * Find the immediate leader (train ahead) for a given train within the same section.
 */
export function findImmediateLeader(train, trains) {
  const sameSection = trains.filter(t =>
    t.id !== train.id &&
    t.currentSection === train.currentSection &&
    t.direction === train.direction
  );

  if (!sameSection.length) return null;

  if (train.direction === 'SOUTHBOUND') {
    const ahead = sameSection.filter(t => t.positionPct > train.positionPct);
    if (!ahead.length) return null;
    return ahead.reduce((min, t) => t.positionPct < min.positionPct ? t : min);
  } else {
    const ahead = sameSection.filter(t => t.positionPct < train.positionPct);
    if (!ahead.length) return null;
    return ahead.reduce((max, t) => t.positionPct > max.positionPct ? t : max);
  }
}

/**
 * Calculate the required speed reduction for a following train to maintain headway.
 * Returns the new target speed (km/h) for the follower.
 */
export function calculateConstrainedSpeed(follower, leader, headwayResult) {
  if (headwayResult.status === 'SAFE') return follower.targetSpeed;
  if (!leader) return follower.targetSpeed;

  // Target headway distance in km (using min headway time × leader speed)
  const targetDistKm = (MIN_HEADWAY_SEC / 3600) * Math.max(1, leader.speed);
  const currentDistKm = headwayResult.distanceBetweenKm || 0;

  if (currentDistKm >= targetDistKm) return follower.targetSpeed;

  // Follower must slow to maintain headway
  if (headwayResult.status === 'CONSTRAINED') {
    // Match leader speed or slower
    return Math.min(follower.targetSpeed, Math.max(0, leader.speed * 0.85));
  } else {
    // CAUTION — reduce gently
    return Math.min(follower.targetSpeed, leader.speed * 0.95);
  }
}

/**
 * Apply headway checks to all trains. Mutates the trains array in-place.
 * Returns a list of headway violations.
 */
export function applyHeadwayConstraints(trains) {
  const violations = [];

  trains.forEach(train => {
    if (train.isDwelling || train.hasReachedDestination) {
      train.headwayStatus = 'SAFE';
      train.headwayMarginSec = 999;
      return;
    }

    const leader = findImmediateLeader(train, trains);
    if (!leader) {
      train.headwayStatus = 'SAFE';
      train.headwayMarginSec = 999;
      train.distanceToNextTrain = null;
      return;
    }

    const headwayResult = calculateHeadway(train, leader);
    train.headwayStatus = headwayResult.status;
    train.headwayMarginSec = headwayResult.marginSec;
    train.distanceToNextTrain = headwayResult.distanceBetweenKm;
    train.headwayDetails = headwayResult;

    if (headwayResult.status === 'CONSTRAINED') {
      violations.push({
        followerId: train.id,
        leaderId: leader.id,
        headwaySec: headwayResult.headwaySec,
        marginSec: headwayResult.marginSec,
        severity: 'HIGH'
      });
      // Apply speed constraint
      const constrainedSpeed = calculateConstrainedSpeed(train, leader, headwayResult);
      if (constrainedSpeed < train.targetSpeed) {
        train.targetSpeed = constrainedSpeed;
        if (!train.affectedBy.includes(leader.id)) {
          train.affectedBy.push(leader.id);
        }
        if (!leader.affecting.includes(train.id)) {
          leader.affecting.push(train.id);
        }
      }
    } else if (headwayResult.status === 'CAUTION') {
      violations.push({
        followerId: train.id,
        leaderId: leader.id,
        headwaySec: headwayResult.headwaySec,
        marginSec: headwayResult.marginSec,
        severity: 'MEDIUM'
      });
    }
  });

  return violations;
}
