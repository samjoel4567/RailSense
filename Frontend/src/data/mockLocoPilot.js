/**
 * Mock Data for Loco Pilot Cab Dashboard (Train EXPRESS_201)
 * Models Driver Machine Interface (DMI), ETCS Level 2 Cab Telemetry,
 * Linear Route Profile, and Safety Systems for Section B (Station B -> Station C).
 */

export const mockLocoPilotData = {
  trainId: 'EXPRESS_201',
  trainName: 'Intercity Superfast Express',
  serviceType: 'PASSENGER_EXPRESS',
  locoModel: 'WAP-7 / 3-Phase AC Electric',
  cabId: 'CAB-1 (LEADING)',
  driverName: 'Capt. R. Sharma (LP-884)',

  route: {
    origin: 'Station B (Central Junction)',
    originCode: 'STA-B',
    currentSection: 'Section B (Central-South Corridor)',
    currentSectionLengthKm: 24.8,
    destination: 'Station C (South Hub)',
    destinationCode: 'STA-C',
    destinationPlatform: 'Platform 1',
    direction: 'SOUTHBOUND',
    directionArrow: '➔',
    progressPct: 65,
    distanceTraversedKm: 16.1,
    distanceRemainingKm: 8.7,
    etaToDestination: '8 MIN',
    arrivalTimeScheduled: '14:36'
  },

  telemetry: {
    currentSpeed: 118,
    speedUnit: 'KM/H',
    permittedSpeedLimit: 140,
    targetSpeed: 40, // Target speed at Station C approach
    targetDistanceMeters: 8700,
    throttlePositionPct: 72,
    brakePipePressureBar: 5.0,
    mainReservoirBar: 9.8,
    lineVoltageKV: 25.2,
    tractionCurrentAmps: 420,
    catenaryStatus: 'NOMINAL 25.2 kV'
  },

  signaling: {
    currentAspect: 'GREEN',
    aspectLabel: 'PROCEED',
    nextSignalId: 'SIG-C1',
    nextSignalLocation: 'Station C North Approach (KM 23.4)',
    distanceToNextSignalMeters: 7300,
    movementAuthorityMeters: 9200,
    etcsLevel: 'ETCS LEVEL 2',
    mode: 'FULL SUPERVISION (FS)',
    radioBlockCenter: 'RBC-SOUTH-02 (ACTIVE)'
  },

  safety: {
    overallStatus: 'NORMAL',
    safetyCategory: 'SIL-4 COMPLIANT',
    vigilanceDsdStatus: 'ACTIVE (RESET IN 24s)',
    emergencyBrakeStatus: 'STANDBY (NOMINAL)',
    wheelSlipProtection: 'ACTIVE (0% SLIP)',
    trackCircuitOccupancy: 'NOMINAL CLEARANCE'
  },

  trackWaypoints: [
    { km: 0.0, name: 'STATION B [P2]', type: 'STATION_ORIGIN', passed: true, note: 'Departed 14:20' },
    { km: 3.2, name: 'SWITCH SW-B1', type: 'INTERLOCKING', passed: true, note: 'Normal locked' },
    { km: 11.5, name: 'JUNCTION J-02', type: 'JUNCTION', passed: true, note: 'Cleared 14:26' },
    { km: 16.1, name: 'CURRENT POSITION (EXPRESS_201)', type: 'TRAIN_CURSOR', isCurrent: true, note: 'Speed 118 km/h' },
    { km: 21.4, name: 'BRAKING CURVE (DECEL TO 40)', type: 'DECEL_POINT', passed: false, note: 'Target in 5.3 km' },
    { km: 23.4, name: 'SIGNAL SIG-C1', type: 'SIGNAL', passed: false, note: 'Aspect GREEN' },
    { km: 24.8, name: 'STATION C [P1]', type: 'STATION_DESTINATION', passed: false, note: 'Berth Reserved' }
  ],

  alerts: [
    {
      id: 'CAB-ALT-01',
      severity: 'NORMAL',
      severityLevel: 'normal',
      title: 'Signal SIG-C1 Illuminated GREEN',
      location: 'Section B / Approach KM 23.4',
      timestamp: '14:28:00',
      description: 'Clear route locked to Station C Platform 1. Full supervision movement authority granted up to buffer stops.'
    },
    {
      id: 'CAB-ALT-02',
      severity: 'PREDICTION',
      severityLevel: 'prediction',
      title: 'Approach Deceleration Curve Ahead (5.3 KM)',
      location: 'Section B / KM 21.4',
      timestamp: '14:27:40',
      description: 'Prepare service braking descent from 140 km/h to 40 km/h for Station C Platform 1 turnout.'
    },
    {
      id: 'CAB-ALT-03',
      severity: 'WARNING',
      severityLevel: 'warning',
      title: 'Dwell Congestion Reported at Station B (Behind)',
      location: 'Station B / Platform 1',
      timestamp: '14:27:10',
      description: 'LOCAL_101 holding Station B departure slot (+8m). Maintain scheduled 118 km/h corridor headway.'
    }
  ]
};
