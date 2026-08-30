import React, { useState, useMemo } from 'react';
import { useNetworkState, useNetworkMetrics, useSimulationControls, useMLStatus, useIntrusionState } from '../../simulator/SimulationContext';
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
    const isAffected = !!t.isAffectedByIntrusion;

    return { ...t, xPct, yPct, style, isSelected, isDelayed, isConstrained, isAffected };
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
          <span className="cr-legend-item" style={{ color: '#ef4444' }}>
            <span className="cr-legend-dot" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            HAZARD AFFECTED
          </span>
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
            className={`cr-train-marker ${t.isSelected ? 'cr-train-selected' : ''} ${t.isAffected ? 'cr-train-affected' : ''} ${t.isDelayed ? 'cr-train-delayed' : ''} ${t.isConstrained ? 'cr-train-constrained' : ''}`}
            style={{
              left: `${t.xPct}%`,
              top: `${t.yPct}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: t.isAffected ? 10 : 2
            }}
            onClick={() => onSelectTrain(t.id)}
            title={`${t.id} — ${t.speed} km/h — ${t.status}${t.isAffected ? ' [INTRUSION AFFECTED]' : ''}`}
          >
            <div
              className="cr-train-dot"
              style={{
                background: t.isAffected ? '#ef4444' : t.style.dot,
                boxShadow: t.isAffected ? '0 0 10px #ef4444, 0 0 20px #ef444488' : undefined
              }}
            />
            <div
              className="cr-train-label font-mono"
              style={{
                color: t.isAffected ? '#ef4444' : t.style.label,
                fontWeight: t.isAffected ? 800 : undefined
              }}
            >
              {t.id.replace(/_(2\d\d|1\d\d|3\d\d|4\d\d|5\d\d)/,'_$1').split('_').pop()}
              {t.isAffected && ' ⚠'}
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
  const isAff   = !!train.isAffectedByIntrusion;
  const sstyle  = isAff
    ? { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' }
    : STATUS_STYLE[train.status] || STATUS_STYLE['IN TRANSIT'];
  const delay   = Math.round(train.delay || 0);
  const hwClass = isAff ? 'hw-constrained-row' : train.headwayStatus === 'CONSTRAINED' ? 'hw-constrained-row' : '';

  return (
    <tr
      className={`cr-train-row ${isSelected ? 'cr-row-selected' : ''} ${hwClass}`}
      onClick={() => onSelect(train.id)}
      style={isAff ? { background: '#fff5f5' } : undefined}
    >
      <td className="font-mono font-bold" style={{ color: isAff ? '#b91c1c' : style.label }}>
        <span className="cr-dot-sm" style={{ background: isAff ? '#ef4444' : style.dot }} />
        {train.id}
        {isAff && <span style={{ marginLeft: 6, fontSize: 9, color: '#ef4444' }}>● AFFECTED</span>}
      </td>
      <td className="font-mono" style={{ color: style.label }}>{train.type}</td>
      <td className="font-mono cr-speed-cell">
        <div style={{ fontWeight: 700 }}>
          {Math.round(train.speed || 0)}
          <span className="cr-unit">KM/H</span>
        </div>
        {train.speedRestriction !== null && train.speedRestriction !== undefined && (
          <div style={{ fontSize: 9, color: train.speedRestriction === 0 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
            TSR {train.speedRestriction} KM/H
          </div>
        )}
      </td>
      <td className="font-mono">
        {train.currentStation?.replace('STATION_','') ||
         train.currentSection?.replace('SEC_','').replace('_','→') || '–'}
      </td>
      <td className="font-mono">{train.direction === 'SOUTHBOUND' ? '↓ DN' : '↑ UP'}</td>
      <td className="font-mono">{train.etaAbsolute || train.eta || '–'}</td>
      <td>
        <span className="cr-status-chip font-mono" style={{ background: sstyle.bg, color: sstyle.text, border: `1px solid ${sstyle.border}` }}>
          {isAff ? `⚠ ${train.status}` : (train.status || 'TRANSIT')}
        </span>
      </td>
      <td className={`font-mono ${delay > 0 ? 'cr-delay-positive' : 'cr-delay-zero'}`}>
        {delay > 0 ? `+${delay} MIN` : 'ON TIME'}
      </td>
      <td className={`font-mono cr-hw-cell hw-${isAff ? 'constrained' : (train.headwayStatus || 'safe').toLowerCase()}`}>
        {isAff ? (train.intrusionRisk || 'HAZARD') : (train.headwayStatus || 'SAFE')}
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

// ─── Intrusion Alert Panel ──────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL: {
    bg: 'linear-gradient(135deg, #1a0000 0%, #2d0000 100%)',
    card: '#1c0000', cardBorder: '#7f1d1d',
    accent: '#ef4444', accentDim: '#b91c1c',
    badge: { bg: '#ef4444', text: '#ffffff' },
    pulse: '#ef4444', glow: '0 0 20px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.15)',
    label: 'CRITICAL HAZARD'
  },
  HIGH: {
    bg: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 100%)',
    card: '#1c1000', cardBorder: '#9a3412',
    accent: '#f97316', accentDim: '#c2410c',
    badge: { bg: '#f97316', text: '#ffffff' },
    pulse: '#f97316', glow: '0 0 20px rgba(249,115,22,0.35)',
    label: 'HIGH SEVERITY'
  },
  MEDIUM: {
    bg: 'linear-gradient(135deg, #1a1400 0%, #2d2200 100%)',
    card: '#1c1a00', cardBorder: '#a16207',
    accent: '#f59e0b', accentDim: '#b45309',
    badge: { bg: '#f59e0b', text: '#000000' },
    pulse: '#f59e0b', glow: '0 0 16px rgba(245,158,11,0.3)',
    label: 'MEDIUM SEVERITY'
  },
  LOW: {
    bg: 'linear-gradient(135deg, #001a0a 0%, #002d12 100%)',
    card: '#001c0a', cardBorder: '#166534',
    accent: '#10b981', accentDim: '#059669',
    badge: { bg: '#10b981', text: '#ffffff' },
    pulse: '#10b981', glow: '0 0 16px rgba(16,185,129,0.3)',
    label: 'LOW SEVERITY'
  }
};

const INTRUSION_ICON = {
  PERSON_ON_TRACK:   '🚨',
  OBJECT_ON_TRACK:   '⚠️',
  VEHICLE_INTRUSION: '🚗'
};

// Keyframe animation injected once
const INTRUSION_STYLE_ID = 'intrusion-keyframes';
if (!document.getElementById(INTRUSION_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = INTRUSION_STYLE_ID;
  s.textContent = `
    @keyframes intr-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.35)} }
    @keyframes intr-bar    { 0%{opacity:.5} 50%{opacity:1} 100%{opacity:.5} }
    @keyframes intr-slide  { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes intr-flash  { 0%,100%{background:rgba(239,68,68,0)} 50%{background:rgba(239,68,68,0.06)} }
  `;
  document.head.appendChild(s);
}

function IntrusionPanel() {
  const { active, history, hasActive, criticalCount, affectedTrainIds = [], trainImpactMap = {}, controls } = useIntrusionState();
  const topSev  = active.find(i => i.severity === 'CRITICAL') ? 'CRITICAL'
    : active.find(i => i.severity === 'HIGH') ? 'HIGH'
    : active.find(i => i.severity === 'MEDIUM') ? 'MEDIUM'
    : active.length ? 'LOW' : null;
  const cfg = topSev ? SEVERITY_CONFIG[topSev] : null;

  // ── CLEARED / IDLE state ────────────────────────────────
  if (!hasActive) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', marginBottom: 12,
        background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>✅</span>
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
            letterSpacing: '0.1em', color: '#15803d' }}>
            TRACK CLEAR — NO ACTIVE INTRUSIONS
          </span>
          {history.length > 0 && (
            <span style={{ fontSize: 9, color: '#6b7280', fontFamily: 'monospace' }}>
              · {history.length} in history
            </span>
          )}
        </div>
        <button
          onClick={() => controls.triggerDemoIntrusion()}
          style={{
            fontSize: 9, fontWeight: 700, padding: '5px 12px', borderRadius: 5,
            border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c',
            cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.08em'
          }}
        >
          ⚡ SIMULATE INTRUSION
        </button>
      </div>
    );
  }

  // ── ACTIVE INTRUSION STATE ──────────────────────────────
  return (
    <div style={{
      borderRadius: 12, marginBottom: 14, overflow: 'hidden',
      boxShadow: cfg.glow, animation: 'intr-flash 2s ease-in-out infinite',
      border: `1px solid ${cfg.accentDim}`
    }}>
      {/* ── Banner header ── */}
      <div style={{
        background: cfg.bg, padding: '12px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Pulsing alarm dot */}
          <span style={{
            width: 12, height: 12, borderRadius: '50%',
            background: cfg.accent, display: 'inline-block', flexShrink: 0,
            animation: 'intr-pulse 1s ease-in-out infinite',
            boxShadow: `0 0 8px ${cfg.accent}`
          }} />
          <span style={{
            fontSize: 12, fontWeight: 900, letterSpacing: '0.15em',
            color: cfg.accent, fontFamily: 'monospace'
          }}>
            {active.length > 1 ? `⚠ ${active.length} ACTIVE INTRUSIONS` : '⚠ INTRUSION DETECTED'}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 3,
            background: cfg.badge.bg, color: cfg.badge.text,
            fontFamily: 'monospace', letterSpacing: '0.1em'
          }}>
            {cfg.label}
          </span>
          {affectedTrainIds.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 9px', borderRadius: 3,
              background: '#ef4444', color: '#ffffff',
              fontFamily: 'monospace', letterSpacing: '0.08em'
            }}>
              {affectedTrainIds.length} TRAIN{affectedTrainIds.length > 1 ? 'S' : ''} AFFECTED
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => active.forEach(i => controls.clearIntrusion(i.id))}
            style={{
              fontSize: 9, fontWeight: 700, padding: '5px 12px', borderRadius: 5,
              border: '1px solid #4ade80', background: 'rgba(74,222,128,0.1)', color: '#4ade80',
              cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.08em'
            }}
          >
            ✓ CLEAR ALL
          </button>
        </div>
      </div>

      {/* ── Active intrusion cards ── */}
      <div style={{ background: '#0f0f0f', padding: '10px 14px' }}>
        {active.map((intr, idx) => {
          const c = SEVERITY_CONFIG[intr.severity] || SEVERITY_CONFIG.MEDIUM;
          const icon = INTRUSION_ICON[intr.type] || '⚠️';
          return (
            <div
              key={intr.id}
              style={{
                background: c.card, border: `1px solid ${c.cardBorder}`,
                borderLeft: `4px solid ${c.accent}`,
                borderRadius: 8, padding: '14px 16px', marginBottom: idx < active.length-1 ? 8 : 0,
                animation: 'intr-slide 0.3s ease-out',
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start'
              }}
            >
              <div>
                {/* Row 1: ID + type + badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 900, color: c.accent,
                    fontFamily: 'monospace', letterSpacing: '0.08em'
                  }}>
                    {intr.id}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#e2e8f0',
                    fontFamily: 'monospace'
                  }}>
                    {intr.type.replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                    background: c.badge.bg, color: c.badge.text,
                    fontFamily: 'monospace', letterSpacing: '0.1em'
                  }}>
                    {intr.severity}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 3,
                    border: `1px solid ${intr.status === 'ACKNOWLEDGED' ? '#f59e0b' : c.cardBorder}`,
                    color: intr.status === 'ACKNOWLEDGED' ? '#f59e0b' : '#94a3b8',
                    fontFamily: 'monospace'
                  }}>
                    {intr.status}
                  </span>
                </div>

                {/* Row 2: Location grid */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: '6px 16px'
                }}>
                  {[
                    { label: 'LOCATION', value: `KM ${intr.locationKm}` },
                    { label: 'SECTION',  value: intr.sectionId.replace('SEC_','').replace('_',' → ') },
                    { label: 'TRACK',    value: intr.track === 'DN_MAIN' ? 'DN MAIN ↓ Southbound' : 'UP MAIN ↑ Northbound' },
                    { label: 'CONFIDENCE', value: `${Math.round(intr.confidence * 100)}%` },
                    { label: 'EST. CLEARANCE', value: intr.estimatedClearanceTime ? `${intr.estimatedClearanceTime} min` : '—' },
                    { label: 'DETECTED AT', value: intr.detectedAt },
                    { label: 'SOURCE', value: intr.source }
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 8, color: '#64748b', fontFamily: 'monospace',
                        letterSpacing: '0.1em', marginBottom: 1 }}>{label}</div>
                      <div style={{ fontSize: 10, color: '#e2e8f0', fontFamily: 'monospace',
                        fontWeight: 600 }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {intr.status === 'ACTIVE' && (
                  <button
                    onClick={() => controls.acknowledgeIntrusion(intr.id)}
                    style={{
                      fontSize: 9, fontWeight: 700, padding: '6px 12px', borderRadius: 5,
                      border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                      cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap'
                    }}
                  >
                    ACKNOWLEDGE
                  </button>
                )}
                <button
                  onClick={() => controls.clearIntrusion(intr.id)}
                  style={{
                    fontSize: 9, fontWeight: 700, padding: '6px 12px', borderRadius: 5,
                    border: '1px solid #4ade80', background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                    cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap'
                  }}
                >
                  CLEAR
                </button>
                <button
                  onClick={() => controls.markFalsePositive(intr.id)}
                  style={{
                    fontSize: 9, fontWeight: 700, padding: '6px 12px', borderRadius: 5,
                    border: '1px solid #475569', background: 'rgba(71,85,105,0.15)', color: '#94a3b8',
                    cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap'
                  }}
                >
                  FALSE +VE
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Affected Trains Live Status ── */}
      {affectedTrainIds.length > 0 && (
        <div style={{ background: '#140000', borderTop: '1px solid #7f1d1d', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#fca5a5', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
              ⚠ AFFECTED TRAINS ({affectedTrainIds.length}) — DYNAMIC SAFETY ENFORCEMENT
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {affectedTrainIds.map(tid => {
              const impact = trainImpactMap[tid];
              if (!impact) return null;
              const isCrit = impact.risk === 'CRITICAL';
              return (
                <div key={tid} style={{
                  background: isCrit ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${isCrit ? '#ef4444' : '#f59e0b'}`,
                  borderRadius: 6, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: isCrit ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                        {tid}
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: isCrit ? '#ef4444' : '#f59e0b', color: '#000', fontFamily: 'monospace' }}>
                        {impact.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 9, color: '#cbd5e1', fontFamily: 'monospace', marginTop: 2 }}>
                      {impact.distanceToObstacleKm < 9999 ? `${impact.distanceToObstacleKm} km to obstacle` : 'Route blocked'} · TSR {impact.speedRestriction} KM/H
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: isCrit ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                    {impact.risk}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── History strip ── */}
      {history.length > 0 && (
        <div style={{ background: '#0a0a0a', borderTop: '1px solid #1e1e1e', padding: '8px 14px' }}>
          <details>
            <summary style={{
              fontSize: 9, fontFamily: 'monospace', color: '#475569',
              cursor: 'pointer', letterSpacing: '0.1em', fontWeight: 600
            }}>
              HISTORY — {history.length} RESOLVED EVENT{history.length !== 1 ? 'S' : ''}
            </summary>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {history.slice(-5).reverse().map(intr => (
                <div key={intr.id + intr.clearedAt} style={{
                  display: 'flex', gap: 12, padding: '4px 0',
                  borderBottom: '1px solid #1a1a1a', fontSize: 9,
                  fontFamily: 'monospace', color: '#475569', alignItems: 'center'
                }}>
                  <span style={{ color: '#6b7280', fontWeight: 700 }}>{intr.id}</span>
                  <span>{intr.type.replace(/_/g, ' ')}</span>
                  <span>KM {intr.locationKm}</span>
                  <span>{intr.sectionId.replace('SEC_','').replace('_',' → ')}</span>
                  <span style={{
                    padding: '1px 6px', borderRadius: 3,
                    background: intr.status === 'CLEARED' ? 'rgba(16,185,129,0.1)' : 'rgba(71,85,105,0.15)',
                    color: intr.status === 'CLEARED' ? '#10b981' : '#64748b',
                    border: `1px solid ${intr.status === 'CLEARED' ? '#10b981' : '#334155'}`
                  }}>
                    {intr.status}
                  </span>
                  {intr.clearedAt && <span style={{ color: '#374151' }}>@ {intr.clearedAt}</span>}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// ─── Main Control Room ───────────────────────────────────
export default function ControlRoom() {
  const { allTrains, alerts, risk } = useNetworkState();
  const { metrics, conflicts }      = useNetworkMetrics();
  const { status }                  = useSimulationControls();
  const { isConnected: mlConnected, alerts: mlAlerts, acknowledgeAlert } = useMLStatus();

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
        return !!t.isAffectedByIntrusion || (t.delay || 0) > 0 || t.headwayStatus === 'CONSTRAINED' || t.status === 'HELD';
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
          simTime={status?.simulationTime}
          phase={status?.phase}
        />

        {/* ML Backend Status Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 0', flexWrap: 'wrap'
        }}>
          <span
            className="font-mono"
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              padding: '3px 12px', borderRadius: 4, border: '1px solid',
              ...(mlConnected
                ? { background: '#f0fdf4', color: '#15803d', borderColor: '#86efac' }
                : { background: '#f8fafc', color: '#94a3b8', borderColor: '#e2e8f0' })
            }}
          >
            {mlConnected ? '● TRAINSENSE ML CONNECTED' : '○ ML BACKEND OFFLINE'}
          </span>
          {mlConnected && (
            <span className="font-mono" style={{ fontSize: 9, color: '#64748b' }}>
              {import.meta.env.VITE_ML_API_URL} · Polling active
            </span>
          )}
        </div>

        {/* Backend ML Alerts (from Correlation Engine) */}
        {mlAlerts && mlAlerts.filter(a => !a.acknowledged).length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8
          }}>
            <span className="cr-event-log-title font-mono">ML BACKEND ALERTS ({mlAlerts.filter(a => !a.acknowledged).length})</span>
            {mlAlerts.filter(a => !a.acknowledged).slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`cr-event-row cr-evt-${alert.severity === 'CRITICAL' ? 'critical' : alert.severity === 'HIGH' ? 'warning' : 'dispatch'}`}
              >
                <span className="cr-evt-time font-mono">{alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                <span className="cr-evt-train font-mono">{alert.trainId || 'SYSTEM'}</span>
                <span className="cr-evt-msg">{alert.message}</span>
                {alert.id && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="font-mono"
                    style={{
                      marginLeft: 'auto', fontSize: 9, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 3, border: '1px solid #e2e8f0',
                      background: '#ffffff', color: '#475569', cursor: 'pointer'
                    }}
                  >
                    ACK
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Intrusion Alert Panel */}
        <IntrusionPanel />

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
