import React from 'react';
import { useLocoPilotState, useSimulationControls, useMLStatus } from '../simulator/SimulationContext';
import { SECTIONS } from '../simulator/networkModel';
import LocoHeader from '../components/loco-pilot/LocoHeader';
import CabDmiSpeedometer from '../components/loco-pilot/CabDmiSpeedometer';
import TrackProfileMap from '../components/loco-pilot/TrackProfileMap';
import SignalSafetyPanel from '../components/loco-pilot/SignalSafetyPanel';
import DriverAlerts from '../components/loco-pilot/DriverAlerts';
import DepartureDecisionPanel from '../components/loco-pilot/DepartureDecisionPanel';
import TrafficAheadPanel from '../components/loco-pilot/TrafficAheadPanel';

const LocoModelByType = {
  EXPRESS: 'WAP-7 / 3-Phase AC Electric',
  INTERCITY: 'WAP-4 / High-Power Electric',
  REGIONAL: 'MEMU-7000 / AC Traction',
  COMMUTER: 'MEMU-3000 / AC Traction',
  LOCAL: 'MEMU-3000 / AC Traction'
};

function displayStationLabel(stationId) {
  if (!stationId) return 'LIVE';
  return stationId.replace(/^STATION_/, '').replace(/_/g, ' ');
}

function buildTrackWaypoints(cabTrain, routeLengthKm, routeDistanceKm) {
  const sectionLength = Math.max(routeLengthKm || 0, routeDistanceKm || 0, 0.1);
  const traversedKm = Math.max(0, Math.min(routeDistanceKm || 0, sectionLength));
  const currentLabel = cabTrain?.id ? `CURRENT (${cabTrain.id})` : 'CURRENT POSITION';
  const originLabel = `${displayStationLabel(cabTrain?.origin) || 'ORIGIN'} [DEPARTED]`;
  const destinationLabel = `${displayStationLabel(cabTrain?.destination) || 'DESTINATION'} [PLATFORM]`;

  return [
    {
      km: 0,
      name: originLabel,
      type: 'STATION_ORIGIN',
      passed: traversedKm > 0.1,
      note: cabTrain?.isDwelling ? 'BOARDING / STANDBY' : 'DEPARTED'
    },
    {
      km: parseFloat(traversedKm.toFixed(1)),
      name: currentLabel,
      type: 'TRAIN_CURSOR',
      isCurrent: true,
      passed: true,
      note: `Speed ${Math.round(cabTrain?.speed || 0)} km/h`
    },
    {
      km: parseFloat(Math.max(0, sectionLength - Math.min(5.3, Math.max(0, sectionLength - traversedKm))).toFixed(1)),
      name: 'BRAKING CURVE',
      type: 'DECEL_POINT',
      passed: traversedKm > Math.max(0, sectionLength - 5.3),
      note: 'Approach braking zone'
    },
    {
      km: parseFloat(sectionLength.toFixed(1)),
      name: destinationLabel,
      type: 'STATION_DESTINATION',
      passed: traversedKm >= sectionLength,
      note: cabTrain?.etaAbsolute ? `ETA ${cabTrain.etaAbsolute}` : 'Destination ahead'
    }
  ];
}

