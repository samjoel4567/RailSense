/**
 * Mock Section Corridor Specifications
 * Models Section B between Station B and Station C.
 */

export const mockSectionB = {
  id: 'SECTION_B',
  name: 'Section B (Central-South Mainline)',
  originStationId: 'STATION_B',
  destinationStationId: 'STATION_C',
  lengthKm: 24.8,
  speedLimitMax: 140,
  speedLimitRestricted: 100,
  tracksCount: 2,
  powerSupply: '25kV AC Overhead Catenary (Nominal 25.2kV)',
  signalingSystem: 'ETCS Level 2 / ERTMS Baseline 3',
  blockStatus: 'INTERLOCKING AUTOMATIC BLOCK',
  
  interlockingPoints: [
    {
      id: 'SW-B1',
      name: 'Station B Throat Switch 01',
      state: 'NORMAL (LOCKED)',
      position: 'STRAIGHT TO TRACK 1'
    },
    {
      id: 'SW-J02',
      name: 'Junction B-2 High-Speed Crossover',
      state: 'REVERSED (ADVISORY HOLD)',
      position: 'CROSSOVER 1 -> 2'
    },
    {
      id: 'SW-C1',
      name: 'Station C North Approach Switch',
      state: 'NORMAL (LOCKED)',
      position: 'STRAIGHT TO PLATFORM 1'
    }
  ]
};
