import React, { useState, useMemo } from 'react';
import { useNetworkState, useNetworkMetrics, useSimulationControls } from '../../simulator/SimulationContext';
import { STATION_CHAIN, STATIONS, SECTIONS } from '../../simulator/networkModel';
import { signalAspectColor } from '../../simulator/signalEngine';
import ControlRoomHeader from './ControlRoomHeader';
import RiskIndicator from './RiskIndicator';

// ─── Type colors (light railway style) ───────────────────
const TYPE_STYLE = {
  EXPRESS:   { dot: '#1d4ed8', label: '#1d4ed8' },
  INTERCITY: { dot: '#15803d', label: '#15803d' },
  REGIONAL:  { dot: '#7e22ce', label: '#7e22ce' },
  COMMUTER:  { dot: '#0369a1', label: '#0369a1' },
  LOCAL:     { dot: '#92400e', label: '#92400e' }
};

const STATUS_STYLE = {
  'IN TRANSIT':    { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
  'STATION DWELL': { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' },
  'DELAYED':       { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  'HELD':          { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' },
  'ARRIVED':       { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
  'CONSTRAINED':   { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }
};

// ─── Train filter types ──────────────────────────────────
const FILTER_TYPES = ['ALL', 'EXPRESS', 'INTERCITY', 'REGIONAL', 'COMMUTER', 'LOCAL', 'AFFECTED'];

// ─── Network map: horizontal A-J topology ────────────────
function NetworkRailwayMap({ allTrains, selectedTrainId, onSelectTrain }) {
  const canvasWidth = 100; // percentage
  const stations = STATION_CHAIN.map((id, idx) => {
    const st = STATIONS[id];
    return { id, name: id.replace('STATION_',''), st, pct: (idx / (STATION_CHAIN.length - 1)) * 88 + 6 };
  });

  // Map trains to x position
  const trainMarkers = allTrains.filter(t => !t.hasReachedDestination).map(t => {
    let xPct = 6;
    if (t.currentStation) {
      const idx = STATION_CHAIN.indexOf(t.currentStation);
      xPct = (idx / (STATION_CHAIN.length - 1)) * 88 + 6;
    } else if (t.currentSection) {
      const sec = SECTIONS[t.currentSection];
      if (sec) {
        const fromIdx = STATION_CHAIN.indexOf(sec.fromStation);
        const toIdx   = STATION_CHAIN.indexOf(sec.toStation);
        if (fromIdx !== -1 && toIdx !== -1) {
          const fromPct = (fromIdx / (STATION_CHAIN.length - 1)) * 88 + 6;
          const toPct   = (toIdx   / (STATION_CHAIN.length - 1)) * 88 + 6;
          xPct = fromPct + (toPct - fromPct) * (t.positionPct / 100);
        }
      }
    }

    const isUp   = t.direction === 'NORTHBOUND';
    const yPct   = isUp ? 38 : 62;
    const style  = TYPE_STYLE[t.type] || TYPE_STYLE.LOCAL;
    const isSelected = t.id === selectedTrainId;
    const isDelayed  = (t.delay || 0) > 0;
    const isConstrained = t.headwayStatus === 'CONSTRAINED';

    return { ...t, xPct, yPct, style, isSelected, isDelayed, isConstrained };
  });

  return (
    <div className="cr-network-map-card">
      <div className="cr-map-header">
        <div>
          <span className="cr-map-badge font-mono">NETWORK TOPOLOGY — A TO J CORRIDOR</span>
          <div className="cr-map-route font-mono">STATION A ─── B ─── C ─── D ─── E ─── F ─── G ─── H ─── I ─── J</div>
        </div>
        <div className="cr-map-legend font-mono">
          {Object.entries(TYPE_STYLE).map(([type, s]) => (
            <span key={type} className="cr-legend-item">
              <span className="cr-legend-dot" style={{ background: s.dot }} />
              {type}
            </span>
          ))}
        </div>
      </div>

      <div className="cr-map-canvas" style={{ position: 'relative', height: 140 }}>
        {/* Station nodes */}
        {stations.map(({ id, name, pct }) => (
          <div
            key={id}
            className="cr-map-station"
            style={{ left: `${pct}%` }}
          >
            <div className="cr-map-station-name font-mono">{name}</div>
            <div className="cr-map-station-dot" />
            <div className="cr-map-station-line" />
          </div>
        ))}

        {/* Track lines */}
        <div className="cr-track-line cr-track-up" />
        <div className="cr-track-line cr-track-dn" />
        <div className="cr-track-label cr-track-up-label font-mono">↑ UP (NORTHBOUND)</div>
        <div className="cr-track-label cr-track-dn-label font-mono">↓ DN (SOUTHBOUND)</div>

        {/* Train markers */}
        {trainMarkers.map(t => (
          <div
            key={t.id}
            className={`cr-train-marker ${t.isSelected ? 'cr-train-selected' : ''} ${t.isDelayed ? 'cr-train-delayed' : ''} ${t.isConstrained ? 'cr-train-constrained' : ''}`}
            style={{ left: `${t.xPct}%`, top: `${t.yPct}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => onSelectTrain(t.id)}
            title={`${t.id} — ${t.speed} km/h — ${t.status}`}
          >
            <div className="cr-train-dot" style={{ background: t.style.dot }} />
            <div className="cr-train-label font-mono" style={{ color: t.style.label }}>
              {t.id.replace(/_(2\d\d|1\d\d|3\d\d|4\d\d|5\d\d)/,'_$1').split('_').pop()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Train table row ─────────────────────────────────────
function TrainRow({ train, isSelected, onSelect }) {
  const style   = TYPE_STYLE[train.type] || TYPE_STYLE.LOCAL;
  const sstyle  = STATUS_STYLE[train.status] || STATUS_STYLE['IN TRANSIT'];
  const delay   = Math.round(train.delay || 0);
  const hwClass = train.headwayStatus === 'CONSTRAINED' ? 'hw-constrained-row' : '';

  return (
    <tr
      className={`cr-train-row ${isSelected ? 'cr-row-selected' : ''} ${hwClass}`}
      onClick={() => onSelect(train.id)}
    >
      <td className="font-mono font-bold" style={{ color: style.label }}>
        <span className="cr-dot-sm" style={{ background: style.dot }} />
        {train.id}
      </td>
      <td className="font-mono" style={{ color: style.label }}>{train.type}</td>
      <td className="font-mono cr-speed-cell">
        {Math.round(train.speed || 0)}
        <span className="cr-unit">KM/H</span>
      </td>
      <td className="font-mono">
        {train.currentStation?.replace('STATION_','') ||
         train.currentSection?.replace('SEC_','').replace('_','→') || '–'}
      </td>
      <td className="font-mono">{train.direction === 'SOUTHBOUND' ? '↓ DN' : '↑ UP'}</td>
      <td className="font-mono">{train.etaAbsolute || train.eta || '–'}</td>
      <td>
        <span className="cr-status-chip font-mono" style={{ background: sstyle.bg, color: sstyle.text, border: `1px solid ${sstyle.border}` }}>
          {train.status || 'TRANSIT'}
        </span>
      </td>
      <td className={`font-mono ${delay > 0 ? 'cr-delay-positive' : 'cr-delay-zero'}`}>
        {delay > 0 ? `+${delay} MIN` : 'ON TIME'}
      </td>
      <td className={`font-mono cr-hw-cell hw-${(train.headwayStatus || 'safe').toLowerCase()}`}>
        {train.headwayStatus || 'SAFE'}
      </td>
    </tr>
  );
}

// ─── Network metrics strip ──────────────────────────────
function NetworkMetricsStrip({ metrics, conflicts }) {
  return (
    <div className="cr-metrics-strip">
      {[
        { label: 'TOTAL TRAINS', value: metrics.totalTrains, color: '' },
        { label: 'IN TRANSIT',   value: metrics.inTransit,   color: '' },
        { label: 'AT STATION',   value: metrics.atStation,   color: '' },
        { label: 'ON TIME',      value: metrics.onTime,      color: 'green' },
        { label: 'DELAYED',      value: metrics.delayed,     color: metrics.delayed > 0 ? 'amber' : '' },
        { label: 'CONSTRAINED',  value: metrics.constrained, color: metrics.constrained > 0 ? 'amber' : '' },
        { label: 'CONFLICTS',    value: metrics.activeConflicts, color: metrics.activeConflicts > 0 ? 'red' : 'green' },
        { label: 'AVG DELAY',    value: `${(metrics.avgDelayMin || 0).toFixed(1)} MIN`, color: metrics.avgDelayMin > 2 ? 'amber' : '' },
        { label: 'NETWORK RISK', value: `${metrics.networkRisk || 0}/100`, color: metrics.networkRisk > 60 ? 'red' : metrics.networkRisk > 30 ? 'amber' : 'green' }
      ].map(({ label, value, color }) => (
        <div key={label} className="cr-metric-cell">
          <span className={`cr-metric-val font-mono font-bold ${color ? 'cr-metric-' + color : ''}`}>{value ?? '–'}</span>
          <span className="cr-metric-label font-mono">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Event log strip ────────────────────────────────────
function EventLogStrip({ eventLog }) {
  return (
    <div className="cr-event-log-card">
      <div className="cr-event-log-title font-mono">LIVE EVENT LOG</div>
      <div className="cr-event-log-list">
        {(eventLog || []).slice(0, 8).map(evt => (
          <div key={evt.id} className={`cr-event-row cr-evt-${(evt.type || '').toLowerCase()}`}>
            <span className="cr-evt-time font-mono">{evt.time}</span>
            {evt.trainId && <span className="cr-evt-train font-mono">{evt.trainId}</span>}
            <span className="cr-evt-msg font-mono">{evt.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Control Room ───────────────────────────────────
export default function ControlRoom() {
  const { allTrains, alerts, risk } = useNetworkState();
  const { metrics, conflicts }      = useNetworkMetrics();
  const { status }                  = useSimulationControls();

  const [selectedTrainId, setSelectedTrainId] = useState(null);
  const [filterType, setFilterType]           = useState('ALL');
  const [searchQuery, setSearchQuery]         = useState('');

  const handleSelectTrain = (trainId) => {
    setSelectedTrainId(prev => prev === trainId ? null : trainId);
  };

  // Filtered trains
  const filteredTrains = useMemo(() => {
    return allTrains.filter(t => {
      if (filterType === 'AFFECTED') {
        return (t.delay || 0) > 0 || t.headwayStatus === 'CONSTRAINED' || t.status === 'HELD';
      }
      if (filterType !== 'ALL') return t.type === filterType;
      if (searchQuery) return t.id.toLowerCase().includes(searchQuery.toLowerCase());
      return true;
    });
  }, [allTrains, filterType, searchQuery]);

  return (
    <div className="control-room-page">
      <div className="cr-page-container">

        {/* Header */}
        <ControlRoomHeader
          onResetSelection={() => setSelectedTrainId(null)}
          selectedTrainId={selectedTrainId}
          simTime={status.simulationTime}
          phase={status.phase}
        />

        {/* Network Metrics Strip */}
        <NetworkMetricsStrip metrics={metrics} conflicts={conflicts} />

        {/* Railway Map */}
        <NetworkRailwayMap
          allTrains={allTrains}
          selectedTrainId={selectedTrainId}
          onSelectTrain={handleSelectTrain}
        />

        {/* Bottom split: Train Table + Risk/Alerts */}
        <div className="cr-bottom-split-grid">
          <div className="cr-split-left">

            {/* Filter bar */}
            <div className="cr-filter-bar">
              <div className="cr-filter-btns">
                {FILTER_TYPES.map(f => (
                  <button
                    key={f}
                    className={`cr-filter-btn font-mono ${filterType === f ? 'cr-filter-active' : ''} ${f === 'AFFECTED' && metrics.delayed > 0 ? 'cr-filter-affected' : ''}`}
                    onClick={() => setFilterType(f)}
                  >
                    {f}
                    {f === 'AFFECTED' && (metrics.delayed + metrics.constrained) > 0 && (
                      <span className="cr-filter-count">{metrics.delayed + metrics.constrained}</span>
                    )}
                  </button>
                ))}
              </div>
              <input
                className="cr-search-input font-mono"
                placeholder="SEARCH TRAIN ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="cr-train-count font-mono">{filteredTrains.length} TRAINS</span>
            </div>

            {/* Train table */}
            <div className="cr-train-table-wrapper">
              <table className="cr-train-table">
                <thead>
                  <tr className="font-mono">
                    <th>TRAIN ID</th>
                    <th>TYPE</th>
                    <th>SPEED</th>
                    <th>LOCATION</th>
                    <th>DIR</th>
                    <th>ETA</th>
                    <th>STATUS</th>
                    <th>DELAY</th>
                    <th>HEADWAY</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrains.map(t => (
                    <TrainRow
                      key={t.id}
                      train={t}
                      isSelected={t.id === selectedTrainId}
                      onSelect={handleSelectTrain}
                    />
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          <div className="cr-split-right">
            {/* Event Log */}
            <EventLogStrip eventLog={status.eventLog} />

            {/* Risk Indicator */}
            <RiskIndicator
              riskScore={metrics.networkRisk}
              riskCategory={metrics.riskCategory}
              breakdown={{
                delayed: metrics.delayed,
                constrained: metrics.constrained,
                conflicts: metrics.activeConflicts,
                hazard: metrics.hazardActive ? 1 : 0
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