function buildLocoPilotLiveData({ cabTrain, prediction, currentSignal, trafficAhead }) {
  if (!cabTrain) return null;

  const section = cabTrain.currentSection ? SECTIONS[cabTrain.currentSection] : null;
  const routeLengthKm = section?.lengthKm ?? Math.max((cabTrain.positionKm || 0) + (cabTrain.remainingKm || 0), 24.8);
  const routeDistanceKm = cabTrain.positionKm ?? Math.max(0, routeLengthKm - (cabTrain.remainingKm || 0));
  const currentAspect = currentSignal?.aspect || prediction?.signalAspect || cabTrain.signalAspect || 'GREEN';
  const aspectLabel = currentSignal?.statusText || prediction?.reason || (currentAspect === 'RED' ? 'STOP / HELD' : 'PROCEED');
  const isDwelling = !!cabTrain.isDwelling;
  const routeProgressPct = cabTrain.positionPct ?? (routeLengthKm > 0 ? (routeDistanceKm / routeLengthKm) * 100 : 0);
  const distanceRemainingKm = cabTrain.remainingKm ?? Math.max(0, routeLengthKm - routeDistanceKm);

  return {
    trainId: cabTrain.id,
    trainName: `${cabTrain.type || 'Rail'} Service ${cabTrain.id.replace(/_/g, ' ')}`,
    serviceType: `PASSENGER_${cabTrain.type || 'RAIL'}`,
    locoModel: LocoModelByType[cabTrain.type] || 'AC Electric Locomotive',
    cabId: `CAB-1 (${cabTrain.id} LEADING)`,
    driverName: cabTrain.driverName || 'ASSIGNED CREW',
    route: {
      origin: displayStationLabel(cabTrain.origin),
      originCode: cabTrain.origin || 'LIVE',
      currentSection: cabTrain.currentSection || cabTrain.currentStation || 'LIVE ROUTE',
      currentSectionLengthKm: parseFloat(routeLengthKm.toFixed(1)),
      destination: displayStationLabel(cabTrain.destination),
      destinationCode: cabTrain.destination || 'LIVE',
      destinationPlatform: cabTrain.platform || 'P1',
      direction: cabTrain.direction || 'SOUTHBOUND',
      directionArrow: cabTrain.direction === 'NORTHBOUND' ? '⬅' : '➔',
      progressPct: Math.round(routeProgressPct),
      distanceTraversedKm: parseFloat(routeDistanceKm.toFixed(1)),
      distanceRemainingKm: parseFloat(distanceRemainingKm.toFixed(1)),
      etaToDestination: cabTrain.etaAbsolute || cabTrain.eta || 'LIVE',
      arrivalTimeScheduled: cabTrain.etaAbsolute || 'LIVE'
    },
    telemetry: {
      currentSpeed: Math.round(cabTrain.speed || 0),
      speedUnit: 'KM/H',
      permittedSpeedLimit: cabTrain.speedRestriction || cabTrain.maxSpeed || 160,
      targetSpeed: cabTrain.targetSpeed || prediction?.predictedDelay || cabTrain.maxSpeed || 0,
      targetDistanceMeters: Math.round(distanceRemainingKm * 1000),
      throttlePositionPct: cabTrain.speed > 0 ? 65 : 0,
      brakePipePressureBar: cabTrain.isDwelling ? 5.0 : 4.8,
      mainReservoirBar: 9.8,
      lineVoltageKV: 25.2,
      tractionCurrentAmps: cabTrain.speed > 0 ? Math.round(cabTrain.speed * 3.2) : 0,
      catenaryStatus: 'LIVE RAIL POWER'
    },
    signaling: {
      currentAspect,
      aspectLabel,
      nextSignalId: cabTrain.currentSection ? cabTrain.currentSection.replace('SEC_', 'SIG-') : 'LIVE-SIGNAL',
      nextSignalLocation: currentSignal?.reason || 'Live section signal',
      distanceToNextSignalMeters: Math.round(Math.max(0, distanceRemainingKm) * 1000),
      movementAuthorityMeters: isDwelling ? Math.round(Math.max(0, distanceRemainingKm) * 1000) : Math.round(routeLengthKm * 1000),
      etcsLevel: 'ETCS LEVEL 2',
      mode: isDwelling ? 'STANDBY / SHUNTING' : 'FULL SUPERVISION (FS)',
      radioBlockCenter: 'ML / SIMULATION LINK ACTIVE'
    },
    safety: {
      overallStatus: cabTrain.status || 'LIVE',
      safetyCategory: cabTrain.headwayStatus === 'CONSTRAINED' ? 'SIL-4 CAUTION' : 'SIL-4 COMPLIANT',
      vigilanceDsdStatus: 'ACTIVE',
      emergencyBrakeStatus: cabTrain.headwayStatus === 'CONSTRAINED' ? 'STANDBY (RESTRICTED)' : 'STANDBY (NOMINAL)',
      wheelSlipProtection: 'ACTIVE',
      trackCircuitOccupancy: cabTrain.headwayStatus || 'SAFE'
    },
    trackWaypoints: buildTrackWaypoints(cabTrain, routeLengthKm, routeDistanceKm),
    alerts: (prediction?.reason || trafficAhead.length)
      ? [{
          id: 'LIVE-ADVISORY-1',
          severity: prediction?.recommendedAction === 'HOLD' ? 'WARNING' : 'PREDICTION',
          severityLevel: prediction?.recommendedAction === 'HOLD' ? 'warning' : 'prediction',
          title: prediction?.recommendedAction === 'HOLD'
            ? 'Live ML recommends HOLD'
            : 'Live ML route advisory',
          location: displayStationLabel(cabTrain.currentStation || cabTrain.currentSection),
          timestamp: cabTrain.etaAbsolute || 'LIVE',
          description: prediction?.reason || `${trafficAhead.length} train(s) ahead affecting the cab route.`
        }]
      : []
  };
}

