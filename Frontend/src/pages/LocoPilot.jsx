import React from 'react';
import LocoHeader from '../components/loco-pilot/LocoHeader';
import DepartureDecisionPanel from '../components/loco-pilot/DepartureDecisionPanel';
import CabDmiSpeedometer from '../components/loco-pilot/CabDmiSpeedometer';
import TrackProfileMap from '../components/loco-pilot/TrackProfileMap';
import SignalSafetyPanel from '../components/loco-pilot/SignalSafetyPanel';
import DriverAlerts from '../components/loco-pilot/DriverAlerts';
import EmergencyControls from '../components/loco-pilot/EmergencyControls';
import { useLocoPilotState, useSimulationControls } from '../simulator/SimulationContext';

export default function LocoPilot() {
  const {
    locoPilotData,
    requestDeparture,
    keepWaiting,
    confirmDepart,
    setActiveCab
  } = useLocoPilotState();

  const { status } = useSimulationControls();

  return (
    <div className="loco-pilot-page">
      <div className="loco-page-container">

        {/* 1. Loco Pilot Header & Active Cab Switcher */}
        <LocoHeader 
          data={locoPilotData} 
          simTime={status.simulationTime}
          activeCabId={status.activeCabTrainId || 'LOCAL_101'}
          onSelectCab={setActiveCab}
        />

        {/* 2. Interactive Departure Decision & Safety Workflow (LOCAL_101 Priority Workflow) */}
        {locoPilotData.departureWorkflow && (
          <DepartureDecisionPanel
            workflow={locoPilotData.departureWorkflow}
            onRequestDeparture={() => requestDeparture('LOCAL_101')}
            onKeepWaiting={() => keepWaiting('LOCAL_101')}
            onConfirmDepart={() => confirmDepart('LOCAL_101')}
          />
        )}

        {/* 3. Primary Speed & ETCS DMI Telemetry Instrument */}
        <CabDmiSpeedometer
          telemetry={locoPilotData.telemetry}
          route={locoPilotData.route}
          signaling={locoPilotData.signaling}
          safety={locoPilotData.safety}
        />

        {/* 4. Linear Track Profile Visualization (Station B ─── 🚆 Train ─── Station C) */}
        <TrackProfileMap
          waypoints={locoPilotData.trackWaypoints}
          route={locoPilotData.route}
          telemetry={locoPilotData.telemetry}
        />

        {/* 5. Operational Dual Split: Signal & Safety Panel + Driver Alerts */}
        <div className="loco-split-grid">
          <div className="loco-split-left">
            <SignalSafetyPanel
              signaling={locoPilotData.signaling}
              safety={locoPilotData.safety}
              route={locoPilotData.route}
            />
          </div>

          <div className="loco-split-right">
            <DriverAlerts
              alerts={locoPilotData.alerts}
            />
          </div>
        </div>

        {/* 6. Emergency & Safety Intervention Area */}
        <EmergencyControls
          safety={locoPilotData.safety}
        />

      </div>
    </div>
  );
}
