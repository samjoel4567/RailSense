import React, { createContext, useContext, useState, useEffect } from 'react';
import { simulationEngine } from './simulationEngine';

const SimulationContext = createContext(null);

export function SimulationProvider({ children }) {
  const [simState, setSimState] = useState(simulationEngine.state);
  const [simStatus, setSimStatus] = useState(simulationEngine.getSimulationStatus());

  useEffect(() => {
    const unsubscribe = simulationEngine.subscribe((newState) => {
      setSimState(newState);
      setSimStatus(simulationEngine.getSimulationStatus());
    });

    return () => unsubscribe();
  }, []);

  const controls = {
    play: () => simulationEngine.play(),
    pause: () => simulationEngine.pause(),
    togglePlayPause: () => simulationEngine.togglePlayPause(),
    reset: () => simulationEngine.reset(),
    nextPhase: () => simulationEngine.nextPhase(),
    prevPhase: () => simulationEngine.prevPhase(),
    setPhase: (p) => simulationEngine.setPhase(p),
    toggleAutoPlay: () => simulationEngine.toggleAutoPlay(),
    setSpeed: (s) => simulationEngine.setSpeed(s),
    requestDeparture: (tId) => simulationEngine.requestDeparture(tId),
    keepWaiting: (tId) => simulationEngine.keepWaiting(tId),
    confirmDepart: (tId) => simulationEngine.confirmDepart(tId),
    setActiveCab: (tId) => simulationEngine.setActiveCab(tId)
  };

  return (
    <SimulationContext.Provider value={{ state: simState, status: simStatus, controls }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}

export function useNetworkState() {
  const { state } = useSimulation();
  return {
    network: state.network,
    trains: state.trains,
    alerts: state.alerts,
    risk: {
      score: state.network.networkRiskScore,
      category: state.network.riskCategory,
      breakdown: state.network.riskBreakdown
    }
  };
}

export function useStationMasterState() {
  const { state } = useSimulation();
  return {
    stationData: state.stationData,
    alerts: state.stationData.alerts
  };
}

export function useLocoPilotState() {
  const { state, controls } = useSimulation();
  return {
    locoPilotData: state.locoPilotData,
    departureEvaluation: state.departureEvaluation,
    requestDeparture: controls.requestDeparture,
    keepWaiting: controls.keepWaiting,
    confirmDepart: controls.confirmDepart,
    setActiveCab: controls.setActiveCab
  };
}

export function useSimulationControls() {
  const { status, controls } = useSimulation();
  return {
    status,
    ...controls
  };
}