export default function LocoPilot() {
  const {
    cabTrain, activeCabId, allTrains, trafficAhead,
    currentSignal, prediction, decision,
    locoPilotDecide, setActiveCab, departureEvaluation,
    locoPilotData, predictionsByTrain
  } = useLocoPilotState();

  const { status } = useSimulationControls();
  const { isConnected: mlConnected, prediction: mlRawPrediction, alerts: mlAlerts } = useMLStatus();

  // Determine ML availability for the currently selected train
  const mlAvailabilityForCab = (() => {
    if (!mlConnected) return 'ML_OFFLINE';
    if (!activeCabId) return 'ML_OFFLINE';
    const pred = predictionsByTrain?.[activeCabId];
    if (pred?.isMLPrediction) return 'ML_AVAILABLE';
    return 'ML_NOT_AVAILABLE_FOR_TRAIN';
  })();

  const liveLocoPilotData = buildLocoPilotLiveData({
    cabTrain,
    prediction,
    currentSignal,
    trafficAhead
  });
  const displayData = {
    ...(liveLocoPilotData || locoPilotData || {}),
    predictionsByTrain: predictionsByTrain || {}
  };

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
          data={displayData}
          simTime={status.simulationTime}
          activeCabId={activeCabId}
          cabTrain={cabTrain}
          allTrains={allTrains}
          onSelectCab={setActiveCab}
        />

        {/* ML Status Bar — driven by useMLStatus, no direct API calls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, margin: '12px 0 18px', padding: '10px 16px',
          border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Backend connectivity */}
            <span className="font-mono" style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              padding: '3px 10px', borderRadius: 4, border: '1px solid',
              ...(mlConnected
                ? { background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }
                : { background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' })
            }}>
              {mlConnected ? '● TRAINSENSE ML CONNECTED' : '○ ML BACKEND OFFLINE'}
            </span>
            {/* Per-train ML availability */}
            {mlConnected && (
              <span className="font-mono" style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                padding: '3px 10px', borderRadius: 4, border: '1px solid',
                ...(mlAvailabilityForCab === 'ML_AVAILABLE'
                  ? { background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }
                  : { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' })
              }}>
                {mlAvailabilityForCab === 'ML_AVAILABLE'
                  ? `● ${activeCabId} — ML AVAILABLE`
                  : `○ ${activeCabId || 'TRAIN'} — ML NOT AVAILABLE FOR THIS TRAIN`}
              </span>
            )}
          </div>
          {mlConnected && mlAlerts?.length > 0 && (
            <span className="font-mono" style={{ fontSize: 9, color: '#92400e' }}>
              {mlAlerts.filter(a => !a.acknowledged).length} ML ALERT{mlAlerts.filter(a => !a.acknowledged).length !== 1 ? 'S' : ''} ACTIVE
            </span>
          )}
        </div>

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
          waypoints={displayData.trackWaypoints || []}
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
                alerts={displayData.alerts || []}
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
