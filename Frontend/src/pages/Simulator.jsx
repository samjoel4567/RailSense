import React, { useState } from 'react';
import { useSimulation, useImpactAnalysis } from '../simulator/SimulationContext';
import SimulatorHeader from '../components/simulator/SimulatorHeader';
import SimulatorPhaseNav from '../components/simulator/SimulatorPhaseNav';
import SimulatorTimeline from '../components/simulator/SimulatorTimeline';
import SimulatorEventLog from '../components/simulator/SimulatorEventLog';
import SimulatorLegend from '../components/simulator/SimulatorLegend';

// New multi-train components
import NetworkMetricsBar from '../components/simulator/NetworkMetricsBar';
import NetworkTopologyDiagram from '../components/simulator/NetworkTopologyDiagram';
import TrainInspectorPanel from '../components/simulator/TrainInspectorPanel';
import ImpactAnalysisPanel from '../components/simulator/ImpactAnalysisPanel';

import './Simulator.css';

export default function Simulator() {
  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const { activeScenario, impactReport } = useImpactAnalysis();
  const { controls } = useSimulation();

  const affectedTrainIds = impactReport?.affectedTrains || [];

  function handleSelectTrain(train) {
    if (!train) return;
    // train may be a full object or just a string ID
    const id = typeof train === 'string' ? train : train.id;
    setSelectedTrainId(id);
  }

  function handleCloseInspector() {
    setSelectedTrainId(null);
  }

  function handleApplyScenario(change) {
    // Inspector already called controls.applyScenario
    // We just keep the panel open for before/after view
  }

  return (
    <div className="simulator-page">
      <div className="sim-page-container">

        {/* 1. Simulator Header (preserved) */}
        <SimulatorHeader />

        {/* 2. Phase Navigation (preserved, now controls 30-train network) */}
        <SimulatorPhaseNav />

        {/* 3. Live Network Metrics Bar (replaces SimulatorSummaryBar) */}
        <NetworkMetricsBar />

        {/* 4. Main Layout: Topology + Inspector/Impact side panel */}
        <div className={`sim-main-layout ${selectedTrainId || activeScenario ? 'layout-with-panel' : ''}`}>

          {/* Left: Network Topology */}
          <div className="sim-topology-area">
            <NetworkTopologyDiagram
              onSelectTrain={handleSelectTrain}
              selectedTrainId={selectedTrainId}
              affectedTrainIds={affectedTrainIds}
            />
          </div>

          {/* Right: Train Inspector + Impact Panel (slide in when train selected or scenario active) */}
          {(selectedTrainId || activeScenario) && (
            <div className="sim-inspector-area">
              {selectedTrainId && (
                <TrainInspectorPanel
                  trainId={selectedTrainId}
                  onClose={handleCloseInspector}
                  onApplyScenario={handleApplyScenario}
                />
              )}
              {activeScenario && (
                <ImpactAnalysisPanel
                  onSelectTrain={handleSelectTrain}
                />
              )}
            </div>
          )}
        </div>

        {/* 5. Phase Timeline (preserved) */}
        <SimulatorTimeline />

        {/* 6. Bottom Split: Event Log + Legend */}
        <div className="sim-bottom-split-grid">
          <div className="sim-split-left">
            <SimulatorEventLog />
          </div>
          <div className="sim-split-right">
            <SimulatorLegend />
          </div>
        </div>

      </div>
    </div>
  );
}
