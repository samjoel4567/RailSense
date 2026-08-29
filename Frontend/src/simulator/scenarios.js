/**
 * RAIL//AI Deterministic Scenarios
 * Concrete states for each of the 5 demo phases.
 * No random values are used.
 */

export const scenarios = {
  1: {
    phase: 1,
    name: 'NORMAL',
    title: 'PHASE 1 — NORMAL OPERATIONS',
    time: '14:20:00',
    risk: {
      score: 18,
      category: 'NORMAL',
      breakdown: [
        { factor: 'Corridor Spacing & Headway', weightPct: 8, severity: 'normal' },
        { factor: 'Station Turnaround Variance', weightPct: 6, severity: 'normal' },
        { factor: 'Switch Interlocking Wear', weightPct: 4, severity: 'normal' }
      ]
    },
    counts: {
      activeTrains: 4,
      delayedTrains: 0,
      activeAlerts: 0
    },
    express201: {
      speed: 118,
      speedLimit: 140,
      targetSpeed: 40,
      progressPct: 65,
      eta: '8 MIN',
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'TRAVELLING IN SECTION B (118 km/h)',
      location: 'Section B (KM 16.1 / 24.8 KM)',
      signalAspect: 'GREEN',
      nextSignalId: 'SIG-C1',
      nextSignalAspect: 'GREEN',
      nextSignalLabel: 'PROCEED',
      distanceToSignal: 7300,
      distanceRemainingKm: 8.7,
      distanceTraversedKm: 16.1
    },
    local101: {
      speed: 0,
      speedLimit: 100,
      delayMinutes: 0,
      delayFormatted: '0 min',
      eta: '14:32',
      status: 'BOARDING',
      statusCategory: 'normal',
      lifecycleStage: 'BOARDING AT STATION B (P1)',
      location: 'Station B (Platform 1)',
      progressPct: 0
    },
    local102: {
      speed: 76,
      speedLimit: 90,
      delayMinutes: 0,
      delayFormatted: '0 min',
      progressPct: 35,
      eta: '12 MIN',
      status: 'APPROACHING',
      statusCategory: 'normal',
      lifecycleStage: 'APPROACHING STATION B (76 km/h)',
      location: 'Section B (KM 8.7 Northbound)'
    },
    express202: {
      speed: 0,
      speedLimit: 140,
      delayMinutes: 0,
      delayFormatted: '0 min',
      eta: '14:47',
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'BOARDING AT STATION C (P2)',
      location: 'Station C (Platform 2)',
      progressPct: 0
    },
    stationB: {
      p1: { state: 'OCCUPIED', trainId: 'LOCAL_101', trainType: 'LOCAL', destination: 'Station C', dwellMinutes: 0, statusNote: 'BOARDING // ON SCHEDULE', signalAspect: 'GREEN', signalId: 'SIG-B1' },
      p2: { state: 'DEPARTING', trainId: 'EXPRESS_201', trainType: 'EXPRESS', destination: 'Station C', dwellMinutes: 0, statusNote: 'DEPARTED → ENTERING SECTION B', signalAspect: 'GREEN', signalId: 'SIG-B2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-B3' }
    },
    stationC: {
      p1: { state: 'RESERVED', reservedForTrainId: 'EXPRESS_201', trainType: 'EXPRESS', origin: 'Station B', statusNote: 'RESERVED FOR INBOUND EXPRESS_201 (ETA: 8 MIN)', signalAspect: 'GREEN', signalId: 'SIG-C1' },
      p2: { state: 'OCCUPIED', trainId: 'EXPRESS_202', trainType: 'EXPRESS', destination: 'Station B', dwellMinutes: 0, statusNote: 'BOARDING // SCHEDULED DEPARTURE 14:47', signalAspect: 'GREEN', signalId: 'SIG-C2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-C3' }
    },
    sectionBStatus: 'OCCUPIED (2 ACTIVE MOVEMENTS)',
    alerts: [
      {
        id: 'ALT-SYS-01',
        severity: 'NORMAL',
        severityLevel: 'normal',
        title: 'Corridor Alpha Clear Route Interlocking Secured',
        event: 'Nominal corridor operations across Section B',
        location: 'Section B (All Blocks)',
        trainId: 'EXPRESS_201',
        timestamp: '14:20:00',
        description: 'All interlocking signals clear. Section B capacity nominal with 2 active scheduled movements.',
        impact: 'Nominal transit flow.',
        recommendedAction: 'Maintain scheduled timetable and ETCS Level 2 supervision.'
      }
    ],
    locoAlerts: [
      {
        id: 'CAB-ALT-01',
        severity: 'NORMAL',
        severityLevel: 'normal',
        title: 'Signal SIG-C1 Illuminated GREEN',
        location: 'Section B / Approach KM 23.4',
        timestamp: '14:20:00',
        description: 'Clear route locked to Station C Platform 1. Full supervision movement authority granted.'
      }
    ]
  },

  2: {
    phase: 2,
    name: 'LOCAL_DELAY',
    title: 'PHASE 2 — LOCAL TRAIN DELAY',
    time: '14:21:30',
    risk: {
      score: 28,
      category: 'NORMAL',
      breakdown: [
        { factor: 'Station B Platform 1 Dwell Exceeded (+8m)', weightPct: 16, severity: 'warning' },
        { factor: 'Downstream Slot Compression', weightPct: 8, severity: 'caution' },
        { factor: 'Switch Interlocking Residuals', weightPct: 4, severity: 'normal' }
      ]
    },
    counts: {
      activeTrains: 4,
      delayedTrains: 1,
      activeAlerts: 1
    },
    express201: {
      speed: 118,
      speedLimit: 140,
      targetSpeed: 40,
      progressPct: 70,
      eta: '7 MIN',
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'TRAVELLING IN SECTION B (118 km/h)',
      location: 'Section B (KM 17.4 / 24.8 KM)',
      signalAspect: 'GREEN',
      nextSignalId: 'SIG-C1',
      nextSignalAspect: 'GREEN',
      nextSignalLabel: 'PROCEED',
      distanceToSignal: 6000,
      distanceRemainingKm: 7.4,
      distanceTraversedKm: 17.4
    },
    local101: {
      speed: 0,
      speedLimit: 100,
      delayMinutes: 8,
      delayFormatted: '+8 min',
      eta: '14:40',
      status: 'DELAYED',
      statusCategory: 'warning',
      lifecycleStage: 'DWELLING AT STATION B (P1 DELAYED)',
      location: 'Station B (Platform 1)',
      progressPct: 0
    },
    local102: {
      speed: 76,
      speedLimit: 90,
      delayMinutes: 0,
      delayFormatted: '0 min',
      progressPct: 45,
      eta: '10 MIN',
      status: 'APPROACHING',
      statusCategory: 'normal',
      lifecycleStage: 'APPROACHING STATION B (76 km/h)',
      location: 'Section B (KM 11.2 Northbound)'
    },
    express202: {
      speed: 0,
      speedLimit: 140,
      delayMinutes: 0,
      delayFormatted: '0 min',
      eta: '14:47',
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'BOARDING AT STATION C (P2)',
      location: 'Station C (Platform 2)',
      progressPct: 0
    },
    stationB: {
      p1: { state: 'OCCUPIED', trainId: 'LOCAL_101', trainType: 'LOCAL', destination: 'Station C', dwellMinutes: 8, statusNote: 'BOARDING // DWELL VARIANCE (+8m)', signalAspect: 'AMBER', signalId: 'SIG-B1' },
      p2: { state: 'DEPARTING', trainId: 'EXPRESS_201', trainType: 'EXPRESS', destination: 'Station C', dwellMinutes: 0, statusNote: 'CLEARED DEPARTURE → IN SECTION B', signalAspect: 'GREEN', signalId: 'SIG-B2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-B3' }
    },
    stationC: {
      p1: { state: 'RESERVED', reservedForTrainId: 'EXPRESS_201', trainType: 'EXPRESS', origin: 'Station B', statusNote: 'RESERVED FOR INBOUND EXPRESS_201 (ETA: 7 MIN)', signalAspect: 'GREEN', signalId: 'SIG-C1' },
      p2: { state: 'OCCUPIED', trainId: 'EXPRESS_202', trainType: 'EXPRESS', destination: 'Station B', dwellMinutes: 0, statusNote: 'BOARDING // SCHEDULED DEPARTURE 14:47', signalAspect: 'GREEN', signalId: 'SIG-C2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-C3' }
    },
    sectionBStatus: 'OCCUPIED (2 MOVEMENTS, 1 DELAY AT ORIGIN)',
    alerts: [
      {
        id: 'ALT-104',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'Station B Platform 1 Dwell Exceeded (+8 min)',
        event: 'LOCAL_101 delay detected (+8 min)',
        location: 'Station B / Platform 1',
        trainId: 'LOCAL_101',
        section: 'SECTION_B',
        timestamp: '14:21:30',
        description: 'LOCAL_101 delayed on Station B Platform 1. Passenger door clearance delay holding Section B scheduled dispatch slot.',
        impact: 'Potential headway compression with trailing corridor traffic.',
        recommendedAction: 'Station Master advisory: Complete boarding and dispatch to prevent junction queuing.'
      }
    ],
    locoAlerts: [
      {
        id: 'CAB-ALT-03',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'Dwell Congestion Reported at Station B (Behind)',
        location: 'Station B / Platform 1',
        timestamp: '14:21:30',
        description: 'LOCAL_101 holding Station B departure slot (+8m). Maintain scheduled 118 km/h corridor speed.'
      },
      {
        id: 'CAB-ALT-01',
        severity: 'NORMAL',
        severityLevel: 'normal',
        title: 'Signal SIG-C1 Illuminated GREEN',
        location: 'Section B / Approach KM 23.4',
        timestamp: '14:20:00',
        description: 'Clear route locked to Station C Platform 1. Full supervision authority active.'
      }
    ]
  },

  3: {
    phase: 3,
    name: 'EXPRESS_APPROACH',
    title: 'PHASE 3 — EXPRESS APPROACHES',
    time: '14:24:00',
    risk: {
      score: 34,
      category: 'NORMAL',
      breakdown: [
        { factor: 'Station C Approach Deceleration Margin', weightPct: 14, severity: 'caution' },
        { factor: 'Station B Dwell Residuals (LOCAL_101)', weightPct: 14, severity: 'warning' },
        { factor: 'Switch Interlocking Locking Stability', weightPct: 6, severity: 'normal' }
      ]
    },
    counts: {
      activeTrains: 4,
      delayedTrains: 1,
      activeAlerts: 1
    },
    express201: {
      speed: 96,
      speedLimit: 140,
      targetSpeed: 40,
      progressPct: 84,
      eta: '4 MIN',
      status: 'APPROACHING DESTINATION',
      statusCategory: 'normal',
      lifecycleStage: 'APPROACHING STATION C (96 km/h DECELERATING)',
      location: 'Section B (KM 20.8 / 24.8 KM)',
      signalAspect: 'GREEN',
      nextSignalId: 'SIG-C1',
      nextSignalAspect: 'GREEN',
      nextSignalLabel: 'PROCEED (APPROACH SPEED)',
      distanceToSignal: 2600,
      distanceRemainingKm: 4.0,
      distanceTraversedKm: 20.8
    },
    local101: {
      speed: 0,
      speedLimit: 100,
      delayMinutes: 8,
      delayFormatted: '+8 min',
      eta: '14:40',
      status: 'DELAYED',
      statusCategory: 'warning',
      lifecycleStage: 'DWELLING AT STATION B (P1 DELAYED)',
      location: 'Station B (Platform 1)',
      progressPct: 0
    },
    local102: {
      speed: 76,
      speedLimit: 90,
      delayMinutes: 0,
      delayFormatted: '0 min',
      progressPct: 60,
      eta: '7 MIN',
      status: 'APPROACHING',
      statusCategory: 'normal',
      lifecycleStage: 'APPROACHING STATION B (76 km/h)',
      location: 'Section B (KM 14.8 Northbound)'
    },
    express202: {
      speed: 0,
      speedLimit: 140,
      delayMinutes: 0,
      delayFormatted: '0 min',
      eta: '14:47',
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'BOARDING AT STATION C (P2)',
      location: 'Station C (Platform 2)',
      progressPct: 0
    },
    stationB: {
      p1: { state: 'OCCUPIED', trainId: 'LOCAL_101', trainType: 'LOCAL', destination: 'Station C', dwellMinutes: 8, statusNote: 'BOARDING // DWELL VARIANCE (+8m)', signalAspect: 'AMBER', signalId: 'SIG-B1' },
      p2: { state: 'DEPARTING', trainId: 'EXPRESS_201', trainType: 'EXPRESS', destination: 'Station C', dwellMinutes: 0, statusNote: 'SECTION B TRANSIT ADVANCED', signalAspect: 'GREEN', signalId: 'SIG-B2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-B3' }
    },
    stationC: {
      p1: { state: 'RESERVED', reservedForTrainId: 'EXPRESS_201', trainType: 'EXPRESS', origin: 'Station B', statusNote: 'RESERVED: EXPRESS_201 (ETA: 4 MIN // APPROACH SECURED)', signalAspect: 'GREEN', signalId: 'SIG-C1' },
      p2: { state: 'OCCUPIED', trainId: 'EXPRESS_202', trainType: 'EXPRESS', destination: 'Station B', dwellMinutes: 0, statusNote: 'BOARDING // SCHEDULED DEPARTURE 14:47', signalAspect: 'GREEN', signalId: 'SIG-C2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-C3' }
    },
    sectionBStatus: 'OCCUPIED (EXPRESS_201 APPROACHING STATION C)',
    alerts: [
      {
        id: 'ALT-104',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'Station B Platform 1 Dwell Exceeded (+8 min)',
        event: 'LOCAL_101 delay detected (+8 min)',
        location: 'Station B / Platform 1',
        trainId: 'LOCAL_101',
        section: 'SECTION_B',
        timestamp: '14:21:30',
        description: 'LOCAL_101 holding Station B Platform 1 departure slot. Interlocking routing holding clear path for inbound EXPRESS_201.',
        impact: 'Headway compression on Section B corridor.',
        recommendedAction: 'Maintain signal priority for high-speed express route.'
      },
      {
        id: 'ALT-107',
        severity: 'NORMAL',
        severityLevel: 'normal',
        title: 'Station C Platform 1 Interlocking Route Locked',
        event: 'Station C Track 1 approach route verified',
        location: 'Station C / Platform 1 Approach',
        trainId: 'EXPRESS_201',
        section: 'SECTION_B',
        timestamp: '14:24:00',
        description: 'Station C interlocking route confirmed for Track 1 → Platform C1 arrival. Deceleration envelope nominal.',
        impact: 'Nominal arrival sequence.',
        recommendedAction: 'Execute service braking to target 40 km/h at Station C approach signal.'
      }
    ],
    locoAlerts: [
      {
        id: 'CAB-ALT-02',
        severity: 'PREDICTION',
        severityLevel: 'prediction',
        title: 'Approach Deceleration Curve Active (KM 21.4)',
        location: 'Section B / KM 21.4',
        timestamp: '14:24:00',
        description: 'Service braking curve engaged for Station C Platform 1 turnout (speed 96 → 40 km/h).'
      },
      {
        id: 'CAB-ALT-01',
        severity: 'NORMAL',
        severityLevel: 'normal',
        title: 'Signal SIG-C1 Illuminated GREEN',
        location: 'Section B / Approach KM 23.4',
        timestamp: '14:20:00',
        description: 'Clear route locked to Station C Platform 1. Full supervision authority active.'
      }
    ]
  },

  4: {
    phase: 4,
    name: 'PREDICTED_CONFLICT',
    title: 'PHASE 4 — PREDICTED CONFLICT',
    time: '14:27:04',
    risk: {
      score: 68,
      category: 'HIGH',
      breakdown: [
        { factor: 'Junction J-02 Conflict Probability (87%)', weightPct: 44, severity: 'critical' },
        { factor: 'Headway Compression (LOCAL_101 vs EXPRESS_201)', weightPct: 18, severity: 'warning' },
        { factor: 'Station B Dwell Delay Variance', weightPct: 6, severity: 'caution' }
      ]
    },
    counts: {
      activeTrains: 4,
      delayedTrains: 1,
      activeAlerts: 2
    },
    express201: {
      speed: 88,
      speedLimit: 140,
      targetSpeed: 40,
      progressPct: 88,
      eta: '3 MIN',
      status: 'CAUTION - CONFLICT ZONE ADVISORY',
      statusCategory: 'warning',
      lifecycleStage: 'JUNCTION J-02 CONFLICT ZONE (PRIORITY GRANTED)',
      location: 'Section B (KM 21.8 / 24.8 KM)',
      signalAspect: 'AMBER',
      nextSignalId: 'SIG-C1',
      nextSignalAspect: 'AMBER',
      nextSignalLabel: 'APPROACH CAUTION (PRIORITY ROUTE)',
      distanceToSignal: 1600,
      distanceRemainingKm: 3.0,
      distanceTraversedKm: 21.8
    },
    local101: {
      speed: 0,
      speedLimit: 100,
      delayMinutes: 8,
      delayFormatted: '+8 min',
      eta: '14:40',
      status: 'HELD AT STATION B',
      statusCategory: 'warning',
      lifecycleStage: 'HELD AT STATION B P1 (CONFLICT MITIGATION)',
      location: 'Station B (Platform 1)',
      progressPct: 0
    },
    local102: {
      speed: 76,
      speedLimit: 90,
      delayMinutes: 0,
      delayFormatted: '0 min',
      progressPct: 75,
      eta: '4 MIN',
      status: 'APPROACHING',
      statusCategory: 'normal',
      lifecycleStage: 'APPROACHING STATION B (76 km/h)',
      location: 'Section B (KM 18.6 Northbound)'
    },
    express202: {
      speed: 0,
      speedLimit: 140,
      delayMinutes: 0,
      delayFormatted: '0 min',
      eta: '14:47',
      status: 'ON TIME',
      statusCategory: 'normal',
      lifecycleStage: 'BOARDING AT STATION C (P2)',
      location: 'Station C (Platform 2)',
      progressPct: 0
    },
    stationB: {
      p1: { state: 'OCCUPIED', trainId: 'LOCAL_101', trainType: 'LOCAL', destination: 'Station C', dwellMinutes: 8, statusNote: 'HELD BY INTERLOCKING // PREVENT JUNCTION J-02 CONFLICT', signalAspect: 'RED', signalId: 'SIG-B1' },
      p2: { state: 'DEPARTING', trainId: 'EXPRESS_201', trainType: 'EXPRESS', destination: 'Station C', dwellMinutes: 0, statusNote: 'PRIORITY ROUTE ACTIVE IN SECTION B', signalAspect: 'GREEN', signalId: 'SIG-B2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-B3' }
    },
    stationC: {
      p1: { state: 'RESERVED', reservedForTrainId: 'EXPRESS_201', trainType: 'EXPRESS', origin: 'Station B', statusNote: 'PRIORITY RESERVATION: EXPRESS_201 (ETA: 3 MIN)', signalAspect: 'AMBER', signalId: 'SIG-C1' },
      p2: { state: 'OCCUPIED', trainId: 'EXPRESS_202', trainType: 'EXPRESS', destination: 'Station B', dwellMinutes: 0, statusNote: 'BOARDING // SCHEDULED DEPARTURE 14:47', signalAspect: 'GREEN', signalId: 'SIG-C2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-C3' }
    },
    sectionBStatus: 'CAUTION // PREDICTIVE INTERLOCKING MODEL ACTIVE',
    alerts: [
      {
        id: 'ALT-105',
        severity: 'PREDICTION',
        severityLevel: 'prediction',
        title: 'Section B Junction J-02 Conflict Prediction (87%)',
        event: 'Conflict probability 87% at Junction J-02 (EXPRESS_201 / LOCAL_101)',
        location: 'Section B / Junction J-02',
        trainId: 'EXPRESS_201',
        secondaryTrainId: 'LOCAL_101',
        section: 'SECTION_B',
        timestamp: '14:27:04',
        description: 'Deterministic predictive model calculates 87% probability of route crossing conflict between EXPRESS_201 and LOCAL_101 at Junction J-02 if LOCAL_101 departs Section B without regulation.',
        impact: 'Estimated 4-minute cascading delay across Corridor Alpha if interlocking route is not managed.',
        recommendedAction: 'PRIORITY GIVEN TO EXPRESS_201. HOLD / MANAGE CONFLICTING MOVEMENT AT STATION B P1 (SIG-B1 RED).'
      },
      {
        id: 'ALT-104',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'Station B Platform 1 Dwell Exceeded (+8 min)',
        event: 'LOCAL_101 delay detected (+8 min)',
        location: 'Station B / Platform 1',
        trainId: 'LOCAL_101',
        section: 'SECTION_B',
        timestamp: '14:21:30',
        description: 'LOCAL_101 delayed on Platform 1. Train held to clear priority transit slot for EXPRESS_201.',
        impact: 'LOCAL_101 held at origin platform.',
        recommendedAction: 'Hold LOCAL_101 until EXPRESS_201 clears Junction J-02 interlocking zone.'
      }
    ],
    locoAlerts: [
      {
        id: 'CAB-ALT-04',
        severity: 'PREDICTION',
        severityLevel: 'prediction',
        title: 'Junction J-02 Conflict Advisory: Priority Granted',
        location: 'Section B / Junction J-02',
        timestamp: '14:27:04',
        description: 'Predictive interlocking model (87% conflict probability): Dispatcher advisory grants EXPRESS_201 transit priority. Conflicting train held at Station B.'
      },
      {
        id: 'CAB-ALT-02',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'Approach Deceleration Curve Active (KM 21.4)',
        location: 'Section B / KM 21.4',
        timestamp: '14:24:00',
        description: 'Service braking curve engaged for Station C Platform 1 turnout.'
      }
    ]
  },

  5: {
    phase: 5,
    name: 'SAFETY_VISION_EVENT',
    title: 'PHASE 5 — SAFETY / VISION EVENT',
    time: '14:29:10',
    risk: {
      score: 86,
      category: 'CRITICAL',
      breakdown: [
        { factor: 'AI Vision Track Hazard / Obstacle Detected (96%)', weightPct: 58, severity: 'critical' },
        { factor: 'Interlocking Emergency Safety Envelope Active', weightPct: 18, severity: 'critical' },
        { factor: 'Downstream Divergence Protocol Required', weightPct: 10, severity: 'warning' }
      ]
    },
    counts: {
      activeTrains: 4,
      delayedTrains: 2,
      activeAlerts: 3
    },
    express201: {
      speed: 38,
      speedLimit: 40,
      targetSpeed: 0,
      progressPct: 92,
      eta: '2 MIN (RESTRICTED)',
      status: 'SAFETY RESTRICTION / HAZARD ENVELOPE',
      statusCategory: 'warning',
      lifecycleStage: 'SAFETY DECELERATION // AI VISION HAZARD AHEAD',
      location: 'Section B (KM 22.8 / 24.8 KM)',
      signalAspect: 'RED',
      nextSignalId: 'SIG-C1',
      nextSignalAspect: 'RED',
      nextSignalLabel: 'STOP / SPEED RESTRICTED',
      distanceToSignal: 600,
      distanceRemainingKm: 2.0,
      distanceTraversedKm: 22.8
    },
    local101: {
      speed: 0,
      speedLimit: 100,
      delayMinutes: 8,
      delayFormatted: '+8 min',
      eta: '14:40',
      status: 'HELD AT STATION B',
      statusCategory: 'warning',
      lifecycleStage: 'HELD AT STATION B (SAFETY PROTOCOL)',
      location: 'Station B (Platform 1)',
      progressPct: 0
    },
    local102: {
      speed: 40,
      speedLimit: 90,
      delayMinutes: 2,
      delayFormatted: '+2 min',
      progressPct: 88,
      eta: '2 MIN',
      status: 'CAUTION SPEED',
      statusCategory: 'caution',
      lifecycleStage: 'ENTERING STATION B (CAUTION 40 km/h)',
      location: 'Section B (KM 21.8 Northbound)'
    },
    express202: {
      speed: 0,
      speedLimit: 140,
      delayMinutes: 0,
      delayFormatted: '0 min',
      eta: '14:47',
      status: 'HELD AT STATION C',
      statusCategory: 'caution',
      lifecycleStage: 'HELD AT STATION C P2 (SAFETY PROTOCOL)',
      location: 'Station C (Platform 2)',
      progressPct: 0
    },
    stationB: {
      p1: { state: 'OCCUPIED', trainId: 'LOCAL_101', trainType: 'LOCAL', destination: 'Station C', dwellMinutes: 8, statusNote: 'HELD // CORRIDOR SAFETY ENVELOPE RESTRICTION', signalAspect: 'RED', signalId: 'SIG-B1' },
      p2: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'BERTH CLEAR // INTERLOCKING LOCKOUT', signalAspect: 'RED', signalId: 'SIG-B2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // TRACK CLEAR', signalAspect: 'RED', signalId: 'SIG-B3' }
    },
    stationC: {
      p1: { state: 'RESERVED', reservedForTrainId: 'EXPRESS_201', trainType: 'EXPRESS', origin: 'Station B', statusNote: 'APPROACH RESTRICTED // SPEED RESTRICTION 40 KM/H', signalAspect: 'RED', signalId: 'SIG-C1' },
      p2: { state: 'OCCUPIED', trainId: 'EXPRESS_202', trainType: 'EXPRESS', destination: 'Station B', dwellMinutes: 0, statusNote: 'DEPARTURE HELD // CORRIDOR HAZARD ENVELOPE', signalAspect: 'RED', signalId: 'SIG-C2' },
      p3: { state: 'CLEAR', trainId: null, trainType: null, destination: null, dwellMinutes: 0, statusNote: 'STANDBY // AVAILABLE FOR DIVERSION', signalAspect: 'RED', signalId: 'SIG-C3' }
    },
    sectionBStatus: 'CRITICAL HAZARD // AI VISION SAFETY EVENT DETECTED',
    alerts: [
      {
        id: 'ALT-109-VISION',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'AI Vision Safety Alert: Track Hazard / Obstacle on Section B',
        event: 'AI Vision Event: Track obstacle detected at Section B KM 23.1 (96% Confidence)',
        location: 'Section B / Track 1 (KM 23.1)',
        trainId: 'EXPRESS_201',
        section: 'SECTION_B',
        timestamp: '14:29:10',
        description: 'Simulated AI edge vision model inference detected a stationary track hazard/obstacle on Track 1 approach corridor. SIL-4 safety envelope initiated.',
        impact: 'Emergency speed restriction to 40 km/h applied to inbound EXPRESS_201.',
        recommendedAction: 'REDUCE SPEED TO 40 KM/H. PREPARE FOR CONTROLLED STOP BEFORE KM 23.1 OBSTACLE BUFFER.'
      },
      {
        id: 'ALT-105',
        severity: 'PREDICTION',
        severityLevel: 'prediction',
        title: 'Section B Junction J-02 Conflict Prediction (87%)',
        event: 'Conflict probability 87% at Junction J-02 (EXPRESS_201 / LOCAL_101)',
        location: 'Section B / Junction J-02',
        trainId: 'EXPRESS_201',
        secondaryTrainId: 'LOCAL_101',
        section: 'SECTION_B',
        timestamp: '14:27:04',
        description: 'Predictive conflict model maintains hold on LOCAL_101 while safety envelope is cleared.',
        impact: 'Continued hold on secondary train movements.',
        recommendedAction: 'Maintain red signal at Station B P1.'
      },
      {
        id: 'ALT-104',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'Station B Platform 1 Dwell Exceeded (+8 min)',
        event: 'LOCAL_101 delay detected (+8 min)',
        location: 'Station B / Platform 1',
        trainId: 'LOCAL_101',
        section: 'SECTION_B',
        timestamp: '14:21:30',
        description: 'LOCAL_101 held at Station B Platform 1.',
        impact: 'Corridor hold active.',
        recommendedAction: 'Hold at Station B P1.'
      }
    ],
    locoAlerts: [
      {
        id: 'CAB-ALT-05-VISION',
        severity: 'WARNING',
        severityLevel: 'warning',
        title: 'AI VISION HAZARD: Obstacle Detected on Track 1 (KM 23.1)',
        location: 'Section B / KM 23.1 (Ahead)',
        timestamp: '14:29:10',
        description: 'Camera telemetry detected track obstacle (96% confidence). Automated speed ceiling clamped to 40 km/h. Manual brake override armed.'
      },
      {
        id: 'CAB-ALT-04',
        severity: 'PREDICTION',
        severityLevel: 'prediction',
        title: 'Signal SIG-C1 Displaying RED (Safety Hold)',
        location: 'Station C North Approach (KM 23.4)',
        timestamp: '14:29:10',
        description: 'End of Authority shortened to KM 23.0 due to vision event buffer.'
      }
    ]
  }
};
