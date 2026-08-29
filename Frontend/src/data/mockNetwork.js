/**
 * Mock Railway Network Topology & Risk Metric Dataset
 */

export const mockNetwork = {
  status: 'OPERATIONAL',
  systemMode: 'AUTOMATIC DISPATCH ADVISORY (ADA-SIL4)',
  networkRiskScore: 23,
  riskCategory: 'NORMAL',
  activeTrainsCount: 4,
  delayedTrainsCount: 1,
  activeAlertsCount: 2,
  
  stations: [
    {
      id: 'STATION_A',
      name: 'Station A (North Terminal)',
      shortCode: 'STA-A',
      platforms: ['Plat 1', 'Plat 2'],
      tracks: 2,
      x: 80,
      y: 190
    },
    {
      id: 'STATION_B',
      name: 'Station B (Central Junction)',
      shortCode: 'STA-B',
      platforms: ['Plat 1', 'Plat 2', 'Plat 3'],
      tracks: 2,
      x: 480,
      y: 190
    },
    {
      id: 'STATION_C',
      name: 'Station C (South Hub)',
      shortCode: 'STA-C',
      platforms: ['Plat 1', 'Plat 2'],
      tracks: 2,
      x: 880,
      y: 190
    }
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
      track2Occupied: true, // LOCAL_102
      occupancyStatus: 'OCCUPIED (1 TRAIN)',
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
      maxSpeed: 140,
      track1Occupied: true, // LOCAL_101
      track2Occupied: false,
      occupancyStatus: 'OCCUPIED (1 TRAIN - DELAYED)',
      signals: [
        { id: 'SIG_B1', aspect: 'AMBER', track: 'Track 1', statusText: 'CAUTION (APPROACH)' },
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
      track1Occupied: true, // EXPRESS_201
      track2Occupied: true, // EXPRESS_202
      occupancyStatus: 'OCCUPIED (2 TRAINS)',
      signals: [
        { id: 'SIG_C1', aspect: 'GREEN', track: 'Track 1', statusText: 'CLEAR' },
        { id: 'SIG_C2', aspect: 'GREEN', track: 'Track 2', statusText: 'CLEAR' }
      ]
    }
  ],

  riskBreakdown: [
    { factor: 'Headway Compression (Section B)', weightPct: 14, severity: 'caution' },
    { factor: 'Station A Dwell Delay Residuals', weightPct: 6, severity: 'normal' },
    { factor: 'Switch J-02 Telemetry Drift', weightPct: 3, severity: 'normal' }
  ]
};
