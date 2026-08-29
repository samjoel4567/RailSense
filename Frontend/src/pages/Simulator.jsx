import React, { useState } from 'react';
import SimulatorHeader from '../components/simulator/SimulatorHeader';
import SimulatorPhaseNav from '../components/simulator/SimulatorPhaseNav';
import SimulatorSummaryBar from '../components/simulator/SimulatorSummaryBar';
import RailwayCorridorDiagram from '../components/simulator/RailwayCorridorDiagram';
import SimulatorTimeline from '../components/simulator/SimulatorTimeline';
import SimulatorEventLog from '../components/simulator/SimulatorEventLog';
import SimulatorCorridorStatus from '../components/simulator/SimulatorCorridorStatus';
import SimulatorLegend from '../components/simulator/SimulatorLegend';
import SimulatorInspectModal from '../components/simulator/SimulatorInspectModal';
import './Simulator.css';

export default function Simulator() {
  const [selectedEntity, setSelectedEntity] = useState(null);

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
  };

  const handleCloseModal = () => {
    setSelectedEntity(null);
  };

  return (
    <div className="simulator-page">
      <div className="sim-page-container">
        
        {/* 1. Simulator Header */}
        <SimulatorHeader />

        {/* 2. Phase Navigation Bar (5 Phases) */}
        <SimulatorPhaseNav />

        {/* 3. Live Simulation Summary Row */}
        <SimulatorSummaryBar />

        {/* 4. MAIN RAILWAY CORRIDOR — Horizontal Operational Track Diagram */}
        <RailwayCorridorDiagram onSelectEntity={handleSelectEntity} />

        {/* 5. Phase Timeline */}
        <SimulatorTimeline />

        {/* 6. Lower Operational Split: Event Log + Corridor Status & Legend */}
        <div className="sim-bottom-split-grid">
          
          {/* Left Column: Chronological Event Log */}
          <div className="sim-split-left">
            <SimulatorEventLog />
          </div>

          {/* Right Column: Corridor Telemetry Status & Legend */}
          <div className="sim-split-right">
            <SimulatorCorridorStatus />
            <SimulatorLegend />
          </div>

        </div>

        {/* Inspection Details Modal / Slide-in */}
        {selectedEntity && (
          <SimulatorInspectModal entity={selectedEntity} onClose={handleCloseModal} />
        )}

      </div>
    </div>
  );
}
