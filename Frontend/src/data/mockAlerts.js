/**
 * Mock Active Operational Alerts Dataset
 * Structured for dispatch decision support.
 */

export const mockAlerts = [
  {
    id: 'ALT-104',
    severity: 'WARNING',
    severityLevel: 'warning', // 'warning' | 'prediction' | 'normal'
    event: 'LOCAL_101 delay detected (+8 min)',
    trainId: 'LOCAL_101',
    section: 'SECTION_B',
    timestamp: '14:26:18',
    detail: 'Train running 8 minutes behind schedule due to dwell time variance at Station A.',
    impact: 'Potential headway compression with EXPRESS_201 at Junction B-2.',
    recommendedAction: 'Apply 3-minute speed regulation advisory to trailing corridor.'
  },
  {
    id: 'ALT-105',
    severity: 'PREDICTION',
    severityLevel: 'prediction',
    event: 'Conflict probability 87% at Junction B-2',
    trainId: 'LOCAL_101',
    secondaryTrainId: 'EXPRESS_201',
    section: 'SECTION_B',
    timestamp: '14:27:04',
    detail: 'Predictive horizon models junction conflict between LOCAL_101 and EXPRESS_201 in 6.2 minutes.',
    impact: 'Estimated 4-minute cascading delay if interlocking route is not pre-cleared.',
    recommendedAction: 'Hold EXPRESS_201 at Station B platform signal SIG-B2 for 90 seconds.'
  },
  {
    id: 'ALT-106',
    severity: 'NORMAL',
    severityLevel: 'normal',
    event: 'No other critical events across Corridor Alpha',
    trainId: null,
    section: 'SECTION_A',
    timestamp: '14:28:00',
    detail: 'Sections A & C reporting nominal track circuit voltage and zero balise packet loss.',
    impact: 'Normal operational limits maintained.',
    recommendedAction: 'Maintain current dispatch timetable.'
  }
];
