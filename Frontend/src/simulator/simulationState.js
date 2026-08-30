/**
 * RAIL//AI Simulation State Factory v2
 * Generates unified, deterministic state derived from central train kinematics and infrastructure.
 * Extended to support 30-train multi-network while preserving all existing state keys for Loco Pilot,
 * Station Master, and Control Room pages.
 * Ready for future ML telemetry and prediction models.
 */

import { scenarios } from './scenarios';
import { calculateNetworkRisk } from './safetyEvaluator';

export function formatEta(distanceRemainingKm, speedKmH) {
  if (distanceRemainingKm <= 0.05) return 'ARRIVED';
  if (!speedKmH || speedKmH <= 0) return 'STANDBY';
  const totalSeconds = Math.round((distanceRemainingKm / speedKmH) * 3600);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

export function computeSimulationState(params = {}) {
  const {
    phase = 1,
    phaseProgress = 0,
    simTime = '14:20:00',
    simTimeSec = null,
    activeCabTrainId = null,
    trainKinematics = {},
    eventLog = [],
    departureEvaluation = {},
    // Multi-train network state (new in v2)
    allTrains = null,
    stationStates = null,
    sectionStates = null,
    conflicts = [],
    networkMetrics = null,
    activeScenario = null,
    baselineSnapshot = null
  } = params;

  const scenario = scenarios[phase] || scenarios[1];

  const local101 = trainKinematics.local101 || {
    id: 'LOCAL_101',
    departureState: 'WAITING',
    progressPct: 0,
    speed: 0,
    dwellSeconds: 480,
    distanceTraversedKm: 0,
    distanceRemainingKm: 24.8,
    status: 'WAITING AT STATION B (P1)'
  };

  const express201 = trainKinematics.express201 || {
    id: 'EXPRESS_201',
    progressPct: 20,
    speed: 118,
    distanceTraversedKm: 4.96,
    distanceRemainingKm: 19.84,
    status: 'IN TRANSIT (SECTION B)'
  };

  const local102 = trainKinematics.local102 || {
    id: 'LOCAL_102',
    progressPct: 25,
    speed: 75,
    distanceTraversedKm: 6.2,
    distanceRemainingKm: 18.6,
    status: 'IN TRANSIT (UP MAIN)'
  };

  const express202 = trainKinematics.express202 || {
    id: 'EXPRESS_202',
    progressPct: 15,
    speed: 130,
    distanceTraversedKm: 4.8,
    distanceRemainingKm: 27.2,
    status: 'IN TRANSIT (SECTION C)'
  };

  // Coordinates on SVG diagrams (Section B spans from x: 480 to x: 880)
  const local101X = local101.departureState === 'DEPARTED'
    ? Math.round(480 + (local101.progressPct / 100) * 380)
    : 480;

  const express201X = Math.round(480 + (express201.progressPct / 100) * 380);
  const local102X = Math.round(860 - (local102.progressPct / 100) * 380);

  // Dynamic ETAs
  const express201Eta = formatEta(express201.distanceRemainingKm, express201.speed);
  const local102Eta = formatEta(local102.distanceRemainingKm, local102.speed);
  const express202Eta = formatEta(express202.distanceRemainingKm, express202.speed);
  const local101Eta = local101.departureState === 'DEPARTED'
    ? formatEta(local101.distanceRemainingKm, local101.speed)
    : local101.departureState === 'AUTHORIZED'
      ? 'READY TO DEPART'
      : 'HELD (+8 min)';

  // Calculate dynamic network risk
  const risk = calculateNetworkRisk(phase, [local101, express201, local102, express202], phase === 5);

  // 1. Unified Trains Array (Used across Control Room, Simulator, etc.)
  const trains = [
    {
      id: 'LOCAL_101',
      name: 'Local Passenger 101',
      type: 'LOCAL',
      section: local101.departureState === 'DEPARTED' ? 'SECTION_B' : 'STATION_B',
      track: 'Track 1 (Down)',
      direction: 'SOUTHBOUND',
      directionArrow: '↓',
      speed: Math.round(local101.speed),
      speedLimit: phase === 5 ? 40 : 80,
      delay: Math.round(local101.dwellSeconds / 60),
      delayFormatted: `+${Math.round(local101.dwellSeconds / 60)} min`,
      eta: local101Eta,
      status: local101.departureState === 'DEPARTED' ? (local101.progressPct > 95 ? 'ARRIVED' : 'IN TRANSIT') : local101.departureState === 'HELD' ? 'HELD BY INTERLOCKING' : local101.departureState === 'AUTHORIZED' ? 'AUTHORIZED' : 'STATION DWELL',
      statusCategory: local101.departureState === 'DEPARTED' ? 'NOMINAL' : local101.departureState === 'HELD' ? 'CRITICAL' : 'DELAYED',
      origin: 'Station B',
      destination: 'Station C',
      progressPct: Math.round(local101.progressPct),
      coordinates: { x: local101X, y: 155 },
      axles: 16,
      weightTons: 280,
      brakeProfile: 'NOMINAL'
    },
    {
      id: 'EXPRESS_201',
      name: 'Intercity Express 201',
      type: 'EXPRESS',
      section: 'SECTION_B',
      track: 'Track 1 (Down)',
      direction: 'SOUTHBOUND',
      directionArrow: '↓',
      speed: Math.round(express201.speed),
      speedLimit: phase === 5 ? 40 : 140,
      delay: 0,
      delayFormatted: '0 min',
      eta: express201Eta,
      status: phase === 5 ? 'BRAKING / HAZARD' : express201.progressPct > 90 ? 'APPROACHING STA-C' : 'IN TRANSIT',
      statusCategory: phase === 5 ? 'CRITICAL' : 'NOMINAL',
      origin: 'Station B',
      destination: 'Station C',
      progressPct: Math.round(express201.progressPct),
      coordinates: { x: express201X, y: 155 },
      axles: 24,
      weightTons: 420,
      brakeProfile: phase === 5 ? 'RESTRICTED' : 'NOMINAL'
    },
    {
      id: 'LOCAL_102',
      name: 'Regional Commuter 102',
      type: 'LOCAL',
      section: 'SECTION_B',
      track: 'Track 2 (Up)',
      direction: 'NORTHBOUND',
      directionArrow: '↑',
      speed: Math.round(local102.speed),
      speedLimit: 100,
      delay: 0,
      delayFormatted: '0 min',
      eta: local102Eta,
      status: local102.progressPct > 90 ? 'APPROACHING STA-B' : 'IN TRANSIT',
      statusCategory: 'NOMINAL',
      origin: 'Station C',
      destination: 'Station B',
      progressPct: Math.round(local102.progressPct),
      coordinates: { x: local102X, y: 225 },
      axles: 16,
      weightTons: 260,
      brakeProfile: 'NOMINAL'
    },
    {
      id: 'EXPRESS_202',
      name: 'Cross-Country Express 202',
      type: 'EXPRESS',
      section: 'SECTION_C',
      track: 'Track 2 (Up)',
      direction: 'NORTHBOUND',
      directionArrow: '↑',
      speed: Math.round(express202.speed),
      speedLimit: 160,
      delay: 0,
      delayFormatted: '0 min',
      eta: express202Eta,
      status: 'SCHEDULED DEPARTURE',
      statusCategory: 'NOMINAL',
      origin: 'Station C',
      destination: 'Station B',
      progressPct: Math.round(express202.progressPct),
      coordinates: { x: 880, y: 225 },
      axles: 20,
      weightTons: 390,
      brakeProfile: 'NOMINAL'
    }
  ];

  // 2. Station Master Unified Dataset
  const isLocal101Departed = local101.departureState === 'DEPARTED' || local101.departureState === 'ARRIVED';

  const stationData = {
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
          state: isLocal101Departed ? 'CLEAR' : 'OCCUPIED',
          trainId: isLocal101Departed ? null : 'LOCAL_101',
          trainType: isLocal101Departed ? null : 'LOCAL PASSENGER',
          destination: isLocal101Departed ? null : 'Station C',
          dwellMinutes: Math.round(local101.dwellSeconds / 60),
          statusNote: isLocal101Departed 
            ? 'DEPARTED — TRACK 1 CLEAR' 
            : local101.departureState === 'HELD' 
              ? 'MOVEMENT HELD — CONFLICT' 
              : local101.departureState === 'AUTHORIZED' 
                ? 'DEPARTURE AUTHORIZED' 
                : 'DWELL EXCEEDED (+8 MIN)',
          signalId: 'SIG-B1-P1',
          signalAspect: isLocal101Departed ? 'GREEN' : departureEvaluation.signalAspect || 'RED'
        },
        {
          id: 'STA_B_P2',
          stationId: 'STATION_B',
          stationName: 'Station B',
          number: '2',
          name: 'Platform 2',
          assignedTrack: 'Track 2 (Main Up)',
          lengthMeters: 380,
          state: 'CLEAR',
          trainId: null,
          trainType: null,
          destination: 'Terminal',
          dwellMinutes: 0,
          statusNote: 'CLEAR — READY FOR INBOUND',
          signalId: 'SIG-B2-P2',
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
          statusNote: 'CLEAR — LOOP STANDBY',
          signalId: 'SIG-B3-P3',
          signalAspect: 'GREEN'
        }
      ]
    },

    sectionB: {
      id: 'SECTION_B',
      name: 'Section B (Central-South Corridor)',
      lengthKm: 24.8,
      maxSpeedKmH: phase === 5 ? 40 : 140,
      occupancyStatus: isLocal101Departed 
        ? 'OCCUPIED (EXPRESS_201 & LOCAL_101)' 
        : 'OCCUPIED (EXPRESS_201)',
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
            speed: Math.round(express201.speed),
            progressPct: Math.round(express201.progressPct),
            etaToDestination: express201Eta,
            destinationStation: 'Station C',
            destinationPlatform: 'Platform 1',
            status: phase === 5 ? 'BRAKING (HAZARD)' : 'IN TRANSIT',
            statusCategory: phase === 5 ? 'CRITICAL' : 'NOMINAL'
          },
          signal: {
            id: 'SIG-B-ENTRY',
            aspect: departureEvaluation.signalAspect || 'GREEN',
            statusText: departureEvaluation.signalAspect === 'RED' ? 'STOP / HELD' : 'PROCEED'
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
            speed: Math.round(local102.speed),
            progressPct: Math.round(local102.progressPct),
            etaToDestination: local102Eta,
            destinationStation: 'Station B',
            destinationPlatform: 'Platform 2',
            status: 'IN TRANSIT',
            statusCategory: 'NOMINAL'
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
          state: (isLocal101Departed && local101.progressPct >= 95) 
            ? 'OCCUPIED' 
            : (isLocal101Departed && local101.progressPct >= 80)
              ? 'ARRIVING'
              : 'RESERVED',
          reservedForTrainId: isLocal101Departed ? 'LOCAL_101' : 'EXPRESS_201',
          trainType: 'PASSENGER',
          origin: 'Station B',
          statusNote: (isLocal101Departed && local101.progressPct >= 95)
            ? 'LOCAL_101 ARRIVED'
            : isLocal101Departed
              ? 'BERTH SECURED FOR LOCAL_101'
              : 'BERTH RESERVED FOR EXPRESS_201',
          signalId: 'SIG-C1-P1',
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
          dwellMinutes: 4,
          statusNote: 'BOARDING COMPLETE',
          signalId: 'SIG-C2-P2',
          signalAspect: 'AMBER'
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
          statusNote: 'CLEAR — STANDBY',
          signalId: 'SIG-C3-P3',
          signalAspect: 'GREEN'
        }
      ]
    },

    lifecycleSummary: {
      originStation: 'Station B (Central Junction)',
      corridorSection: 'Section B (24.8 KM)',
      destinationStation: 'Station C (South Hub)',
      activeMovements: isLocal101Departed ? 4 : 3,
      trainsAtStationB: isLocal101Departed ? 0 : 1,
      trainsInSectionB: isLocal101Departed ? 2 : 1,
      trainsAtStationC: 1,
      stationRiskScore: risk.score,
      riskCategory: risk.category
    },

    arrivalsDepartures: [
      {
        trainId: 'LOCAL_101',
        origin: 'Station B',
        destination: 'Station C',
        platform: isLocal101Departed ? 'P1 (C Approach)' : 'Platform 1 (B)',
        assignedPlatformId: 'STA_B_P1',
        direction: 'Southbound',
        directionArrow: '↓',
        eta: local101Eta,
        delay: `+${Math.round(local101.dwellSeconds / 60)} min`,
        delayMinutes: Math.round(local101.dwellSeconds / 60),
        status: local101.departureState === 'DEPARTED' ? 'IN TRANSIT' : local101.departureState === 'HELD' ? 'HELD' : local101.departureState === 'AUTHORIZED' ? 'AUTHORIZED' : 'WAITING',
        statusCategory: local101.departureState === 'DEPARTED' ? 'NOMINAL' : local101.departureState === 'HELD' ? 'CRITICAL' : 'DELAYED',
        lifecycleStage: local101.departureState === 'DEPARTED' ? 'SECTION_B_TRANSIT' : 'STATION_B_DWELL'
      },
      {
        trainId: 'EXPRESS_201',
        origin: 'Station B',
        destination: 'Station C',
        platform: 'P2 (B) → P1 (C)',
        assignedPlatformId: 'STA_C_P1',
        direction: 'Southbound',
        directionArrow: '↓',
        eta: express201Eta,
        delay: '0 min',
        delayMinutes: 0,
        status: phase === 5 ? 'SAFETY RESTRICTION' : 'ON TIME',
        statusCategory: phase === 5 ? 'CRITICAL' : 'NOMINAL',
        lifecycleStage: 'SECTION_B_TRANSIT'
      },
      {
        trainId: 'LOCAL_102',
        origin: 'Station C',
        destination: 'Station B',
        platform: 'Platform 2 (B)',
        assignedPlatformId: 'STA_B_P2',
        direction: 'Northbound',
        directionArrow: '↑',
        eta: local102Eta,
        delay: '0 min',
        delayMinutes: 0,
        status: 'ON TIME',
        statusCategory: 'NOMINAL',
        lifecycleStage: 'SECTION_B_TRANSIT'
      },
      {
        trainId: 'EXPRESS_202',
        origin: 'Station C',
        destination: 'Station B',
        platform: 'Platform 2 (C)',
        assignedPlatformId: 'STA_C_P2',
        direction: 'Northbound',
        directionArrow: '↑',
        eta: express202Eta,
        delay: '0 min',
        delayMinutes: 0,
        status: 'DEPARTING',
        statusCategory: 'NOMINAL',
        lifecycleStage: 'STATION_C_DEPARTURE'
      }
    ],

    alerts: scenario.alerts
  };

  // 3. Control Room Network Dataset
  const network = {
    status: 'OPERATIONAL',
    systemMode: phase === 5 
      ? 'SAFETY FALLBACK (SIL-4 RESTRICTION)' 
      : 'AUTOMATIC DISPATCH ADVISORY (ADA-SIL4)',
    networkRiskScore: risk.score,
    riskCategory: risk.category,
    activeTrainsCount: isLocal101Departed ? 4 : 3,
    delayedTrainsCount: isLocal101Departed ? 0 : 1,
    activeAlertsCount: scenario.alerts.length,
    stations: [
      { id: 'STATION_A', name: 'Station A (North Terminal)', shortCode: 'STA-A', platforms: ['Plat 1', 'Plat 2'], tracks: 2, x: 80, y: 190 },
      { id: 'STATION_B', name: 'Station B (Central Junction)', shortCode: 'STA-B', platforms: ['Plat 1', 'Plat 2', 'Plat 3'], tracks: 2, x: 480, y: 190 },
      { id: 'STATION_C', name: 'Station C (South Hub)', shortCode: 'STA-C', platforms: ['Plat 1', 'Plat 2'], tracks: 2, x: 880, y: 190 }
    ],
    sections: [
      {
        id: 'SECTION_A',
        name: 'Section A (North Corridor)',
        fromStation: 'STATION_A',
        toStation: 'STATION_B',
        lengthKm: 18.4,
        maxSpeed: 120,
        track1Occupied: false,
        track2Occupied: false,
        occupancyStatus: 'CLEAR',
        signals: [
          { id: 'SIG_A1', aspect: 'GREEN', track: 'Track 1', statusText: 'CLEAR' },
          { id: 'SIG_A2', aspect: 'GREEN', track: 'Track 2', statusText: 'CLEAR' }
        ]
      },
      {
        id: 'SECTION_B',
        name: 'Section B (Central Interlocking)',
        fromStation: 'STATION_B',
        toStation: 'STATION_C',
        lengthKm: 24.8,
        maxSpeed: phase === 5 ? 40 : 140,
        track1Occupied: true,
        track2Occupied: true,
        occupancyStatus: isLocal101Departed ? 'OCCUPIED (EXPRESS_201 & LOCAL_101)' : 'OCCUPIED (EXPRESS_201)',
        signals: [
          { 
            id: 'SIG_B1', 
            aspect: isLocal101Departed ? 'GREEN' : departureEvaluation.signalAspect || 'RED', 
            track: 'Track 1', 
            statusText: isLocal101Departed ? 'PROCEED' : (departureEvaluation.signalAspect === 'RED' ? 'STOP / HELD' : 'PROCEED') 
          },
          { id: 'SIG_B2', aspect: 'GREEN', track: 'Track 2', statusText: 'PROCEED' }
        ]
      },
      {
        id: 'SECTION_C',
        name: 'Section C (South Fastline)',
        fromStation: 'STATION_B',
        toStation: 'STATION_C',
        lengthKm: 32.0,
        maxSpeed: 160,
        track1Occupied: false,
        track2Occupied: true,
        occupancyStatus: 'OCCUPIED (EXPRESS_202)',
        signals: [
          { id: 'SIG_C1', aspect: 'GREEN', track: 'Track 1', statusText: 'CLEAR' },
          { id: 'SIG_C2', aspect: 'GREEN', track: 'Track 2', statusText: 'CLEAR' }
        ]
      }
    ],
    riskBreakdown: risk.breakdown
  };

  // 4. Loco Pilot Dataset (Supports the selected local cab or EXPRESS_201 fallback)
  const isLocalCab = String(activeCabTrainId || '').startsWith('LOCAL_');
  const activeTrain = isLocalCab ? local101 : express201;
  const activeCabLabel = activeCabTrainId || (isLocalCab ? 'LOCAL' : 'EXPRESS_201');

  const distTraversed = activeTrain.distanceTraversedKm;
  const distRemaining = activeTrain.distanceRemainingKm;
  const currentSpd = Math.round(activeTrain.speed);

  const locoPilotData = {
    trainId: isLocalCab ? activeCabLabel : 'EXPRESS_201',
    trainName: isLocalCab ? `Regional Commuter Shuttle ${activeCabLabel.replace('LOCAL_', '')}` : 'Intercity Superfast Express 201',
    serviceType: isLocalCab ? 'PASSENGER_LOCAL' : 'PASSENGER_EXPRESS',
    locoModel: isLocalCab ? 'MEMU-3000 / AC Traction' : 'WAP-7 / 3-Phase AC Electric',
    cabId: isLocalCab ? `CAB-1 (${activeCabLabel} LEADING)` : 'CAB-1 (EXPRESS_201 LEADING)',
    driverName: isLocalCab ? 'Capt. V. Nair (LP-402)' : 'Capt. R. Sharma (LP-884)',
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
      progressPct: Math.round(activeTrain.progressPct),
      distanceTraversedKm: distTraversed,
      distanceRemainingKm: distRemaining,
      etaToDestination: isLocalCab ? local101Eta : express201Eta,
      arrivalTimeScheduled: '14:36'
    },
    telemetry: {
      currentSpeed: currentSpd,
      speedUnit: 'KM/H',
      permittedSpeedLimit: phase === 5 ? 40 : (isLocalCab ? 80 : 140),
      targetSpeed: phase === 5 ? 40 : (isLocalCab ? 80 : express201.targetSpeed),
      targetDistanceMeters: Math.round(distRemaining * 1000),
      throttlePositionPct: currentSpd > 0 ? (phase === 5 ? 20 : 65) : 0,
      brakePipePressureBar: phase === 5 ? 3.8 : 5.0,
      mainReservoirBar: 9.8,
      lineVoltageKV: 25.2,
      tractionCurrentAmps: currentSpd > 0 ? Math.round(currentSpd * 3.2) : 0,
      catenaryStatus: 'NOMINAL 25.2 kV'
    },
    signaling: {
      currentAspect: isLocalCab 
        ? (isLocal101Departed ? 'GREEN' : departureEvaluation.signalAspect || 'RED') 
        : (phase === 5 ? 'RED' : express201.progressPct > 80 ? 'AMBER' : 'GREEN'),
      aspectLabel: isLocalCab 
        ? (isLocal101Departed ? 'PROCEED' : departureEvaluation.signalAspect === 'GREEN' ? 'PROCEED' : 'STOP / HELD')
        : (phase === 5 ? 'RESTRICTED / STOP' : express201.progressPct > 80 ? 'CAUTION' : 'PROCEED'),
      nextSignalId: isLocalCab ? 'SIG-B1-P1' : 'SIG-C1-APPROACH',
      nextSignalLocation: isLocalCab ? 'Station B Outbound Junction (KM 0.4)' : 'Station C North Approach (KM 23.4)',
      distanceToNextSignalMeters: isLocalCab ? Math.max(0, Math.round((0.4 - distTraversed) * 1000)) : Math.max(0, Math.round((23.4 - distTraversed) * 1000)),
      movementAuthorityMeters: phase === 5 ? 1200 : (isLocalCab && !isLocal101Departed ? 0 : 9200),
      etcsLevel: 'ETCS LEVEL 2',
      mode: phase === 5 ? 'RESTRICTED / BRAKING (SR)' : (isLocalCab && !isLocal101Departed ? 'STANDBY / SHUNTING' : 'FULL SUPERVISION (FS)'),
      radioBlockCenter: 'RBC-SOUTH-02 (ACTIVE)'
    },
    safety: {
      overallStatus: phase === 5 ? 'SAFETY WARNING' : phase === 4 ? 'CAUTION' : 'NORMAL',
      safetyCategory: phase === 5 ? 'SIL-4 RESTRICTION' : 'SIL-4 COMPLIANT',
      vigilanceDsdStatus: 'ACTIVE (RESET IN 24s)',
      emergencyBrakeStatus: phase === 5 ? 'ARMED (SAFETY OVERRIDE)' : 'STANDBY (NOMINAL)',
      wheelSlipProtection: 'ACTIVE (0% SLIP)',
      trackCircuitOccupancy: phase === 5 ? 'RESTRICTED BLOCKS 12-14' : 'NOMINAL CLEARANCE'
    },
    departureWorkflow: {
      trainId: activeCabLabel,
      departureState: local101.departureState,
      location: 'Station B / Platform 1',
      destination: 'Station C',
      junction: 'J-02 (KM 12.4)',
      expressEta: express201Eta,
      expressProgress: Math.round(express201.progressPct),
      headwayStatus: departureEvaluation.headwayStatus,
      headwaySeconds: departureEvaluation.headwaySeconds,
      distanceToConflictMeters: departureEvaluation.distanceToConflictMeters,
      routeStatus: departureEvaluation.routeStatus,
      riskScore: departureEvaluation.risk,
      riskCategory: departureEvaluation.riskCategory,
      recommendation: departureEvaluation.recommendation,
      authorized: departureEvaluation.authorized,
      reason: departureEvaluation.reason,
      estimatedClearanceTime: departureEvaluation.estimatedClearanceTime
    },
    trackWaypoints: [
      { km: 0.0, name: 'STATION B [P1]', type: 'STATION_ORIGIN', passed: distTraversed > 0.1, note: isLocalCab ? 'Platform 1' : 'Departed' },
      { km: 3.2, name: 'SWITCH SW-B1', type: 'INTERLOCKING', passed: distTraversed > 3.2, note: 'Normal locked' },
      { km: 11.5, name: 'JUNCTION J-02', type: 'JUNCTION', passed: distTraversed > 11.5, note: express201.progressPct >= 58 ? 'Cleared' : 'Conflict Area' },
      { km: parseFloat(distTraversed.toFixed(1)), name: `CURRENT (${isLocalCab ? activeCabLabel : 'EXPRESS_201'})`, type: 'TRAIN_CURSOR', isCurrent: true, note: `Speed ${currentSpd} km/h` },
      { km: 21.4, name: 'BRAKING CURVE', type: 'DECEL_POINT', passed: distTraversed > 21.4, note: 'Target approach' },
      { km: 23.4, name: 'SIGNAL SIG-C1', type: 'SIGNAL', passed: distTraversed > 23.4, note: 'Approach signal' },
      { km: 24.8, name: 'STATION C [P1]', type: 'STATION_DESTINATION', passed: distTraversed >= 24.8, note: 'Berth reserved' }
    ],
    alerts: scenario.locoAlerts
  };

  return {
    phase,
    scenarioName: scenario.name,
    scenarioTitle: scenario.title,
    simulationTime: simTime,
    simTimeSec,
    // ── Legacy state keys (preserved for Loco Pilot / Station Master / Control Room) ──
    trains,
    stationData,
    network,
    locoPilotData,
    departureEvaluation,
    alerts: scenario.alerts,
    eventLog,
    // ── Multi-train network state (v3) ──
    allTrains: params.allTrains || allTrains || trains,
    stationStates:  params.stationStates  || stationStates,
    sectionStates:  params.sectionStates  || sectionStates,
    signalStates:   params.signalStates   || {},
    conflicts:      params.conflicts      || conflicts,
    networkMetrics: params.networkMetrics || networkMetrics,
    activeScenario: params.activeScenario || activeScenario,
    baselineSnapshot: params.baselineSnapshot || baselineSnapshot,
    // ── Loco Pilot live (v3) ──
    cabTrain:           params.cabTrain           || null,
    cabPrediction:      params.cabPrediction      || null,
    activeCabTrainId:   params.activeCabTrainId   || activeCabTrainId,
    locoPilotDecisions: params.locoPilotDecisions || {},
    // ── Intrusion state (v4) ──
    intrusionState: params.intrusionState || { active: [], history: [] },
    affectedTrainIds: params.affectedTrainIds || [],
    trainImpactMap: params.trainImpactMap || {},
    hasActiveIntrusions: !!params.hasActiveIntrusions,
    departureEvaluation: params.departureEvaluation || departureEvaluation
  };
}

