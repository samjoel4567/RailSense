import React, { useState, useRef } from 'react';
import { useSimulation, useNetworkMetrics } from '../../simulator/SimulationContext';
import { STATIONS, SECTIONS, STATION_CHAIN } from '../../simulator/networkModel';

const TYPE_COLORS = {
  EXPRESS:   { bg: '#1e3a5f', border: '#3b82f6', dot: '#60a5fa', text: '#bfdbfe' },
  INTERCITY: { bg: '#1a3a2a', border: '#10b981', dot: '#34d399', text: '#a7f3d0' },
  REGIONAL:  { bg: '#2d1b4e', border: '#8b5cf6', dot: '#a78bfa', text: '#ddd6fe' },
  COMMUTER:  { bg: '#1a2e40', border: '#0ea5e9', dot: '#38bdf8', text: '#bae6fd' },
  LOCAL:     { bg: '#2d2515', border: '#f59e0b', dot: '#fbbf24', text: '#fde68a' }
};

const STATUS_COLORS = {
  'IN TRANSIT':       '#3b82f6',
  'STATION DWELL':    '#f59e0b',
  'DELAYED':          '#ef4444',
  'CONSTRAINED':      '#f97316',
  'ARRIVED':          '#10b981',
  'HELD BY INTERLOCKING': '#ef4444',
  'AUTHORIZED':       '#10b981'
};

const FILTER_OPTIONS = ['ALL', 'EXPRESS', 'INTERCITY', 'REGIONAL', 'COMMUTER', 'LOCAL'];

function getTrainStatusColor(train) {
  if (train.headwayStatus === 'CONSTRAINED') return '#ef4444';
  if ((train.delay || 0) > 2) return '#ef4444';
  if ((train.delay || 0) > 0) return '#f97316';
  if (train.headwayStatus === 'CAUTION') return '#f59e0b';
  return STATUS_COLORS[train.status] || '#3b82f6';
}

/**
 * Calculate the horizontal position (%) of a train on the A-J topology display.
 * For in-transit trains: interpolate between fromStation and toStation x positions.
 * For dwelling trains: use the station's x position.
 */
function getTrainXPct(train) {
  if (train.isDwelling && train.currentStation) {
    const st = STATIONS[train.currentStation];
    return st ? st.xPct : 50;
  }
  if (!train.currentSection) return 2;
  const sec = SECTIONS[train.currentSection];
  if (!sec) return 2;
  const fromSt = STATIONS[sec.fromStation];
  const toSt = STATIONS[sec.toStation];
  if (!fromSt || !toSt) return 2;
  const pct = train.positionPct / 100;
  if (train.direction === 'SOUTHBOUND') {
    return fromSt.xPct + pct * (toSt.xPct - fromSt.xPct);
  } else {
    return toSt.xPct + (1 - pct) * (fromSt.xPct - toSt.xPct);
  }
}

