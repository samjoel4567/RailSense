/**
 * Mock Trains Dataset
 * Used by Control Room components. Can be directly replaced by backend / WebSocket feeds.
 */

export const mockTrains = [
  {
    id: 'LOCAL_101',
    name: 'Local Passenger 101',
    type: 'LOCAL',
    section: 'SECTION_B',
    track: 'Track 1 (Down)',
    direction: 'SOUTHBOUND',
    directionArrow: '↓',
    speed: 82,
    speedLimit: 100,
    delay: 8,
    delayFormatted: '+8 min',
    eta: '14:32',
    status: 'DELAYED',
    statusCategory: 'warning', // 'normal' | 'warning' | 'caution'
    origin: 'Station A',
    destination: 'Station C',
    progressPct: 62, // Position along Section B
    coordinates: { x: 390, y: 155 },
    axles: 16,
    weightTons: 280,
    brakeProfile: 'RESTRICTED'
  },
  {
    id: 'EXPRESS_201',
    name: 'Intercity Express 201',
    type: 'EXPRESS',
    section: 'SECTION_C',
    track: 'Track 1 (Down)',
    direction: 'SOUTHBOUND',
    directionArrow: '↓',
    speed: 118,
    speedLimit: 140,
    delay: 0,
    delayFormatted: '0 min',
    eta: '14:28',
    status: 'ON TIME',
    statusCategory: 'normal',
    origin: 'Station B',
    destination: 'Station C',
    progressPct: 35, // Position along Section C
    coordinates: { x: 620, y: 155 },
    axles: 24,
    weightTons: 420,
    brakeProfile: 'NOMINAL'
  },
  {
    id: 'LOCAL_102',
    name: 'Regional Commuter 102',
    type: 'LOCAL',
    section: 'SECTION_A',
    track: 'Track 2 (Up)',
    direction: 'NORTHBOUND',
    directionArrow: '↑',
    speed: 76,
    speedLimit: 90,
    delay: 2,
    delayFormatted: '+2 min',
    eta: '14:41',
    status: 'MINOR DELAY',
    statusCategory: 'caution',
    origin: 'Station B',
    destination: 'Station A',
    progressPct: 40, // Position along Section A (Reverse)
    coordinates: { x: 180, y: 225 },
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
    speed: 120,
    speedLimit: 140,
    delay: 0,
    delayFormatted: '0 min',
    eta: '14:47',
    status: 'ON TIME',
    statusCategory: 'normal',
    origin: 'Station C',
    destination: 'Station A',
    progressPct: 80, // Position along Section C
    coordinates: { x: 740, y: 225 },
    axles: 20,
    weightTons: 390,
    brakeProfile: 'NOMINAL'
  }
];
