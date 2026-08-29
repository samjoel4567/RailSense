import React, { useState } from 'react';
import { useLocoPilotState, useSimulationControls } from '../simulator/SimulationContext';
import LocoHeader from '../components/loco-pilot/LocoHeader';
import CabDmiSpeedometer from '../components/loco-pilot/CabDmiSpeedometer';
import TrackProfileMap from '../components/loco-pilot/TrackProfileMap';
import SignalSafetyPanel from '../components/loco-pilot/SignalSafetyPanel';
import DriverAlerts from '../components/loco-pilot/DriverAlerts';
import DepartureDecisionPanel from '../components/loco-pilot/DepartureDecisionPanel';
import TrafficAheadPanel from '../components/loco-pilot/TrafficAheadPanel';

export default function LocoPilot() {
  const {
    cabTrain, activeCabId, allTrains, trafficAhead,
    currentSignal, prediction, decision,
    locoPilotDecide, setActiveCab, departureEvaluation,
    locoPilotData, signalStates
  } = useLocoPilotState();

  const { status } = useSimulationControls();

  // Build telemetry from live cab train
  const telemetry = cabTrain ? {
    speedKmH:        Math.round(cabTrain.speed || 0),
    targetSpeedKmH:  Math.round(cabTrain.targetSpeed || 0),
    permittedSpeedKmH: cabTrain.speedRestriction || cabTrain.maxSpeed || 160,
    distanceTravelledKm: parseFloat((cabTrain.positionKm || 0).toFixed(2)),
    remainingKm:     parseFloat((cabTrain.remainingKm || 0).toFixed(2)),
    etaMinutes:      cabTrain.eta || '–',
    etaAbsolute:     cabTrain.etaAbsolute || '–',
    delayMinutes:    Math.round(cabTrain.delay || 0),
    status:          cabTrain.status || '–',
    headwayStatus:   cabTrain.headwayStatus || 'SAFE',
    headwayMarginSec: cabTrain.headwayMarginSec || 999
  } : {};

  const route = cabTrain ? {
    trainId:         cabTrain.id,
    trainType:       cabTrain.type,
    origin:          cabTrain.origin?.replace('STATION_', '') || '–',
    destination:     cabTrain.destination?.replace('STATION_', '') || '–',
    currentStation:  cabTrain.currentStation?.replace('STATION_', '') || (cabTrain.currentSection?.replace('SEC_','').replace('_','→') || '–'),
    currentSection:  cabTrain.currentSection || '–',
    direction:       cabTrain.direction || '–',
    platform:        cabTrain.platform || '–',
    priority:        cabTrain.priority
  } : {};

  const signaling = {
    currentAspect: currentSignal?.aspect || 'GREEN',
    statusText:    currentSignal?.statusText || 'PROCEED',
    speedLimit:    cabTrain?.speedRestriction || cabTrain?.maxSpeed || 160,
    nextSignalKm:  null
  };

  const safety = {
    hazardActive:  status.hazardActive || false,
    speedCeiling:  cabTrain?.speedRestriction || null,
    sil4Active:    status.phase === 5,
    emergencyBrakeAvailable: true
  };

  // Show departure panel only when the cab train is dwelling and not arrived
  const showDeparturePanel = cabTrain && cabTrain.isDwelling && !cabTrain.hasReachedDestination;

  return (
    <div className="loco-pilot-page">
      <div className="loco-page-container">

        {/* 1. Header with cab switcher */}
        <LocoHeader
          data={locoPilotData}
          simTime={status.simulationTime}
          activeCabId={activeCabId}
          cabTrain={cabTrain}
          allTrains={allTrains}
          onSelectCab={setActiveCab}
        />

        {/* 2. Departure Decision + AI Prediction (only when dwelling) */}
        {showDeparturePanel && (
          <DepartureDecisionPanel
            cabTrain={cabTrain}
            prediction={prediction}
            decision={decision}
            trafficAhead={trafficAhead}
            departureEvaluation={departureEvaluation}
            onProceed={() => locoPilotDecide(activeCabId, 'PROCEED')}
            onHold={() => locoPilotDecide(activeCabId, 'HOLD')}
          />
        )}

        {/* 3. Speed & DMI Telemetry */}
        <CabDmiSpeedometer
          telemetry={telemetry}
          route={route}
          signaling={signaling}
          safety={safety}
        />

        {/* 4. Track Profile Map */}
        <TrackProfileMap
          waypoints={locoPilotData?.trackWaypoints || []}
          route={route}
          telemetry={telemetry}
          cabTrain={cabTrain}
        />

        {/* 5. Bottom split: Signal panel + Traffic Ahead */}
        <div className="loco-split-grid">
          <div className="loco-split-left">
            <SignalSafetyPanel
              signaling={signaling}
              safety={safety}
              route={route}
            />
          </div>
          <div className="loco-split-right">
            {trafficAhead.length > 0 ? (
              <TrafficAheadPanel
                cabTrain={cabTrain}
                trafficAhead={trafficAhead}
                prediction={prediction}
              />
            ) : (
              <DriverAlerts
                alerts={locoPilotData?.alerts || []}
                cabTrain={cabTrain}
                safety={safety}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
