/**
 * RAIL//AI Train Model
 * Defines the initial state for all 30 trains across the A-J corridor.
 * These are INITIAL states — the engine creates mutable copies of these.
 */

import { calculateRoute } from './networkModel';

// ─────────────────────────────────────────────────────────
// TRAIN TYPE PROPERTIES
// ─────────────────────────────────────────────────────────
export const TRAIN_TYPE_CONFIG = {
  EXPRESS: {
    maxSpeed: 160,
    normalSpeed: 140,
    accelRate: 5,     // km/h per sim-second
    decelRate: 8,
    priority: 1,
    defaultDwellSec: 120
  },
  INTERCITY: {
    maxSpeed: 140,
    normalSpeed: 120,
    accelRate: 4,
    decelRate: 7,
    priority: 2,
    defaultDwellSec: 180
  },
  REGIONAL: {
    maxSpeed: 120,
    normalSpeed: 100,
    accelRate: 3,
    decelRate: 6,
    priority: 3,
    defaultDwellSec: 240
  },
  COMMUTER: {
    maxSpeed: 110,
    normalSpeed: 90,
    accelRate: 3,
    decelRate: 6,
    priority: 3,
    defaultDwellSec: 120
  },
  LOCAL: {
    maxSpeed: 100,
    normalSpeed: 80,
    accelRate: 2.5,
    decelRate: 5,
    priority: 4,
    defaultDwellSec: 300
  }
};

// ─────────────────────────────────────────────────────────
// INITIAL 30-TRAIN DEFINITIONS
// positionPct: 0=at fromStation, 100=at toStation
// direction: SOUTHBOUND (A→J), NORTHBOUND (J→A)
// ─────────────────────────────────────────────────────────
function makeTrain(id, type, origin, destination, currentSection, positionPct, speed, direction, platform, status, delayMin = 0) {
  const config = TRAIN_TYPE_CONFIG[type];
  const route = calculateRoute(origin, destination);
  return {
    id,
    type,
    origin,
    destination,
    currentStation: null,      // null if in transit
    currentSection,
    direction,
    positionPct: Math.max(0, Math.min(100, positionPct)),
    speed,
    targetSpeed: speed,
    maxSpeed: config.maxSpeed,
    normalSpeed: config.normalSpeed,
    accelRate: config.accelRate,
    decelRate: config.decelRate,
    priority: config.priority,
    eta: null,                 // calculated by etaEngine
    etaAbsolute: null,         // HH:MM string
    delay: delayMin,           // minutes
    dwellTime: 0,              // seconds currently dwelling
    dwellTarget: 0,            // seconds to dwell
    status,
    route,
    platform,
    affectedBy: [],            // train IDs that are causing constraint on this train
    affecting: [],             // train IDs this train is constraining
    headwayStatus: 'SAFE',
    headwayMarginSec: 999,
    distanceToNextTrain: null,
    distanceToNextStation: null,
    speedRestriction: null,    // temporary speed restriction (TSR)
    isDwelling: false,
    hasReachedDestination: false
  };
}

