/**
 * RAIL//AI Network Model
 * Defines the complete 10-station railway corridor topology.
 * A ── B ── C ── D ── E ── F ── G ── H ── I ── J
 * Static definitions — mutable state is managed in sectionModel.js and stationModel.js
 */

// ─────────────────────────────────────────────────────────
// STATIONS
// ─────────────────────────────────────────────────────────
export const STATIONS = {
  STATION_A: {
    id: 'STATION_A', code: 'STA-A', name: 'Station A', shortName: 'A',
    kmPost: 0, xPct: 2, // percentage position on horizontal display
    platforms: ['P1', 'P2'],
    role: 'NORTH TERMINAL',
    platformCapacity: { P1: 400, P2: 380 }
  },
  STATION_B: {
    id: 'STATION_B', code: 'STA-B', name: 'Station B', shortName: 'B',
    kmPost: 28, xPct: 12,
    platforms: ['P1', 'P2', 'P3'],
    role: 'JUNCTION',
    platformCapacity: { P1: 340, P2: 380, P3: 280 }
  },
  STATION_C: {
    id: 'STATION_C', code: 'STA-C', name: 'Station C', shortName: 'C',
    kmPost: 54, xPct: 22,
    platforms: ['P1', 'P2'],
    role: 'INTERMEDIATE',
    platformCapacity: { P1: 360, P2: 360 }
  },
  STATION_D: {
    id: 'STATION_D', code: 'STA-D', name: 'Station D', shortName: 'D',
    kmPost: 78, xPct: 34,
    platforms: ['P1', 'P2', 'P3'],
    role: 'JUNCTION',
    platformCapacity: { P1: 400, P2: 400, P3: 300 }
  },
  STATION_E: {
    id: 'STATION_E', code: 'STA-E', name: 'Station E', shortName: 'E',
    kmPost: 102, xPct: 46,
    platforms: ['P1', 'P2'],
    role: 'INTERMEDIATE',
    platformCapacity: { P1: 350, P2: 350 }
  },
  STATION_F: {
    id: 'STATION_F', code: 'STA-F', name: 'Station F', shortName: 'F',
    kmPost: 130, xPct: 58,
    platforms: ['P1', 'P2', 'P3'],
    role: 'HUB',
    platformCapacity: { P1: 420, P2: 420, P3: 320 }
  },
  STATION_G: {
    id: 'STATION_G', code: 'STA-G', name: 'Station G', shortName: 'G',
    kmPost: 156, xPct: 68,
    platforms: ['P1', 'P2'],
    role: 'INTERMEDIATE',
    platformCapacity: { P1: 360, P2: 360 }
  },
  STATION_H: {
    id: 'STATION_H', code: 'STA-H', name: 'Station H', shortName: 'H',
    kmPost: 180, xPct: 78,
    platforms: ['P1', 'P2'],
    role: 'INTERMEDIATE',
    platformCapacity: { P1: 340, P2: 340 }
  },
  STATION_I: {
    id: 'STATION_I', code: 'STA-I', name: 'Station I', shortName: 'I',
    kmPost: 205, xPct: 88,
    platforms: ['P1', 'P2'],
    role: 'JUNCTION',
    platformCapacity: { P1: 400, P2: 400 }
  },
  STATION_J: {
    id: 'STATION_J', code: 'STA-J', name: 'Station J', shortName: 'J',
    kmPost: 232, xPct: 98,
    platforms: ['P1', 'P2'],
    role: 'SOUTH TERMINAL',
    platformCapacity: { P1: 400, P2: 380 }
  }
};

export const STATION_IDS = Object.keys(STATIONS);

// ─────────────────────────────────────────────────────────
// SECTIONS (inter-station segments)
// ─────────────────────────────────────────────────────────
export const SECTIONS = {
  SEC_A_B: {
    id: 'SEC_A_B', name: 'Section A-B',
    fromStation: 'STATION_A', toStation: 'STATION_B',
    lengthKm: 28,
    speedLimitKmH: 120,
    tracks: 2,
    junctionId: null
  },
  SEC_B_C: {
    id: 'SEC_B_C', name: 'Section B-C',
    fromStation: 'STATION_B', toStation: 'STATION_C',
    lengthKm: 26,
    speedLimitKmH: 140,
    tracks: 2,
    junctionId: 'JXN_01'
  },
  SEC_C_D: {
    id: 'SEC_C_D', name: 'Section C-D',
    fromStation: 'STATION_C', toStation: 'STATION_D',
    lengthKm: 24,
    speedLimitKmH: 140,
    tracks: 2,
    junctionId: null
  },
  SEC_D_E: {
    id: 'SEC_D_E', name: 'Section D-E',
    fromStation: 'STATION_D', toStation: 'STATION_E',
    lengthKm: 24,
    speedLimitKmH: 160,
    tracks: 2,
    junctionId: 'JXN_02'
  },
  SEC_E_F: {
    id: 'SEC_E_F', name: 'Section E-F',
    fromStation: 'STATION_E', toStation: 'STATION_F',
    lengthKm: 28,
    speedLimitKmH: 130,
    tracks: 2,
    junctionId: null
  },
  SEC_F_G: {
    id: 'SEC_F_G', name: 'Section F-G',
    fromStation: 'STATION_F', toStation: 'STATION_G',
    lengthKm: 26,
    speedLimitKmH: 120,
    tracks: 2,
    junctionId: 'JXN_03'
  },
  SEC_G_H: {
    id: 'SEC_G_H', name: 'Section G-H',
    fromStation: 'STATION_G', toStation: 'STATION_H',
    lengthKm: 24,
    speedLimitKmH: 140,
    tracks: 2,
    junctionId: null
  },
  SEC_H_I: {
    id: 'SEC_H_I', name: 'Section H-I',
    fromStation: 'STATION_H', toStation: 'STATION_I',
    lengthKm: 25,
    speedLimitKmH: 130,
    tracks: 2,
    junctionId: 'JXN_04'
  },
  SEC_I_J: {
    id: 'SEC_I_J', name: 'Section I-J',
    fromStation: 'STATION_I', toStation: 'STATION_J',
    lengthKm: 27,
    speedLimitKmH: 120,
    tracks: 2,
    junctionId: null
  }
};

