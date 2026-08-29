import React, { useState } from 'react';
import ControlRoomHeader from './ControlRoomHeader';
import NetworkSummary from './NetworkSummary';
import RailwayMap from './RailwayMap';
import TrainOperations from './TrainOperations';
import ActiveAlerts from './ActiveAlerts';
import RiskIndicator from './RiskIndicator';

import { mockTrains } from '../../data/mockTrains';
import { mockAlerts } from '../../data/mockAlerts';
import { mockNetwork } from '../../data/mockNetwork';

export default function ControlRoom() {
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
      const train = mockTrains.find(t => t.id === trainId);
      if (train) {
        setSelectedSectionId(train.section);
      }
      // If there's an alert associated with this train, select it
      const matchingAlert = mockAlerts.find(a => a.trainId === trainId);
      setSelectedAlertId(matchingAlert ? matchingAlert.id : null);
    }
  };

  const handleSelectSection = (sectionId) => {
    if (selectedSectionId === sectionId && !selectedTrainId) {
      setSelectedSectionId(null);
    } else {
      setSelectedSectionId(sectionId);
      const trainInSection = mockTrains.find(t => t.section === sectionId);
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
          activeTrains={mockNetwork.activeTrainsCount}
          delayedTrains={mockNetwork.delayedTrainsCount}
          activeAlerts={mockNetwork.activeAlertsCount}
          networkRisk={mockNetwork.networkRiskScore}
          selectedTrainId={selectedTrainId}
          selectedSectionId={selectedSectionId}
        />

        {/* 3. Primary Railway Network Map */}
        <RailwayMap 
          trains={mockTrains}
          stations={mockNetwork.stations}
          sections={mockNetwork.sections}
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
              trains={mockTrains}
              selectedTrainId={selectedTrainId}
              onSelectTrain={handleSelectTrain}
            />
          </div>

          {/* Right Column: Active Alerts & Network Risk Indicator */}
          <div className="cr-split-right">
            <ActiveAlerts 
              alerts={mockAlerts}
              selectedAlertId={selectedAlertId}
              onSelectAlert={handleSelectAlert}
            />

            <RiskIndicator 
              riskScore={mockNetwork.networkRiskScore}
              riskCategory={mockNetwork.riskCategory}
              breakdown={mockNetwork.riskBreakdown}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
