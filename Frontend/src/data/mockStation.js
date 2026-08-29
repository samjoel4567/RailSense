/**
 * Mock Station & Lifecycle Dataset for Station Master Page
 * Modelled around the operational railway lifecycle:
 * STATION B (Origin) → SECTION B (Corridor) → STATION C (Destination)
 */

export const mockStationData = {
  stationB: {
    id: 'STATION_B',
    name: 'Station B',
    role: 'ORIGIN / CENTRAL JUNCTION',
    code: 'STA-B',
    platforms: [
      {
        id: 'STA_B_P1',
        stationId: 'STATION_B',
        stationName: 'Station B',
        number: '1',
        name: 'Platform 1',
        assignedTrack: 'Track 1 (Main Down)',
        lengthMeters: 340,
        state: 'OCCUPIED', // 'CLEAR' | 'RESERVED' | 'OCCUPIED' | 'DEPARTING'
        trainId: 'LOCAL_101',
        trainType: 'LOCAL',
        destination: 'Station C',
        dwellMinutes: 8,
        statusNote: 'BOARDING // DWELL VARIANCE (+8m)',
        signalId: 'SIG-B1',
        signalAspect: 'AMBER'
      },
      {
        id: 'STA_B_P2',
        stationId: 'STATION_B',
        stationName: 'Station B',
        number: '2',
        name: 'Platform 2',
        assignedTrack: 'Track 2 (Main Up)',
        lengthMeters: 380,
        state: 'DEPARTING',
        trainId: 'EXPRESS_201',
        trainType: 'EXPRESS',
        destination: 'Station C',
        dwellMinutes: 0,
        statusNote: 'CLEARED DEPARTURE → ENTERING SECTION B',
        signalId: 'SIG-B2',
        signalAspect: 'GREEN'
      },
      {
        id: 'STA_B_P3',
        stationId: 'STATION_B',
        stationName: 'Station B',
        number: '3',
        name: 'Platform 3',
        assignedTrack: 'Track 3 (Loop)',
        lengthMeters: 280,
        state: 'CLEAR',
        trainId: null,
        trainType: null,
        destination: null,
        dwellMinutes: 0,
        statusNote: 'STANDBY // TRACK CLEAR',
        signalId: 'SIG-B3',
        signalAspect: 'RED'
      }
    ]
  },

  sectionB: {
    id: 'SECTION_B',
    name: 'Section B (Central-South Corridor)',
    lengthKm: 24.8,
    maxSpeedKmH: 140,
    occupancyStatus: 'OCCUPIED (2 ACTIVE MOVEMENTS)',
    tracks: [
      {
        id: 'TRACK_1',
        name: 'Track 1 (Southbound ↓)',
        direction: 'SOUTHBOUND',
        directionArrow: '↓',
        activeTrain: {
          id: 'EXPRESS_201',
          name: 'Intercity Express 201',
          type: 'EXPRESS',
          speed: 118,
          progressPct: 65, // 65% through Section B
          etaToDestination: '8 MIN',
          destinationStation: 'Station C',
          destinationPlatform: 'Platform 1',
          status: 'TRAVELLING IN SECTION B',
          statusCategory: 'normal'
        },
        signal: {
          id: 'SIG-B-ENTRY',
          aspect: 'GREEN',
          statusText: 'PROCEED'
        }
      },
      {
        id: 'TRACK_2',
        name: 'Track 2 (Northbound ↑)',
        direction: 'NORTHBOUND',
        directionArrow: '↑',
        activeTrain: {
          id: 'LOCAL_102',
          name: 'Regional Commuter 102',
          type: 'LOCAL',
          speed: 76,
          progressPct: 35, // 35% through Section B towards B
          etaToDestination: '12 MIN',
          destinationStation: 'Station B',
          destinationPlatform: 'Platform 2',
          status: 'APPROACHING STATION B',
          statusCategory: 'caution'
        },
        signal: {
          id: 'SIG-C-ENTRY',
          aspect: 'GREEN',
          statusText: 'PROCEED'
        }
      }
    ]
  },

  stationC: {
    id: 'STATION_C',
    name: 'Station C',
    role: 'DESTINATION / SOUTH HUB',
    code: 'STA-C',
    platforms: [
      {
        id: 'STA_C_P1',
        stationId: 'STATION_C',
        stationName: 'Station C',
        number: '1',
        name: 'Platform 1',
        assignedTrack: 'Track 1 (Main Down)',
        lengthMeters: 360,
        state: 'RESERVED',
        reservedForTrainId: 'EXPRESS_201',
        trainType: 'EXPRESS',
        origin: 'Station B',
        statusNote: 'RESERVED FOR INBOUND EXPRESS_201 (ETA: 8 MIN)',
        signalId: 'SIG-C1',
        signalAspect: 'GREEN'
      },
      {
        id: 'STA_C_P2',
        stationId: 'STATION_C',
        stationName: 'Station C',
        number: '2',
        name: 'Platform 2',
        assignedTrack: 'Track 2 (Main Up)',
        lengthMeters: 360,
        state: 'OCCUPIED',
        trainId: 'EXPRESS_202',
        trainType: 'EXPRESS',
        destination: 'Station B',
        dwellMinutes: 0,
        statusNote: 'BOARDING // SCHEDULED DEPARTURE 14:47',
        signalId: 'SIG-C2',
        signalAspect: 'GREEN'
      },
      {
        id: 'STA_C_P3',
        stationId: 'STATION_C',
        stationName: 'Station C',
        number: '3',
        name: 'Platform 3',
        assignedTrack: 'Track 3 (Loop)',
        lengthMeters: 260,
        state: 'CLEAR',
        trainId: null,
        trainType: null,
        destination: null,
        dwellMinutes: 0,
        statusNote: 'STANDBY // TRACK CLEAR',
        signalId: 'SIG-C3',
        signalAspect: 'RED'
      }
    ]
  },

  lifecycleSummary: {
    originStation: 'Station B (Central Junction)',
    corridorSection: 'Section B (24.8 KM)',
    destinationStation: 'Station C (South Hub)',
    activeMovements: 4,
    trainsAtStationB: 1, // LOCAL_101
    trainsInSectionB: 2, // EXPRESS_201, LOCAL_102
    trainsAtStationC: 1, // EXPRESS_202
    stationRiskScore: 18,
    riskCategory: 'NORMAL'
  },

  arrivalsDepartures: [
    {
      trainId: 'LOCAL_101',
      origin: 'Station B',
      destination: 'Station C',
      platform: 'Platform 1 (B)',
      assignedPlatformId: 'STA_B_P1',
      direction: 'Southbound',
      directionArrow: '↓',
      eta: '14:32',
      delay: '+8 min',
      delayMinutes: 8,
      status: 'DELAYED',
      statusCategory: 'warning',
      lifecycleStage: 'DWELLING AT STATION B'
    },
    {
      trainId: 'EXPRESS_201',
      origin: 'Station B',
      destination: 'Station C',
      platform: 'P2 (B) → P1 (C)',
      assignedPlatformId: 'STA_C_P1',
      direction: 'Southbound',
      directionArrow: '↓',
      eta: '14:28',
      delay: '0 min',
      delayMinutes: 0,
      status: 'IN SECTION B',
      statusCategory: 'normal',
      lifecycleStage: 'TRAVELLING IN SECTION B (118 km/h)'
    },
    {
      trainId: 'LOCAL_102',
      origin: 'Station C',
      destination: 'Station B',
      platform: 'Platform 2 (B)',
      assignedPlatformId: 'STA_B_P2',
      direction: 'Northbound',
      directionArrow: '↑',
      eta: '14:41',
      delay: '+2 min',
      delayMinutes: 2,
      status: 'APPROACHING',
      statusCategory: 'caution',
      lifecycleStage: 'APPROACHING STATION B (76 km/h)'
    },
    {
      trainId: 'EXPRESS_202',
      origin: 'Station C',
      destination: 'Station B',
      platform: 'Platform 1 (B)',
      assignedPlatformId: 'STA_C_P2',
      direction: 'Northbound',
      directionArrow: '↑',
      eta: '14:47',
      delay: '0 min',
      delayMinutes: 0,
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'BOARDING AT STATION C'
    }
  ],

  alerts: [
    {
      id: 'STA-ALT-01',
      severity: 'WARNING',
      severityLevel: 'warning',
      title: 'Station B Platform 1 Dwell Exceeded (+8 min)',
      location: 'Station B / Platform 1',
      trainId: 'LOCAL_101',
      timestamp: '14:27:30',
      description: 'LOCAL_101 delayed on Platform 1. Passenger crowding on door set 3 holding Section B dispatch slot.',
      recommendation: 'Station Master advisory: Initiate immediate door lock to clear Section B departure.'
    },
    {
      id: 'STA-ALT-02',
      severity: 'PREDICTION',
      severityLevel: 'prediction',
      title: 'Section B Junction J-02 Convergence Alert',
      location: 'Section B South Throat',
      trainId: 'EXPRESS_201 / LOCAL_101',
      timestamp: '14:27:04',
      description: '87% probability of route crossing conflict if LOCAL_101 departs Section B after 14:31.',
      recommendation: 'Priority given to EXPRESS_201 in Section B. Platform 1 at Station C pre-reserved.'
    },
    {
      id: 'STA-ALT-03',
      severity: 'NORMAL',
      severityLevel: 'normal',
      title: 'Station C Platform 1 Interlocking Route Secured',
      location: 'Station C / Platform 1 Approach',
      trainId: 'EXPRESS_201',
      timestamp: '14:28:00',
      description: 'End of Authority (EOA) at Station C Platform 1 verified. Signal SIG-C1 illuminated GREEN.',
      recommendation: 'Nominal high-speed approach permitted.'
    }
  ]
};
