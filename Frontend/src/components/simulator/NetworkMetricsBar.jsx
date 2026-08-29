import React from 'react';
import { useSimulation, useNetworkMetrics } from '../../simulator/SimulationContext';
import { simulationEngine } from '../../simulator/simulationEngine';

function MetricTile({ label, value, subvalue, colorClass, pulse }) {
  return (
    <div className={`network-metric-tile ${pulse ? 'tile-pulse' : ''}`}>
      <span className={`metric-main-val font-mono font-bold ${colorClass || ''}`}>{value}</span>
      {subvalue && <span className="metric-sub-val font-mono">{subvalue}</span>}
      <span className="metric-tile-label font-mono">{label}</span>
    </div>
  );
}

export default function NetworkMetricsBar() {
  const { state, status } = useSimulation();
  const { metrics, conflicts } = useNetworkMetrics();

  const m = metrics || {
    totalTrains: 30, activeStations: 10, onTime: 0, delayed: 0,
    constrained: 0, networkRisk: 0, riskCategory: 'NOMINAL',
    activeConflicts: 0, avgDelayMin: 0, inTransit: 0, atStation: 0
  };

  const riskColor = m.networkRisk > 60 ? 'text-red' : m.networkRisk > 30 ? 'text-amber' : 'text-green';
  const conflictColor = m.activeConflicts > 0 ? 'text-red' : 'text-green';
  const delayColor = m.delayed > 0 ? 'text-amber' : 'text-green';

  return (
    <div className="network-metrics-bar font-mono">

      {/* Left: Scenario / Phase */}
      <div className="metrics-bar-left">
        <div className="metrics-phase-badge">
          <span className={`phase-live-dot ${status.isRunning ? 'dot-live' : 'dot-paused'}`} />
          <span className="phase-label">PHASE {status.phase}</span>
          <span className="phase-name">{status.phaseMeta?.shortTitle || 'NORMAL OPS'}</span>
        </div>
        <div className="metrics-sim-time">
          <span className="sim-time-label">SIM TIME</span>
          <span className="sim-time-val">{status.simulationTime}</span>
        </div>
      </div>

      {/* Center: Key Metrics */}
      <div className="metrics-tiles-row">
        <MetricTile label="ACTIVE TRAINS" value={m.totalTrains} subvalue={`${m.inTransit} MOVING`} />
        <MetricTile label="STATIONS" value={m.activeStations} subvalue="10 ONLINE" />
        <MetricTile label="ON TIME" value={m.onTime} colorClass="text-green" />
        <MetricTile label="DELAYED" value={m.delayed} colorClass={delayColor} pulse={m.delayed > 3} />
        <MetricTile label="CONSTRAINED" value={m.constrained} colorClass={m.constrained > 0 ? 'text-amber' : 'text-green'} />
        <MetricTile
          label="NETWORK RISK"
          value={`${m.networkRisk}/100`}
          subvalue={m.riskCategory}
          colorClass={riskColor}
          pulse={m.networkRisk > 60}
        />
        <MetricTile
          label="CONFLICTS"
          value={m.activeConflicts}
          colorClass={conflictColor}
          pulse={m.activeConflicts > 0}
        />
        <MetricTile
          label="AVG DELAY"
          value={`${m.avgDelayMin.toFixed(1)} MIN`}
          colorClass={m.avgDelayMin > 2 ? 'text-amber' : 'text-green'}
        />
      </div>

      {/* Right: Speed control */}
      <div className="metrics-bar-right">
        <div className="speed-control-group">
          <span className="speed-ctrl-label">SIM SPEED</span>
          <div className="speed-ctrl-btns">
            {[1, 2, 5, 10, 25, 50].map(s => (
              <button
                key={s}
                className={`speed-btn ${status.speedMultiplier === s ? 'speed-btn-active' : ''}`}
                onClick={() => simulationEngine.setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
