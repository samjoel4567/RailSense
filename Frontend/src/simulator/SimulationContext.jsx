import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { simulationEngine } from './simulationEngine';
import { STATIONS, STATION_CHAIN, SECTIONS } from './networkModel';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [simState, setSimState] = useState(() => simulationEngine.state);
  const [simStatus, setSimStatus] = useState(() => simulationEngine.getSimulationStatus());

  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe((newState) => {
      setSimState(newState);
      setSimStatus(simulationEngine.getSimulationStatus());
    });
    return () => unsubscribe();
  }, []);

  // ── Controls exposed to all pages ──────────────────────
  const controls = useMemo(() => ({
    // Playback
    play:              () => simulationEngine.play(),
    pause:             () => simulationEngine.pause(),
    togglePlayPause:   () => simulationEngine.togglePlayPause(),
    reset:             () => simulationEngine.reset(),
    nextPhase:         () => simulationEngine.nextPhase(),
    prevPhase:         () => simulationEngine.prevPhase(),
    setPhase:          (p) => simulationEngine.setPhase(p),
    toggleAutoPlay:    () => simulationEngine.toggleAutoPlay(),
    setSpeed:          (s) => simulationEngine.setSpeed(s),

    // Loco Pilot controls
    locoPilotDecide:   (trainId, decision) => simulationEngine.locoPilotDecide(trainId, decision),
    requestDeparture:  (tId) => simulationEngine.requestDeparture(tId),
    keepWaiting:       (tId) => simulationEngine.keepWaiting(tId),
    confirmDepart:     (tId) => simulationEngine.confirmDepart(tId),
    setActiveCab:      (tId) => simulationEngine.setActiveCab(tId),

    // Scenario controls
    applyScenario:     (trainId, paramChange) => simulationEngine.applyScenario(trainId, paramChange),
    resetToBaseline:   () => simulationEngine.resetToBaseline(),
    modifyTrain:       (trainId, params) => simulationEngine.modifyTrain(trainId, params),
    getImpactAnalysis: (trainId, paramChange) => simulationEngine.getImpactAnalysis(trainId, paramChange),
    getPrediction:     (trainId) => simulationEngine.getPrediction(trainId),
  }), []);

  return (
    <SimulationContext.Provider value={{ state: simState, status: simStatus, controls }}>
      {children}
    </SimulationContext.Provider>
  );
}

// ── Base hook ─────────────────────────────────────────────
export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within a SimulationProvider');
  return ctx;
}

// ── Controls shortcut ──────────────────────────────────────
export function useSimulationControls() {
  const { status, controls } = useSimulation();
  return { status, ...controls };
}

// ─────────────────────────────────────────────────────────
// PAGE-SPECIFIC HOOKS (all derived from the same state)
// ─────────────────────────────────────────────────────────

/**
 * Simulator page: full network state
 */
export function useNetworkState() {
  const { state } = useSimulation();
  return {
    network:   state.network,
    trains:    state.trains,
    allTrains: state.allTrains || [],
    alerts:    state.alerts || [],
    conflicts: state.conflicts || [],
    risk: {
      score:    state.networkMetrics?.networkRisk ?? state.network?.networkRiskScore ?? 0,
      category: state.networkMetrics?.riskCategory ?? state.network?.riskCategory ?? 'NOMINAL',
      breakdown: state.network?.riskBreakdown
    }
  };
}

/**
 * Network metrics for NetworkMetricsBar
 */
export function useNetworkMetrics() {
  const { state } = useSimulation();
  return {
    metrics:   state.networkMetrics || {},
    conflicts: state.conflicts || [],
    allTrains: state.allTrains || []
  };
}

/**
 * Train inspector for a specific train ID
 */
export function useTrainInspector(trainId) {
  const { state } = useSimulation();
  const allTrains = state.allTrains || [];
  const train = trainId ? allTrains.find(t => t.id === trainId) : null;
  const affectingTrains = train ? allTrains.filter(t => (train.affectedBy || []).includes(t.id)) : [];
  const affectedTrains  = train ? allTrains.filter(t => (train.affecting || []).includes(t.id)) : [];
  return { train, affectingTrains, affectedTrains };
}

/**
 * Impact analysis for scenario panel
 */
export function useImpactAnalysis() {
  const { state, controls } = useSimulation();
  return {
    activeScenario:  state.activeScenario,
    impactReport:    state.activeScenario?.impactReport || null,
    baselineSnapshot: state.baselineSnapshot,
    applyScenario:   controls.applyScenario,
    resetToBaseline: controls.resetToBaseline,
    getImpactAnalysis: controls.getImpactAnalysis
  };
}

