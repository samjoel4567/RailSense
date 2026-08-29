/**
 * RAIL//AI Simulation Constants
 * Deterministic phase definitions and timing parameters.
 */

export const SIMULATION_PHASES = {
  1: {
    id: 1,
    key: 'NORMAL',
    name: 'PHASE 1 — NORMAL OPERATIONS',
    shortTitle: 'NORMAL OPERATIONS',
    description: 'Corridor Alpha nominal flow: Station B to Station C active transit with scheduled spacing and clear routes.',
    durationSeconds: 15,
    baseTime: '14:20:00'
  },
  2: {
    id: 2,
    key: 'LOCAL_DELAY',
    name: 'PHASE 2 — LOCAL TRAIN DELAY',
    shortTitle: 'LOCAL TRAIN DELAY',
    description: 'LOCAL_101 station dwell variance (+8 min) at Station B Platform 1 holding outbound corridor slot.',
    durationSeconds: 15,
    baseTime: '14:21:30'
  },
  3: {
    id: 3,
    key: 'EXPRESS_APPROACH',
    name: 'PHASE 3 — EXPRESS APPROACHES',
    shortTitle: 'EXPRESS APPROACHES',
    description: 'EXPRESS_201 traverses Section B toward Station C; decelerates smoothly into approach interlocking.',
    durationSeconds: 15,
    baseTime: '14:24:00'
  },
  4: {
    id: 4,
    key: 'PREDICTED_CONFLICT',
    name: 'PHASE 4 — PREDICTED CONFLICT',
    shortTitle: 'PREDICTED CONFLICT',
    description: 'Predictive interlocking model detects 87% conflict probability at Junction J-02 between EXPRESS_201 & LOCAL_101.',
    durationSeconds: 15,
    baseTime: '14:27:04'
  },
  5: {
    id: 5,
    key: 'SAFETY_VISION_EVENT',
    name: 'PHASE 5 — SAFETY / VISION EVENT',
    shortTitle: 'SAFETY / VISION EVENT',
    description: 'AI vision pipeline detects track hazard/obstacle on Section B corridor (96% confidence); automated safety alerts trigger.',
    durationSeconds: 15,
    baseTime: '14:29:10'
  }
};

export const INITIAL_SIM_TIME = '14:20:00';
export const TOTAL_PHASES = 5;
