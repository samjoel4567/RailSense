import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorSummaryBar() {
  const { state, status } = useSimulation();
  const trains = state?.allTrains || state?.trains || [];

  const scenarioTitle = status.phaseMeta?.shortTitle || 'NORMAL OPERATIONS';
  const risk = state.networkMetrics?.networkRisk ?? state.network?.networkRiskScore ?? 0;
  const riskCategory = state.networkMetrics?.riskCategory ?? state.network?.riskCategory ?? 'NOMINAL';
  const activeAlerts = state.alerts?.length ?? state.network?.activeAlertsCount ?? 0;
  const trainsInSection = trains.filter(t => !t.isDwelling && !t.hasReachedDestination).length;
  const totalTrains = trains.length;

  // Calculate elapsed time from initial seconds
  const [hh, mm, ss] = status.simulationTime.split(':').map(Number);
  const totalSec = (hh * 3600) + (mm * 60) + (ss || 0);
  const elapsedSec = Math.max(0, totalSec - (14 * 3600 + 20 * 60));
  const elapsedMinStr = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const elapsedSecStr = String(elapsedSec % 60).padStart(2, '0');

  return (
    <div className="sim-summary-bar-card font-mono">
      <div className="sim-summary-item">
        <span className="summary-lbl">SCENARIO:</span>
        <span className="summary-val font-bold text-blue">{scenarioTitle}</span>
      </div>

      <div className="summary-sep">│</div>

      <div className="sim-summary-item">
        <span className="summary-lbl">ACTIVE TRAINS IN SECTION:</span>
        <span className="summary-val font-bold">{trainsInSection} MOVING ({totalTrains} TOTAL)</span>
      </div>

      <div className="summary-sep">│</div>

      <div className="sim-summary-item">
        <span className="summary-lbl">NETWORK RISK:</span>
        <span className={`summary-val font-bold ${risk > 60 ? 'text-red' : risk > 30 ? 'text-amber' : 'text-green'}`}>
          {risk} / 100 [{riskCategory}]
        </span>
      </div>

      <div className="summary-sep">│</div>

      <div className="sim-summary-item">
        <span className="summary-lbl">ACTIVE ALERTS:</span>
        <span className={`summary-val font-bold ${activeAlerts > 0 ? 'text-amber' : 'text-green'}`}>
          {activeAlerts} {activeAlerts === 1 ? 'ALERT' : 'ALERTS'}
        </span>
      </div>

      <div className="summary-sep">│</div>

      <div className="sim-summary-item">
        <span className="summary-lbl">ELAPSED SIM TIME:</span>
        <span className="summary-val font-bold text-navy">{elapsedMinStr}:{elapsedSecStr} ({status.simulationTime})</span>
      </div>
    </div>
  );
}