export function buildInitialTrains() {
  return [
    // ── EXPRESS (5 trains) ──────────────────────────────────
    makeTrain('EXPRESS_201', 'EXPRESS', 'STATION_A', 'STATION_J',
      'SEC_B_C', 65, 138, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('EXPRESS_202', 'EXPRESS', 'STATION_J', 'STATION_A',
      'SEC_H_I', 30, 140, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('EXPRESS_203', 'EXPRESS', 'STATION_A', 'STATION_J',
      'SEC_E_F', 50, 135, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('EXPRESS_204', 'EXPRESS', 'STATION_J', 'STATION_A',
      'SEC_D_E', 75, 142, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('EXPRESS_205', 'EXPRESS', 'STATION_A', 'STATION_J',
      'STATION_F', 0, 0, 'SOUTHBOUND', 'P1', 'STATION DWELL', 0),

    // ── INTERCITY (5 trains) ────────────────────────────────
    makeTrain('INTERCITY_301', 'INTERCITY', 'STATION_B', 'STATION_I',
      'SEC_C_D', 40, 115, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('INTERCITY_302', 'INTERCITY', 'STATION_I', 'STATION_B',
      'SEC_G_H', 60, 118, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('INTERCITY_303', 'INTERCITY', 'STATION_B', 'STATION_J',
      'SEC_F_G', 20, 112, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('INTERCITY_304', 'INTERCITY', 'STATION_A', 'STATION_H',
      'STATION_D', 0, 0, 'SOUTHBOUND', 'P2', 'STATION DWELL', 0),

    makeTrain('INTERCITY_305', 'INTERCITY', 'STATION_H', 'STATION_A',
      'SEC_E_F', 80, 120, 'NORTHBOUND', null, 'IN TRANSIT'),

    // ── REGIONAL (6 trains) ─────────────────────────────────
    makeTrain('REGIONAL_401', 'REGIONAL', 'STATION_A', 'STATION_F',
      'SEC_D_E', 30, 98, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('REGIONAL_402', 'REGIONAL', 'STATION_F', 'STATION_A',
      'SEC_B_C', 80, 95, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('REGIONAL_403', 'REGIONAL', 'STATION_C', 'STATION_J',
      'SEC_E_F', 10, 100, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('REGIONAL_404', 'REGIONAL', 'STATION_J', 'STATION_C',
      'SEC_H_I', 70, 96, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('REGIONAL_405', 'REGIONAL', 'STATION_B', 'STATION_G',
      'STATION_E', 0, 0, 'SOUTHBOUND', 'P1', 'STATION DWELL', 0),

    makeTrain('REGIONAL_406', 'REGIONAL', 'STATION_G', 'STATION_B',
      'SEC_F_G', 55, 102, 'NORTHBOUND', null, 'IN TRANSIT'),

    // ── LOCAL (10 trains) ───────────────────────────────────
    makeTrain('LOCAL_101', 'LOCAL', 'STATION_B', 'STATION_C',
      'STATION_B', 0, 0, 'SOUTHBOUND', 'P1', 'STATION DWELL', 8),

    makeTrain('LOCAL_102', 'LOCAL', 'STATION_C', 'STATION_B',
      'SEC_B_C', 45, 75, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('LOCAL_103', 'LOCAL', 'STATION_D', 'STATION_E',
      'STATION_D', 0, 0, 'SOUTHBOUND', 'P1', 'STATION DWELL', 0),

    makeTrain('LOCAL_104', 'LOCAL', 'STATION_E', 'STATION_F',
      'SEC_E_F', 60, 78, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('LOCAL_105', 'LOCAL', 'STATION_F', 'STATION_G',
      'STATION_F', 0, 0, 'SOUTHBOUND', 'P2', 'STATION DWELL', 0),

    makeTrain('LOCAL_106', 'LOCAL', 'STATION_G', 'STATION_H',
      'SEC_G_H', 35, 82, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('LOCAL_107', 'LOCAL', 'STATION_H', 'STATION_I',
      'SEC_H_I', 50, 80, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('LOCAL_108', 'LOCAL', 'STATION_I', 'STATION_J',
      'SEC_I_J', 25, 76, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('LOCAL_109', 'LOCAL', 'STATION_J', 'STATION_I',
      'STATION_J', 0, 0, 'NORTHBOUND', 'P1', 'STATION DWELL', 0),

    makeTrain('LOCAL_110', 'LOCAL', 'STATION_C', 'STATION_D',
      'SEC_C_D', 70, 79, 'SOUTHBOUND', null, 'IN TRANSIT'),

    // ── COMMUTER (4 trains — fill remaining slots) ──────────
    makeTrain('COMMUTER_501', 'COMMUTER', 'STATION_A', 'STATION_C',
      'SEC_A_B', 50, 88, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('COMMUTER_502', 'COMMUTER', 'STATION_C', 'STATION_A',
      'SEC_A_B', 30, 90, 'NORTHBOUND', null, 'IN TRANSIT'),

    makeTrain('COMMUTER_503', 'COMMUTER', 'STATION_G', 'STATION_J',
      'SEC_G_H', 65, 87, 'SOUTHBOUND', null, 'IN TRANSIT'),

    makeTrain('COMMUTER_504', 'COMMUTER', 'STATION_J', 'STATION_G',
      'SEC_I_J', 55, 91, 'NORTHBOUND', null, 'IN TRANSIT'),
  ];
}

export function cloneTrains(trains) {
  return trains.map(t => ({
    ...t,
    affectedBy: [...(t.affectedBy || [])],
    affecting: [...(t.affecting || [])],
    route: [...(t.route || [])]
  }));
}