/**
 * LOCO PILOT hook — reads the currently active cab train from shared state.
 * All data comes from allTrains[activeCabTrainId].
 */
export function useLocoPilotState() {
  const { state, controls } = useSimulation();
  const allTrains = state.allTrains || [];
  const activeCabId = state.activeCabTrainId || 'LOCAL_101';
  const cabTrain = allTrains.find(t => t.id === activeCabId) || null;

  // Traffic ahead: trains that are affecting this cab train
  const trafficAhead = cabTrain
    ? allTrains.filter(t =>
        t.id !== activeCabId &&
        !t.hasReachedDestination &&
        t.direction === cabTrain.direction &&
        t.currentSection === cabTrain.currentSection &&
        (cabTrain.direction === 'SOUTHBOUND'
          ? t.positionPct > cabTrain.positionPct
          : t.positionPct < cabTrain.positionPct)
      ).slice(0, 3)
    : [];

  // Signal for current section
  const signalStates = state.signalStates || {};
  const currentSignal = cabTrain?.currentSection
    ? signalStates[cabTrain.currentSection]?.entry
    : null;

  return {
    // The full cab train object (live from shared state)
    cabTrain,
    activeCabId,
    allTrains,

    // Derived fields for UI
    locoPilotData: state.locoPilotData || {},  // legacy backward compat
    trafficAhead,
    currentSignal,
    signalStates,

    // Loco Pilot decision state
    decision: state.locoPilotDecisions?.[activeCabId] || 'IDLE',
    prediction: state.cabPrediction || null,

    // Controls
    locoPilotDecide: controls.locoPilotDecide,
    requestDeparture: controls.requestDeparture,
    keepWaiting:      controls.keepWaiting,
    confirmDepart:    controls.confirmDepart,
    setActiveCab:     controls.setActiveCab,

    departureEvaluation: state.departureEvaluation || {}
  };
}

/**
 * STATION MASTER hook — live platform + arrival/departure data for a selected station.
 */
export function useStationMasterState() {
  const { state } = useSimulation();
  return {
    stationData: state.stationData || {}  // legacy
  };
}

export function useStationMasterLive(stationId) {
  const { state } = useSimulation();
  const allTrains    = state.allTrains || [];
  const stationStates = state.stationStates || {};
  const signalStates  = state.signalStates || {};

  const stationState = stationId ? stationStates[stationId] : null;
  const stationSignal = stationId ? signalStates[stationId] : null;

  // Trains approaching this station (destination = stationId, positionPct > 60)
  const approaching = allTrains.filter(t =>
    !t.isDwelling &&
    !t.hasReachedDestination &&
    t.destination === stationId &&
    t.positionPct > 50
  ).sort((a, b) => (a.etaSeconds || 9999) - (b.etaSeconds || 9999));

  // Trains currently at this station
  const atStation = allTrains.filter(t =>
    t.isDwelling && t.currentStation === stationId
  );

  // All trains that will pass through (currently en route with this as intermediate or destination)
  const arrivals = allTrains.filter(t => {
    if (t.hasReachedDestination) return false;
    if (t.currentStation === stationId) return false; // already here
    if (t.destination === stationId) return true;
    const route = t.route || [];
    // Check if this station is in the train's upcoming route
    const curIdx = route.indexOf(t.currentSection);
    if (curIdx === -1) return false;
    // Rough check: station km post between current and destination
    const st = STATIONS[stationId];
    if (!st) return false;
    if (t.isDwelling) return false;
    const sec = SECTIONS[t.currentSection];
    if (!sec) return false;
    return Math.abs(st.kmPost - (t.positionKm || 0)) < 80; // within 80 km
  }).slice(0, 8);

  // Platform status summary
  const platforms = stationState?.platforms
    ? Object.entries(stationState.platforms).map(([platId, plat]) => {
        const occupyingTrain = allTrains.find(t => t.id === plat.trainId);
        const reservedTrain  = allTrains.find(t => t.id === plat.reservedForTrainId);
        const signal = stationSignal?.platformSignals?.[platId] || 'GREEN';
        return {
          id: platId,
          state: plat.state || 'CLEAR',
          trainId: plat.trainId || plat.reservedForTrainId || null,
          train: occupyingTrain || reservedTrain || null,
          signal,
          eta: (occupyingTrain || reservedTrain)?.etaAbsolute || null,
          dwellSec: occupyingTrain?.dwellTime || 0
        };
      })
    : [];

  return {
    stationId,
    stationState,
    platforms,
    approaching,
    atStation,
    arrivals,
    signalStates,
    allTrains
  };
}
