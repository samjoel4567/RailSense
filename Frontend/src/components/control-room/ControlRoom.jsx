import React, { useState } from 'react';
import ControlRoomHeader from './ControlRoomHeader';
import NetworkSummary from './NetworkSummary';
import RailwayMap from './RailwayMap';
import TrainOperations from './TrainOperations';
import ActiveAlerts from './ActiveAlerts';
import RiskIndicator from './RiskIndicator';
import { useNetworkState } from '../../simulator/SimulationContext';

export default function ControlRoom() {
  const { network, trains, alerts, risk } = useNetworkState();

  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Interaction handlers
  const handleSelectTrain = (trainId) => {
    if (selectedTrainId === trainId) {
      // Toggle off if already selected
      setSelectedTrainId(null);
      setSelectedSectionId(null);
    } else {
      setSelectedTrainId(trainId);
      const train = trains.find(t => t.id === trainId);
      if (train) {
        setSelectedSectionId(train.section);
      }
      // If there's an alert associated with this train, select it
      const matchingAlert = alerts.find(a => a.trainId === trainId);
      setSelectedAlertId(matchingAlert ? matchingAlert.id : null);
    }
  };

  const handleSelectSection = (sectionId) => {
    if (selectedSectionId === sectionId && !selectedTrainId) {
      setSelectedSectionId(null);
    } else {
      setSelectedSectionId(sectionId);
      const trainInSection = trains.find(t => t.section === sectionId);
      setSelectedTrainId(trainInSection ? trainInSection.id : null);
    }
  };

  const handleSelectAlert = (alert) => {
    if (selectedAlertId === alert.id) {
      setSelectedAlertId(null);
      setSelectedTrainId(null);
      setSelectedSectionId(null);
    } else {
      setSelectedAlertId(alert.id);
      if (alert.trainId) {
        setSelectedTrainId(alert.trainId);
      }
      if (alert.section) {
        setSelectedSectionId(alert.section);
      }
    }
  };

  const handleResetSelection = () => {
    setSelectedTrainId(null);
    setSelectedSectionId(null);
    setSelectedAlertId(null);
  };

  return (
    <div className="control-room-page">
      <div className="cr-page-container">
        
        {/* 1. Page Header */}
        <ControlRoomHeader 
          onResetSelection={handleResetSelection}
          selectedTrainId={selectedTrainId}
        />

        {/* 2. Operational Network Summary */}
        <NetworkSummary 
          activeTrains={network.activeTrainsCount}
          delayedTrains={network.delayedTrainsCount}
          activeAlerts={network.activeAlertsCount}
          networkRisk={network.networkRiskScore}
          selectedTrainId={selectedTrainId}
          selectedSectionId={selectedSectionId}
        />

        {/* 3. Primary Railway Network Map */}
        <RailwayMap 
          trains={trains}
          stations={network.stations}
          sections={network.sections}
          selectedTrainId={selectedTrainId}
          selectedSectionId={selectedSectionId}
          onSelectTrain={handleSelectTrain}
          onSelectSection={handleSelectSection}
        />

        {/* 4. Lower Operational Split: Train Operations Table + Alerts & Risk Panel */}
        <div className="cr-bottom-split-grid">
          
          {/* Left Column: Train Operations Table */}
          <div className="cr-split-left">
            <TrainOperations 
              trains={trains}
              selectedTrainId={selectedTrainId}
              onSelectTrain={handleSelectTrain}
            />
          </div>

          {/* Right Column: Active Alerts & Network Risk Indicator */}
          <div className="cr-split-right">
            <ActiveAlerts 
              alerts={alerts}
              selectedAlertId={selectedAlertId}
              onSelectAlert={handleSelectAlert}
            />

            <RiskIndicator 
              riskScore={network.networkRiskScore}
              riskCategory={network.riskCategory}
              breakdown={network.riskBreakdown}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
