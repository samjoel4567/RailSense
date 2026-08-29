/**
 * RAIL//AI Section Model
 * Manages section occupancy, headway, signals and traffic for each inter-station section.
 */

import { SECTIONS } from './networkModel';

/**
 * Build initial section states from train positions.
 */
export function buildInitialSectionStates(trains) {
  const states = {};

  Object.values(SECTIONS).forEach(section => {
    states[section.id] = {
      id: section.id,
      name: section.name,
      fromStation: section.fromStation,
      toStation: section.toStation,
      lengthKm: section.lengthKm,
      speedLimitKmH: section.speedLimitKmH,
      trainsSouthbound: [],
      trainsNorthbound: [],
      trainCount: 0,
      occupancyStatus: 'CLEAR',
      signals: {
        entry: { id: `SIG-${section.id}-ENTRY`, aspect: 'GREEN', statusText: 'PROCEED' },
        exit: { id: `SIG-${section.id}-EXIT`, aspect: 'GREEN', statusText: 'PROCEED' }
      },
      headwayViolations: 0,
      maxSpeedRestriction: null
    };
  });

  // Populate with initial trains
  trains.forEach(train => {
    if (train.currentSection && states[train.currentSection] && !train.isDwelling) {
      const sec = states[train.currentSection];
      if (train.direction === 'SOUTHBOUND') {
        sec.trainsSouthbound.push(train.id);
      } else {
        sec.trainsNorthbound.push(train.id);
      }
      sec.trainCount++;
    }
  });

  Object.values(states).forEach(sec => {
    sec.occupancyStatus = sec.trainCount > 0
      ? `OCCUPIED (${sec.trainCount} train${sec.trainCount > 1 ? 's' : ''})`
      : 'CLEAR';
  });

  return states;
}

/**
 * Update section states from current train positions. Called every tick.
 */
export function updateSectionStates(sectionStates, trains, headwayViolations) {
  const updated = {};

  Object.entries(sectionStates).forEach(([secId, sec]) => {
    updated[secId] = {
      ...sec,
      trainsSouthbound: [],
      trainsNorthbound: [],
      trainCount: 0,
      headwayViolations: 0
    };
  });

  trains.forEach(train => {
    if (train.currentSection && updated[train.currentSection] && !train.isDwelling) {
      const sec = updated[train.currentSection];
      if (train.direction === 'SOUTHBOUND') {
        sec.trainsSouthbound.push(train.id);
      } else {
        sec.trainsNorthbound.push(train.id);
      }
      sec.trainCount++;
    }
  });

  // Apply headway violations
  (headwayViolations || []).forEach(v => {
    const follower = trains.find(t => t.id === v.followerId);
    if (follower?.currentSection && updated[follower.currentSection]) {
      updated[follower.currentSection].headwayViolations++;
    }
  });

  // Update occupancy and signals
  Object.values(updated).forEach(sec => {
    const total = sec.trainCount;
    sec.occupancyStatus = total === 0 ? 'CLEAR' : `OCCUPIED (${total} train${total > 1 ? 's' : ''})`;

    // Set entry signal based on occupancy
    if (total >= 3) {
      sec.signals.entry.aspect = 'RED';
      sec.signals.entry.statusText = 'STOP / CAPACITY';
    } else if (total >= 2 || sec.headwayViolations > 0) {
      sec.signals.entry.aspect = 'AMBER';
      sec.signals.entry.statusText = 'CAUTION';
    } else {
      sec.signals.entry.aspect = 'GREEN';
      sec.signals.entry.statusText = 'PROCEED';
    }
  });

  return updated;
}

/**
 * Get formatted section summary for the UI.
 */
export function getSectionSummaries(sectionStates, trains) {
  return Object.values(sectionStates).map(sec => {
    const trainsInSection = trains.filter(t => t.currentSection === sec.id && !t.isDwelling);
    return {
      id: sec.id,
      name: sec.name,
      fromStation: sec.fromStation,
      toStation: sec.toStation,
      lengthKm: sec.lengthKm,
      speedLimitKmH: sec.speedLimitKmH,
      trainCount: sec.trainCount,
      trainsInSection: trainsInSection.map(t => t.id),
      occupancyStatus: sec.occupancyStatus,
      entrySignal: sec.signals.entry,
      exitSignal: sec.signals.exit,
      headwayViolations: sec.headwayViolations
    };
  });
}
