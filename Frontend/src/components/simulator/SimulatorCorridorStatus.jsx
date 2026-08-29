import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorCorridorStatus() {
  const { state, status } = useSimulation();
  const risk = state.network.networkRiskScore;
  const delayedCount = state.network.delayedTrainsCount;
  const onTimePct = delayedCount > 0 ? (status.phase >= 4 ? 75 : 88) : 98;

  return (
    <div className="sim-panel-card sim-corridor-status-card">
      <div className="sim-panel-header">
        <div className="sim-panel-title-group font-mono">
          <span className="sim-panel-indicator bg-green"></span>
          <h3 className="sim-panel-title">CORRIDOR STATUS</h3>
        </div>
        <span className="sim-panel-sub font-mono">TELEMETRY AGGREGATE</span>
      </div>

      <div className="sim-corridor-metrics-grid font-mono">
        
        <div className="metric-tile">
          <span className="tile-lbl">TOTAL STATIONS:</span>
          <span className="tile-val font-bold">4 HUBS</span>
          <span className="tile-sub text-muted">VKR · KJM · BPL · NHR</span>
        </div>

        <div className="metric-tile">
          <span className="tile-lbl">CORRIDOR TRAINS:</span>
          <span className="tile-val font-bold">4 MOVEMENTS</span>
          <span className="tile-sub text-muted">2 EXPRESS · 2 LOCAL</span>
        </div>

        <div className="metric-tile">
          <span className="tile-lbl">TRAINS IN SECTION:</span>
          <span className="tile-val font-bold text-blue">2 ACTIVE</span>
          <span className="tile-sub text-muted">EXPRESS_201 & LOCAL_102</span>
        </div>

        <div className="metric-tile">
          <span className="tile-lbl">AVERAGE SPEED:</span>
          <span className="tile-val font-bold">97 KM/H</span>
          <span className="tile-sub text-muted">SECTION B MEDIAN</span>
        </div>

        <div className="metric-tile">
          <span className="tile-lbl">ON-TIME PERFORMANCE:</span>
          <span className={`tile-val font-bold ${onTimePct < 80 ? 'text-amber' : 'text-green'}`}>
            {onTimePct}%
          </span>
          <span className="tile-sub text-muted">{delayedCount > 0 ? `${delayedCount} DELAYED` : '100% NOMINAL'}</span>
        </div>

        <div className="metric-tile">
          <span className="tile-lbl">NETWORK RISK SCORE:</span>
          <span className={`tile-val font-bold ${risk > 60 ? 'text-red' : risk > 30 ? 'text-amber' : 'text-green'}`}>
            {risk} / 100
          </span>
          <span className="tile-sub text-muted">{state.network.riskCategory} CATEGORY</span>
        </div>

      </div>

      <div className="sim-panel-footer font-mono">
        <span>Section B interlocking operating with ETCS Level 2 movement authority.</span>
      </div>
    </div>
  );
}
