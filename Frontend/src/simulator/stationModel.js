/**
 * RAIL//AI Station Model
 * Manages platform state, occupancy, reservations and dwell at each of the 10 stations.
 */

import { STATIONS, SECTIONS } from './networkModel';

/**
 * Build initial station states for all 10 stations.
 * Each platform starts CLEAR or gets assigned based on initial train positions.
 */
export function buildInitialStationStates(trains) {
  const states = {};

  Object.values(STATIONS).forEach(station => {
    const platforms = {};
    station.platforms.forEach(platId => {
      platforms[platId] = {
        id: platId,
        stationId: station.id,
        state: 'CLEAR',
        trainId: null,
        reservedForTrainId: null,
        dwellStarted: null,
        signalAspect: 'GREEN',
        lengthMeters: station.platformCapacity[platId] || 340
      };
    });

    states[station.id] = {
      id: station.id,
      name: station.name,
      code: station.code,
      role: station.role,
      platforms,
      riskLevel: 'NORMAL',
      activeConflicts: 0
    };
  });

  // Assign trains currently at stations
  trains.forEach(train => {
    if (train.isDwelling && train.currentStation && train.platform) {
      const stState = states[train.currentStation];
      if (stState && stState.platforms[train.platform]) {
        stState.platforms[train.platform].state = 'OCCUPIED';
        stState.platforms[train.platform].trainId = train.id;
      }
    }
  });

  return states;
}

/**
 * Update station states based on current train positions.
 * Called every tick.
 */
export function updateStationStates(stationStates, trains) {
  const updated = JSON.parse(JSON.stringify(stationStates));

  // Clear all dynamic state first
  Object.values(updated).forEach(station => {
    Object.values(station.platforms).forEach(plat => {
      if (plat.state === 'OCCUPIED' || plat.state === 'ARRIVING') {
        plat.state = 'CLEAR';
        plat.trainId = null;
      }
      // Keep RESERVED state only if the train that reserved it is still approaching
    });
  });

  // Re-assign based on current train positions
  trains.forEach(train => {
    // Train dwelling at station
    if (train.isDwelling && train.currentStation && train.platform) {
      const station = updated[train.currentStation];
      if (station && station.platforms[train.platform]) {
        station.platforms[train.platform].state = 'OCCUPIED';
        station.platforms[train.platform].trainId = train.id;
        station.platforms[train.platform].signalAspect = 'RED';
      }
    }

    // Train approaching destination (>80% of current section, destination = next station)
    if (!train.isDwelling && train.positionPct > 80 && train.destination) {
      const station = updated[train.destination];
      if (station) {
        // Find a free platform to reserve
        const freePlat = Object.values(station.platforms).find(p => p.state === 'CLEAR' && !p.reservedForTrainId);
        if (freePlat && !train.platform) {
          freePlat.state = 'ARRIVING';
          freePlat.reservedForTrainId = train.id;
          freePlat.signalAspect = 'AMBER';
        }
      }
    }
  });

  // Calculate station risk
  Object.values(updated).forEach(station => {
    const occupied = Object.values(station.platforms).filter(p => p.state === 'OCCUPIED').length;
    const total = Object.values(station.platforms).length;
    station.utilizationPct = Math.round((occupied / total) * 100);
    station.riskLevel = occupied >= total ? 'HIGH' : occupied > 0 ? 'NORMAL' : 'CLEAR';
  });

  return updated;
}

/**
 * Find the best available platform for an arriving train at a station.
 */
export function findAvailablePlatform(stationId, stationStates, train) {
  const station = stationStates[stationId];
  if (!station) return null;

  // Prefer platform that matches train type priority
  const freePlats = Object.entries(station.platforms)
    .filter(([, plat]) => plat.state === 'CLEAR' && !plat.reservedForTrainId)
    .map(([id]) => id);

  if (freePlats.length === 0) return null;
  return freePlats[0];
}

/**
 * Get a formatted platform status summary for a station.
 */
export function getStationPlatformSummary(stationId, stationStates, trains) {
  const station = stationStates[stationId];
  if (!station) return [];

  return Object.entries(station.platforms).map(([platId, plat]) => {
    const occupyingTrain = trains.find(t => t.id === plat.trainId);
    const reservedTrain = trains.find(t => t.id === plat.reservedForTrainId);
    return {
      id: platId,
      stationId,
      state: plat.state,
      trainId: plat.trainId || plat.reservedForTrainId || null,
      trainType: occupyingTrain?.type || reservedTrain?.type || null,
      dwellSec: occupyingTrain?.dwellTime || 0,
      signalAspect: plat.signalAspect || 'GREEN',
      statusNote: plat.state === 'OCCUPIED'
        ? `${plat.trainId} DWELLING`
        : plat.state === 'ARRIVING'
          ? `${plat.reservedForTrainId} APPROACHING`
          : 'CLEAR — STANDBY'
    };
  });
}