export const SECTION_IDS = Object.keys(SECTIONS);

// ─────────────────────────────────────────────────────────
// JUNCTIONS
// ─────────────────────────────────────────────────────────
export const JUNCTIONS = {
  JXN_01: {
    id: 'JXN_01', name: 'Junction J-01',
    kmPost: 44,  // midpoint of SEC_B_C
    sectionId: 'SEC_B_C',
    conflictingRoutes: ['SEC_B_C', 'CROSSOVER_BC']
  },
  JXN_02: {
    id: 'JXN_02', name: 'Junction J-02',
    kmPost: 90,  // midpoint of SEC_D_E
    sectionId: 'SEC_D_E',
    conflictingRoutes: ['SEC_D_E', 'CROSSOVER_DE']
  },
  JXN_03: {
    id: 'JXN_03', name: 'Junction J-03',
    kmPost: 143, // midpoint of SEC_F_G
    sectionId: 'SEC_F_G',
    conflictingRoutes: ['SEC_F_G', 'CROSSOVER_FG']
  },
  JXN_04: {
    id: 'JXN_04', name: 'Junction J-04',
    kmPost: 193, // midpoint of SEC_H_I
    sectionId: 'SEC_H_I',
    conflictingRoutes: ['SEC_H_I', 'CROSSOVER_HI']
  }
};

// ─────────────────────────────────────────────────────────
// ORDERED STATION CHAIN (for route calculation)
// ─────────────────────────────────────────────────────────
export const STATION_CHAIN = [
  'STATION_A', 'STATION_B', 'STATION_C', 'STATION_D', 'STATION_E',
  'STATION_F', 'STATION_G', 'STATION_H', 'STATION_I', 'STATION_J'
];

// Lookup: given two adjacent stations, return the section ID
export const SECTION_BETWEEN = {
  'STATION_A_STATION_B': 'SEC_A_B',
  'STATION_B_STATION_A': 'SEC_A_B',
  'STATION_B_STATION_C': 'SEC_B_C',
  'STATION_C_STATION_B': 'SEC_B_C',
  'STATION_C_STATION_D': 'SEC_C_D',
  'STATION_D_STATION_C': 'SEC_C_D',
  'STATION_D_STATION_E': 'SEC_D_E',
  'STATION_E_STATION_D': 'SEC_D_E',
  'STATION_E_STATION_F': 'SEC_E_F',
  'STATION_F_STATION_E': 'SEC_E_F',
  'STATION_F_STATION_G': 'SEC_F_G',
  'STATION_G_STATION_F': 'SEC_F_G',
  'STATION_G_STATION_H': 'SEC_G_H',
  'STATION_H_STATION_G': 'SEC_G_H',
  'STATION_H_STATION_I': 'SEC_H_I',
  'STATION_I_STATION_H': 'SEC_H_I',
  'STATION_I_STATION_J': 'SEC_I_J',
  'STATION_J_STATION_I': 'SEC_I_J',
};

/**
 * Calculate the full route (ordered section IDs) from origin to destination
 */
export function calculateRoute(originId, destinationId) {
  const oIdx = STATION_CHAIN.indexOf(originId);
  const dIdx = STATION_CHAIN.indexOf(destinationId);
  if (oIdx === -1 || dIdx === -1) return [];
  const sections = [];
  const step = dIdx > oIdx ? 1 : -1;
  for (let i = oIdx; i !== dIdx; i += step) {
    const key = `${STATION_CHAIN[i]}_${STATION_CHAIN[i + step]}`;
    const sectionId = SECTION_BETWEEN[key];
    if (sectionId) sections.push(sectionId);
  }
  return sections;
}

/**
 * Get total route distance in km
 */
export function getRouteDistance(route) {
  return route.reduce((acc, secId) => acc + (SECTIONS[secId]?.lengthKm || 0), 0);
}

/**
 * Given a train's current section and position (0-1), calculate km post on the network
 */
export function getKmPost(sectionId, positionFraction, direction) {
  const section = SECTIONS[sectionId];
  if (!section) return 0;
  const fromStation = STATIONS[section.fromStation];
  if (!fromStation) return 0;
  if (direction === 'SOUTHBOUND') {
    return fromStation.kmPost + positionFraction * section.lengthKm;
  } else {
    const toStation = STATIONS[section.toStation];
    return toStation.kmPost - positionFraction * section.lengthKm;
  }
}
