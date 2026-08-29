import React, { useState } from 'react';
import StationHeader from '../components/station-master/StationHeader';
import StationSummary from '../components/station-master/StationSummary';
import StationLayout from '../components/station-master/StationLayout';
import ArrivalsDepartures from '../components/station-master/ArrivalsDepartures';
import PlatformStatus from '../components/station-master/PlatformStatus';
import StationAlerts from '../components/station-master/StationAlerts';
import { useStationMasterState } from '../simulator/SimulationContext';

export default function StationMaster() {
  const { stationData } = useStationMasterState();
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Interaction handlers
  const handleSelectEntity = (entityId, secondaryId) => {
    if (selectedEntity === entityId) {
      setSelectedEntity(null);
    } else {
      setSelectedEntity(entityId || secondaryId);
    }
  };

  const handleSelectTrain = (trainId) => {
    if (selectedEntity === trainId) {
      setSelectedEntity(null);
    } else {
      setSelectedEntity(trainId);
    }
  };

  const handleSelectAlert = (alert) => {
    if (selectedEntity === alert.id) {
      setSelectedEntity(null);
    } else {
      setSelectedEntity(alert.id);
    }
  };

  const handleResetSelection = () => {
    setSelectedEntity(null);
  };

  return (
    <div className="station-master-page">
      <div className="sm-page-container">
        
        {/* 1. Station Master Header */}
        <StationHeader 
          onResetSelection={handleResetSelection}
          selectedEntity={selectedEntity}
        />

        {/* 2. Station Operational Summary (Station B ➔ Section B ➔ Station C) */}
        <StationSummary 
          summary={stationData.lifecycleSummary}
          selectedEntity={selectedEntity}
        />

        {/* 3. Primary Railway Lifecycle Visualization (Station B ➔ Section B ➔ Station C) */}
        <StationLayout 
          stationB={stationData.stationB}
          sectionB={stationData.sectionB}
          stationC={stationData.stationC}
          selectedEntity={selectedEntity}
          onSelectEntity={handleSelectEntity}
        />

        {/* 4. Lower Operational Split: Arrivals/Departures Table + Platform Status & Alerts */}
        <div className="sm-bottom-split-grid">
          
          {/* Left Column: Arrivals & Departures Table */}
          <div className="sm-split-left">
            <ArrivalsDepartures 
              items={stationData.arrivalsDepartures}
              selectedEntity={selectedEntity}
              onSelectTrain={handleSelectTrain}
            />
          </div>

          {/* Right Column: Station B vs C Platforms & Operational Alerts */}
          <div className="sm-split-right">
            <PlatformStatus 
              stationBPlatforms={stationData.stationB.platforms}
              stationCPlatforms={stationData.stationC.platforms}
              selectedEntity={selectedEntity}
              onSelectPlatform={handleSelectEntity}
            />

            <StationAlerts 
              alerts={stationData.alerts}
              selectedEntity={selectedEntity}
              onSelectAlert={handleSelectAlert}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
