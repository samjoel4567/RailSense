/**
 * Mock Station Master Dataset (Station B - Central Junction)
 * Decoupled from presentation components for future backend / WebSocket integration.
 */

export const mockStationData = {
  stationId: 'STATION_B',
  stationName: 'Station B',
  junctionName: 'Central Junction Interlocking',
  stationCode: 'STA-B',
  systemStatus: 'OPERATIONAL',
  interlockingStatus: 'SIL-4 DETERMINISTIC LOCK ACTIVE',
  stationMasterOnDuty: 'SM-8842 // DESK 02',
  
  summary: {
    platformsCount: 3,
    activePlatformsCount: 3,
    scheduledArrivals: 4,
    scheduledDepartures: 4,
    delayedTrainsCount: 1,
    stationRiskScore: 18,
    riskCategory: 'NORMAL',
    occupancyRate: '33% (1/3 Active)'
  },

  platforms: [
    {
      id: 'PLATFORM_1',
      number: '1',
      name: 'Platform 1 (Main Down)',
      lengthMeters: 340,
      assignedTrack: 'Track 1 (Southbound)',
      occupancyState: 'OCCUPIED', // 'OCCUPIED' | 'RESERVED' | 'CLEAR'
      currentTrainId: 'LOCAL_101',
      trainType: 'LOCAL',
      destination: 'Station C',
      signalId: 'SIG-B1',
      signalAspect: 'AMBER',
      dwellTimeCurrentSec: 240,
      dwellTimeScheduledSec: 90,
      statusNote: 'BOARDING // DWELL VARIANCE (+8m)'
    },
    {
      id: 'PLATFORM_2',
      number: '2',
      name: 'Platform 2 (Main Up)',
      lengthMeters: 380,
      assignedTrack: 'Track 2 (Northbound)',
      occupancyState: 'RESERVED',
      currentTrainId: null,
      approachingTrainId: 'EXPRESS_201',
      trainType: 'EXPRESS',
      destination: 'Station C',
      signalId: 'SIG-B2',
      signalAspect: 'GREEN',
      dwellTimeCurrentSec: 0,
      dwellTimeScheduledSec: 60,
      statusNote: 'CLEAR // EXPRESS_201 APPROACHING (4 MIN)'
    },
    {
      id: 'PLATFORM_3',
      number: '3',
      name: 'Platform 3 (Loop Track / Relief)',
      lengthMeters: 280,
      assignedTrack: 'Track 3 (Loop)',
      occupancyState: 'CLEAR',
      currentTrainId: null,
      approachingTrainId: null,
      trainType: null,
      destination: 'Standby',
      signalId: 'SIG-B3',
      signalAspect: 'RED',
      dwellTimeCurrentSec: 0,
      dwellTimeScheduledSec: 0,
      statusNote: 'AVAILABLE // STANDBY FOR FREIGHT 404'
    }
  ],

  arrivalsDepartures: [
    {
      trainId: 'LOCAL_101',
      platform: 'Platform 1',
      platformNum: '1',
      direction: 'SOUTHBOUND',
      directionArrow: '↓',
      type: 'LOCAL',
      eta: '14:32',
      scheduledTime: '14:24',
      delay: '+8 min',
      delayMinutes: 8,
      status: 'DELAYED',
      statusCategory: 'warning',
      actionRequired: 'Accelerate dwell closure // Clear track 1'
    },
    {
      trainId: 'EXPRESS_201',
      platform: 'Platform 2',
      platformNum: '2',
      direction: 'SOUTHBOUND',
      directionArrow: '↓',
      type: 'EXPRESS',
      eta: '14:28',
      scheduledTime: '14:28',
      delay: '0 min',
      delayMinutes: 0,
      status: 'ON TIME',
      statusCategory: 'normal',
      actionRequired: 'Route verified // Green aspect SIG-B2'
    },
    {
      trainId: 'LOCAL_102',
      platform: 'Platform 2',
      platformNum: '2',
      direction: 'NORTHBOUND',
      directionArrow: '↑',
      type: 'LOCAL',
      eta: '14:41',
      scheduledTime: '14:39',
      delay: '+2 min',
      delayMinutes: 2,
      status: 'MINOR DELAY',
      statusCategory: 'caution',
      actionRequired: 'Nominal platform slot allocated'
    },
    {
      trainId: 'EXPRESS_202',
      platform: 'Platform 1',
      platformNum: '1',
      direction: 'NORTHBOUND',
      directionArrow: '↑',
      type: 'EXPRESS',
      eta: '14:47',
      scheduledTime: '14:47',
      delay: '0 min',
      delayMinutes: 0,
      status: 'ON TIME',
      statusCategory: 'normal',
      actionRequired: 'Approach interlocking clear'
    }
  ],

  alerts: [
    {
      id: 'STA-ALT-01',
      severity: 'WARNING',
      severityLevel: 'warning',
      title: 'Platform 1 Passenger Dwell Variance',
      location: 'Platform 1 / Track 1',
      trainId: 'LOCAL_101',
      timestamp: '14:27:30',
      description: 'LOCAL_101 has exceeded scheduled dwell time by 150 seconds. Passenger crowding on door set 3.',
      recommendation: 'Station master chime advisory: initiate door closing protocol.'
    },
    {
      id: 'STA-ALT-02',
      severity: 'PREDICTION',
      severityLevel: 'prediction',
      title: 'Interlocking Junction Switch J-02 Convergence',
      location: 'Junction B-2 South Throat',
      trainId: 'LOCAL_101 / EXPRESS_201',
      timestamp: '14:27:04',
      description: '87% probability of route crossing hold if LOCAL_101 departure is delayed past 14:31.',
      recommendation: 'Pre-set diversion route or hold EXPRESS_201 at signal SIG-B2.'
    },
    {
      id: 'STA-ALT-03',
      severity: 'NORMAL',
      severityLevel: 'normal',
      title: 'Platform 2 & 3 Traction Power & Balise Synchronized',
      location: 'Catenary Sector B-Sub',
      trainId: null,
      timestamp: '14:28:00',
      description: 'Traction voltage 25.2 kV steady. European Balise Transmission loop verified with zero packet error.',
      recommendation: 'Nominal operations maintained.'
    }
  ]
};