function TrainMarker({ train, isSelected, isAffected, onSelect }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const colors = TYPE_COLORS[train.type] || TYPE_COLORS.LOCAL;
  const statusColor = getTrainStatusColor(train);
  const xPct = getTrainXPct(train);

  const isNorthbound = train.direction === 'NORTHBOUND';
  const yOffset = isNorthbound ? -14 : 14;
  const dotSize = train.type === 'EXPRESS' || train.type === 'INTERCITY' ? 10 : 8;

  return (
    <div
      className={`train-marker-pin ${isSelected ? 'marker-selected' : ''} ${isAffected ? 'marker-affected' : ''}`}
      style={{
        left: `${Math.max(1, Math.min(98, xPct))}%`,
        top: isNorthbound ? '30%' : '70%',
        transform: 'translateX(-50%) translateY(-50%)'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => { e.stopPropagation(); onSelect(train); }}
      title={train.id}
    >
      {/* Pulsing dot */}
      <div
        className={`train-dot ${isSelected ? 'dot-selected' : ''}`}
        style={{
          width: dotSize, height: dotSize,
          background: statusColor,
          boxShadow: isSelected ? `0 0 0 3px ${statusColor}44, 0 0 12px ${statusColor}88` : `0 0 6px ${statusColor}66`,
          borderRadius: '50%',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
      />

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="train-tooltip font-mono" style={{ borderColor: statusColor }}>
          <div className="tooltip-id" style={{ color: statusColor }}>{train.id}</div>
          <div className="tooltip-row"><span>TYPE</span><span>{train.type}</span></div>
          <div className="tooltip-row"><span>SPEED</span><span>{Math.round(train.speed)} KM/H</span></div>
          <div className="tooltip-row"><span>ETA</span><span>{train.etaAbsolute || train.eta || '–'}</span></div>
          {(train.delay || 0) > 0 && (
            <div className="tooltip-row warn"><span>DELAY</span><span>+{Math.round(train.delay)} MIN</span></div>
          )}
          <div className="tooltip-click">CLICK TO INSPECT</div>
        </div>
      )}

      {/* Affected pulse ring */}
      {isAffected && (
        <div className="affected-ring" style={{ borderColor: '#ef4444' }} />
      )}
    </div>
  );
}

export default function NetworkTopologyDiagram({ onSelectTrain, selectedTrainId, affectedTrainIds = [] }) {
  const { state, status } = useSimulation();
  const { allTrains } = useNetworkMetrics();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showOnlyAffected, setShowOnlyAffected] = useState(false);

  const trains = allTrains && allTrains.length > 0 ? allTrains : [];
  const phase = status.phase;

  // Filter trains
  let visibleTrains = trains;
  if (activeFilter !== 'ALL') {
    visibleTrains = visibleTrains.filter(t => t.type === activeFilter);
  }
  if (showOnlyAffected && affectedTrainIds.length > 0) {
    visibleTrains = visibleTrains.filter(t => affectedTrainIds.includes(t.id) || t.id === selectedTrainId);
  }

  // Station nodes
  const stationList = STATION_CHAIN.map(id => STATIONS[id]);

  return (
    <div className="network-topology-card">
      {/* Header */}
      <div className="topology-card-header">
        <div className="topology-header-left">
          <span className="topology-badge font-mono font-bold">OPERATIONAL TOPOLOGY</span>
          <h2 className="topology-title">RAILWAY NETWORK — 10 STATIONS · 30 TRAINS</h2>
          <span className="topology-route font-mono">
            STATION A ➔ B ➔ C ➔ D ➔ E ➔ F ➔ G ➔ H ➔ I ➔ J
          </span>
        </div>
        <div className="topology-header-right font-mono">
          <div className="topology-meta-chip">
            <span className={`meta-dot ${phase === 5 ? 'bg-red' : phase === 4 ? 'bg-amber' : 'bg-green'}`}></span>
            <span>PHASE {phase} ACTIVE</span>
          </div>
          <div className="topology-meta-chip">
            <span>{trains.length} TRAINS TRACKED</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="topology-filter-bar font-mono">
        <span className="filter-label">FILTER:</span>
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            className={`filter-btn ${activeFilter === f ? 'filter-active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
        <div className="filter-sep" />
        <button
          className={`filter-btn ${showOnlyAffected ? 'filter-active filter-affected' : ''}`}
          onClick={() => setShowOnlyAffected(!showOnlyAffected)}
          disabled={affectedTrainIds.length === 0}
        >
          AFFECTED ONLY
        </button>
        <span className="filter-count">{visibleTrains.length} SHOWN</span>
      </div>

      {/* Main Track Canvas */}
      <div className="topology-canvas">

        {/* Station Labels Row */}
        <div className="topology-stations-row">
          {stationList.map(st => (
            <div
              key={st.id}
              className="topology-station-node"
              style={{ left: `${st.xPct}%` }}
            >
              <div className="station-node-label font-mono">
                <span className="station-node-name font-bold">{st.shortName}</span>
                <span className="station-node-km">KM {st.kmPost}</span>
              </div>
              <div className="station-node-dot" />
              <div className="station-node-line" />
            </div>
          ))}
        </div>

        {/* Upper Track (Northbound) */}
        <div className="topology-track topology-track-north">
          <span className="track-dir-label font-mono">◀ NORTHBOUND</span>
          <div className="track-rail-line" />
        </div>

        {/* Center Section Labels */}
        <div className="topology-section-labels font-mono">
          {Object.values(SECTIONS).map(sec => {
            const fromSt = STATIONS[sec.fromStation];
            const toSt = STATIONS[sec.toStation];
            if (!fromSt || !toSt) return null;
            const midX = (fromSt.xPct + toSt.xPct) / 2;
            return (
              <div
                key={sec.id}
                className="section-label-tag"
                style={{ left: `${midX}%` }}
              >
                {sec.lengthKm}km
              </div>
            );
          })}
        </div>

        {/* Lower Track (Southbound) */}
        <div className="topology-track topology-track-south">
          <div className="track-rail-line" />
          <span className="track-dir-label font-mono">SOUTHBOUND ▶</span>
        </div>

        {/* Train Markers */}
        {visibleTrains.map(train => (
          <TrainMarker
            key={train.id}
            train={train}
            isSelected={train.id === selectedTrainId}
            isAffected={affectedTrainIds.includes(train.id)}
            onSelect={onSelectTrain || (() => {})}
          />
        ))}

        {/* Phase 5 Hazard Indicator */}
        {phase === 5 && (
          <div className="hazard-overlay-pin font-mono" style={{ left: '22%', top: '70%' }}>
            <div className="hazard-bubble">
              <span>⚠️</span>
              <span>AI VISION HAZARD</span>
            </div>
          </div>
        )}

        {/* Junction Markers */}
        {[
          { id: 'J-01', xPct: 17, label: 'J-01' },
          { id: 'J-02', xPct: 40, label: 'J-02' },
          { id: 'J-03', xPct: 63, label: 'J-03' },
          { id: 'J-04', xPct: 83, label: 'J-04' },
        ].map(jxn => {
          const hasConflict = (state.conflicts || []).some(c => c.junctionId === `JXN_0${jxn.id.split('-')[1]}`);
          return (
            <div
              key={jxn.id}
              className={`junction-pin font-mono ${hasConflict ? 'junction-conflict' : ''}`}
              style={{ left: `${jxn.xPct}%` }}
            >
              <span className="junction-label">{jxn.label}</span>
            </div>
          );
        })}

      </div>

      {/* Legend Strip */}
      <div className="topology-legend-strip font-mono">
        <span className="legend-title">LEGEND:</span>
        {Object.entries(TYPE_COLORS).map(([type, colors]) => (
          <span key={type} className="legend-item">
            <span className="legend-dot" style={{ background: colors.dot }} />
            <span>{type}</span>
          </span>
        ))}
        <span className="legend-sep" />
        <span className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }} /><span>NORMAL</span></span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }} /><span>DELAYED</span></span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /><span>CONFLICT</span></span>
      </div>

      {/* [SIMULATION DEMO DATA] disclaimer */}
      <div className="topology-disclaimer font-mono">
        ⚠ SIMULATION · PREDICTION · DEMO DATA — Operator retains full decision authority
      </div>
    </div>
  );
}
