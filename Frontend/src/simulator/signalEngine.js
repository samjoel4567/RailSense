/**
 * RAIL//AI Signal Engine
 * Deterministic signal state computation for all sections and stations.
 * Signal states are derived from: occupancy, headway, route locking, hazards, platform availability.
 *
 * States: GREEN | AMBER | RED | RESTRICTED
 */

import { SECTIONS, STATIONS } from './networkModel';
import { MIN_HEADWAY_SEC, CAUTION_HEADWAY_SEC, calculateHeadway, findImmediateLeader } from './headwayEngine';

export const SIGNAL_GREEN      = 'GREEN';
export const SIGNAL_AMBER      = 'AMBER';
export const SIGNAL_RED        = 'RED';
export const SIGNAL_RESTRICTED = 'RESTRICTED';

/**
 * Compute signal states for all sections and station entry signals.
 *
 * @param {Array} trains - current train array
 * @param {Object} sectionStates - current section states
 * @param {Object} stationStates - current station states
 * @param {boolean} hazardActive - global hazard flag
 * @param {string|null} hazardSectionId - section where hazard is active
 * @param {Array} [activeIntrusions=[]] - active intrusion events from intrusionEngine
 * @returns {Object} signalMap: { [sectionId]: { entry, exit, speedLimit }, [stationId]: { platform } }
 */
export function computeSignals(trains, sectionStates, stationStates, hazardActive = false, hazardSectionId = null, activeIntrusions = []) {
  const signalMap = {};
  const intrusionSections = new Set((activeIntrusions || []).map(i => i.sectionId));

  // ── Process each section ──────────────────────────────
  Object.values(SECTIONS).forEach(sec => {
    const secState = sectionStates?.[sec.id] || {};
    const trainsInSection = trains.filter(t => t.currentSection === sec.id && !t.isDwelling);
    const count = trainsInSection.length;

    let entryAspect = SIGNAL_GREEN;
    let exitAspect  = SIGNAL_GREEN;
    let speedLimit  = sec.speedLimitKmH;
    let statusText  = 'PROCEED';
    let reason      = '';

    const sectionIntrusion = (activeIntrusions || []).find(i => i.sectionId === sec.id);

    // Rule 0: Active Intrusion in this section → RED / STOP
    if (sectionIntrusion) {
      entryAspect = SIGNAL_RED;
      exitAspect  = SIGNAL_RED;
      speedLimit  = 0;
      statusText  = 'STOP — INTRUSION HAZARD';
      reason      = `${sectionIntrusion.type.replace(/_/g, ' ')} detected at KM ${sectionIntrusion.locationKm} (${sectionIntrusion.track})`;
    }
    // Rule 1: Hazard in this section → RESTRICTED
    else if (hazardActive && (hazardSectionId === sec.id || hazardSectionId === null)) {
      entryAspect = SIGNAL_RESTRICTED;
      exitAspect  = SIGNAL_RESTRICTED;
      speedLimit  = 40;
      statusText  = 'RESTRICTED — HAZARD';
      reason      = 'AI Vision safety event active';
    }

    // Rule 2: Section at capacity (3+ trains same direction) → RED
    else if (count >= 3) {
      entryAspect = SIGNAL_RED;
      statusText  = 'STOP — SECTION FULL';
      reason      = `${count} trains in section`;
    }
    // Rule 3: Check headway for any following train
    else {
      let worstHeadway = { status: 'SAFE', headwaySec: 9999 };

      trainsInSection.forEach(train => {
        const leader = findImmediateLeader(train, trains);
        if (leader && leader.currentSection === train.currentSection) {
          const hw = calculateHeadway(train, leader);
          if (hw.headwaySec < worstHeadway.headwaySec) {
            worstHeadway = hw;
          }
        }
      });

      if (worstHeadway.status === 'CONSTRAINED') {
        entryAspect = SIGNAL_RED;
        statusText  = 'STOP — HEADWAY VIOLATION';
        reason      = `Headway ${worstHeadway.headwayMinutes?.toFixed(1)} min (min ${(MIN_HEADWAY_SEC/60).toFixed(1)} min)`;
      } else if (worstHeadway.status === 'CAUTION' || count >= 2) {
        entryAspect = SIGNAL_AMBER;
        statusText  = 'CAUTION';
        reason      = count >= 2 ? 'Multiple trains in section' : 'Headway caution zone';
      }
    }

    // Rule 4: Platform at destination station occupied → exit signal AMBER
    const toStation = stationStates?.[sec.toStation];
    if (toStation) {
      const allPlatformsOccupied = Object.values(toStation.platforms || {}).every(p => p.state !== 'CLEAR');
      if (allPlatformsOccupied && Object.keys(toStation.platforms || {}).length > 0) {
        if (exitAspect === SIGNAL_GREEN) {
          exitAspect = SIGNAL_AMBER;
        }
      }
    }

    signalMap[sec.id] = {
      entry: { aspect: entryAspect, statusText, reason },
      exit:  { aspect: exitAspect, statusText: exitAspect === SIGNAL_AMBER ? 'CAUTION — PLATFORM' : 'CLEAR' },
      speedLimit,
      sectionId: sec.id
    };
  });

  // ── Process each station ──────────────────────────────
  Object.values(STATIONS).forEach(st => {
    const stState = stationStates?.[st.id] || { platforms: {} };
    const platformSignals = {};

    (st.platforms || []).forEach(platId => {
      const platState = stState.platforms?.[platId];
      if (!platState) {
        platformSignals[platId] = SIGNAL_GREEN;
        return;
      }
      if (platState.state === 'OCCUPIED') {
        platformSignals[platId] = SIGNAL_RED;
      } else if (platState.state === 'ARRIVING' || platState.state === 'RESERVED') {
        platformSignals[platId] = SIGNAL_AMBER;
      } else {
        platformSignals[platId] = SIGNAL_GREEN;
      }
    });

    signalMap[st.id] = { platformSignals, stationId: st.id };
  });

  return signalMap;
}

/**
 * Get the effective speed limit for a train given its current section's signals.
 */
export function getEffectiveSpeedLimit(train, signalMap) {
  if (!train.currentSection || !signalMap) return train.maxSpeed || 160;
  const sectionSig = signalMap[train.currentSection];
  if (!sectionSig) return train.maxSpeed || 160;

  if (sectionSig.entry?.aspect === SIGNAL_RESTRICTED) return 40;
  if (sectionSig.entry?.aspect === SIGNAL_RED) return 0;
  if (sectionSig.entry?.aspect === SIGNAL_AMBER) return Math.min(sectionSig.speedLimit || 80, 80);
  return sectionSig.speedLimit || train.maxSpeed || 160;
}

/**
 * Get a color for rendering a signal aspect.
 */
export function signalAspectColor(aspect) {
  switch (aspect) {
    case SIGNAL_GREEN:      return '#10b981';
    case SIGNAL_AMBER:      return '#f59e0b';
    case SIGNAL_RED:        return '#ef4444';
    case SIGNAL_RESTRICTED: return '#8b5cf6';
    default:                return '#64748b';
  }
}
