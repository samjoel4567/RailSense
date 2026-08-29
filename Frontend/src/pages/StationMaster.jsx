import React, { useState } from 'react';
import StationHeader from '../components/station-master/StationHeader';
import StationSummary from '../components/station-master/StationSummary';
import StationLayout from '../components/station-master/StationLayout';
import ArrivalsDepartures from '../components/station-master/ArrivalsDepartures';
import PlatformStatus from '../components/station-master/PlatformStatus';
import StationAlerts from '../components/station-master/StationAlerts';

import { mockStationData } from '../data/mockStation';

export default function StationMaster() {
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);
  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Platform selection handler
  const handleSelectPlatform = (platformId) => {
    if (selectedPlatformId === platformId) {
      setSelectedPlatformId(null);
      setSelectedTrainId(null);
    } else {
      setSelectedPlatformId(platformId);
      const plat = mockStationData.platforms.find(p => p.id === platformId);
      if (plat && plat.currentTrainId) {
        setSelectedTrainId(plat.currentTrainId);
      }
    }
  };

  // Train selection handler
  const handleSelectTrain = (trainId) => {
    if (selectedTrainId === trainId) {
      setSelectedTrainId(null);
    } else {
      setSelectedTrainId(trainId);
      const plat = mockStationData.platforms.find(p => p.currentTrainId === trainId || p.approachingTrainId === trainId);
      if (plat) {
        setSelectedPlatformId(plat.id);
      }
    }
  };

  // Alert selection handler
  const handleSelectAlert = (alert) => {
    if (selectedAlertId === alert.id) {
      setSelectedAlertId(null);
    } else {
      setSelectedAlertId(alert.id);
      if (alert.trainId) {
        setSelectedTrainId(alert.trainId.split('/')[0].trim());
      }
    }
  };

  const handleResetSelection = () => {
    setSelectedPlatformId(null);
    setSelectedTrainId(null);
    setSelectedAlertId(null);
  };

  return (
    <div className="station-master-page">
      <div className="sm-page-container">
        
        {/* 1. Station Header */}
        <StationHeader 
          stationName={mockStationData.stationName}
          junctionName={mockStationData.junctionName}
          stationCode={mockStationData.stationCode}
          onResetSelection={handleResetSelection}
          selectedPlatformId={selectedPlatformId}
        />

        {/* 2. Station Operational Summary */}
        <StationSummary 
          summary={mockStationData.summary}
          selectedPlatformId={selectedPlatformId}
        />

        {/* 3. Large Station Operations Area (Reserved for Visualization) */}
        <StationLayout 
          platforms={mockStationData.platforms}
          selectedPlatformId={selectedPlatformId}
          onSelectPlatform={handleSelectPlatform}
        />

        {/* 4. Lower Operations Split Grid */}
        <div className="sm-bottom-split-grid">
          
          {/* Left Column: Arrivals & Departures Table */}
          <div className="sm-split-left">
            <ArrivalsDepartures 
              items={mockStationData.arrivalsDepartures}
              selectedTrainId={selectedTrainId}
              onSelectTrain={handleSelectTrain}
            />
          </div>

          {/* Right Column: Platform Status & Station Alerts */}
          <div className="sm-split-right">
            <PlatformStatus 
              platforms={mockStationData.platforms}
              selectedPlatformId={selectedPlatformId}
              onSelectPlatform={handleSelectPlatform}
            />

            <StationAlerts 
              alerts={mockStationData.alerts}
              selectedAlertId={selectedAlertId}
              onSelectAlert={handleSelectAlert}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
