import React, { useState } from 'react';
import { useStationMasterLive, useSimulationControls } from '../simulator/SimulationContext';
import { STATION_CHAIN, STATIONS } from '../simulator/networkModel';
import { signalAspectColor } from '../simulator/signalEngine';
import StationHeader from '../components/station-master/StationHeader';
import StationAlerts from '../components/station-master/StationAlerts';

// Platform state color map
const PLATFORM_STATE_CONFIG = {
  CLEAR:     { label: 'CLEAR',     bg: '#f0fdf4', border: '#86efac', text: '#15803d', dot: '#10b981' },
  RESERVED:  { label: 'RESERVED',  bg: '#fffbeb', border: '#fde68a', text: '#92400e', dot: '#f59e0b' },
  ARRIVING:  { label: 'ARRIVING',  bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', dot: '#3b82f6' },
  OCCUPIED:  { label: 'OCCUPIED',  bg: '#fef2f2', border: '#fca5a5', text: '#b91c1c', dot: '#ef4444' },
  DEPARTING: { label: 'DEPARTING', bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1', dot: '#0ea5e9' },
  BLOCKED:   { label: 'BLOCKED',   bg: '#fef2f2', border: '#fca5a5', text: '#7f1d1d', dot: '#991b1b' },
};

function PlatformCard({ platform, idx }) {
  const cfg = PLATFORM_STATE_CONFIG[platform.state] || PLATFORM_STATE_CONFIG.CLEAR;
  const sigColor = signalAspectColor(platform.signal || 'GREEN');

  return (
    <div
      className="sm-platform-card"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      {/* Platform header */}
      <div className="sm-plat-header">
        <div className="sm-plat-id font-mono font-bold">P{idx + 1}</div>
        <div className="sm-plat-state font-mono" style={{ color: cfg.text }}>
          <span className="sm-plat-dot" style={{ background: cfg.dot }} />
          {cfg.label}
        </div>
        <div
          className="sm-plat-signal font-mono"
          style={{ color: sigColor, borderColor: sigColor, background: `${sigColor}15` }}
        >
          {platform.signal || 'GREEN'}
        </div>
      </div>

      {/* Platform body */}
      <div className="sm-plat-body">
        {platform.trainId ? (
          <>
            <div className="sm-plat-train-id font-mono font-bold">{platform.trainId}</div>
            {platform.train && (
              <div className="sm-plat-train-meta font-mono">
                <span className="sm-meta-type">{platform.train.type}</span>
                {platform.train.speed > 0 && (
                  <span className="sm-meta-speed">{Math.round(platform.train.speed)} KM/H</span>
                )}
                {platform.eta && <span className="sm-meta-eta">ETA {platform.eta}</span>}
              </div>
            )}
            {platform.state === 'OCCUPIED' && platform.dwellSec > 0 && (
              <div className="sm-plat-dwell font-mono">
                DWELL {Math.round(platform.dwellSec)}s
              </div>
            )}
          </>
        ) : (
          <div className="sm-plat-empty font-mono">AVAILABLE — STANDBY</div>
        )}
      </div>
    </div>
  );
}

function ApproachingTrainRow({ train }) {
  return (
    <div className="sm-approaching-row font-mono">
      <span className="sm-appr-id">{train.id}</span>
      <span className="sm-appr-type">{train.type}</span>
      <span className="sm-appr-speed">{Math.round(train.speed || 0)} KM/H</span>
      <span className="sm-appr-eta">{train.etaAbsolute || train.eta || '–'}</span>
      <span className={`sm-appr-delay ${(train.delay || 0) > 0 ? 'sm-delayed' : 'sm-ontime'}`}>
        {(train.delay || 0) > 0 ? `+${Math.round(train.delay)} MIN` : 'ON TIME'}
      </span>
    </div>
  );
}

export default function StationMaster() {
  const [selectedStationId, setSelectedStationId] = useState('STATION_B');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const { status } = useSimulationControls();

  const {
    stationId, stationState, platforms, approaching, atStation, arrivals
  } = useStationMasterLive(selectedStationId);

  const stationDef = STATIONS[selectedStationId];

  // Build alerts from approaching trains with delays
  const stationAlerts = [
    ...approaching.filter(t => (t.delay || 0) > 2).map(t => ({
      id: `delay_${t.id}`,
      type: 'DELAY',
      trainId: t.id,
      message: `${t.id} DELAYED +${Math.round(t.delay)} MIN — ETA ${t.etaAbsolute || '–'}`,
      severity: t.delay > 5 ? 'HIGH' : 'MEDIUM'
    })),
    ...(stationState?.activeConflicts > 0 ? [{
      id: 'platform_conflict',
      type: 'PLATFORM',
      message: `Platform conflict detected at ${stationDef?.name || selectedStationId}`,
      severity: 'HIGH'
    }] : [])
  ];

  return (
    <div className="station-master-page">
      <div className="sm-page-container">

        {/* Header */}
        <StationHeader
          onResetSelection={() => setSelectedEntity(null)}
          selectedEntity={selectedEntity}
          simTime={status.simulationTime}
        />

        {/* Station Selector */}
        <div className="sm-station-selector-card">
          <div className="sm-selector-left">
            <span className="sm-selector-label font-mono">MONITORING STATION</span>
            <select
              className="sm-station-select font-mono"
              value={selectedStationId}
              onChange={e => setSelectedStationId(e.target.value)}
            >
              {STATION_CHAIN.map(id => {
                const st = STATIONS[id];
                return (
                  <option key={id} value={id}>
                    {st.name} (KM {st.kmPost}) — {st.role}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="sm-selector-right font-mono">
            <div className="sm-station-summary-chips">
              <span className="sm-chip sm-chip-blue">{atStation.length} AT STATION</span>
              <span className="sm-chip sm-chip-amber">{approaching.length} APPROACHING</span>
              <span className={`sm-chip ${stationAlerts.length > 0 ? 'sm-chip-red' : 'sm-chip-green'}`}>
                {stationAlerts.length} ALERTS
              </span>
            </div>
          </div>
        </div>

        {/* Station Name Bar */}
        <div className="sm-station-name-bar">
          <div className="sm-station-name-left">
            <h2 className="sm-station-title">{stationDef?.name?.toUpperCase() || selectedStationId}</h2>
            <div className="sm-station-meta font-mono">
              <span>KM {stationDef?.kmPost}</span>
              <span className="meta-sep">·</span>
              <span>{stationDef?.role || 'INTERMEDIATE'}</span>
              <span className="meta-sep">·</span>
              <span>{(stationDef?.platforms || []).length} PLATFORMS</span>
            </div>
          </div>
          <div className="sm-station-name-right font-mono">
            <span className={`sm-utilization-badge ${
              stationState?.utilizationPct > 70 ? 'util-high' :
              stationState?.utilizationPct > 30 ? 'util-mid' : 'util-low'
            }`}>
              {stationState?.utilizationPct || 0}% UTILIZATION
            </span>
          </div>
        </div>

        {/* Platform Grid */}
        <div className="sm-platforms-section">
          <div className="sm-section-title font-mono">PLATFORM STATUS</div>
          <div className="sm-platforms-grid">
            {platforms.length > 0
              ? platforms.map((plat, idx) => (
                  <PlatformCard key={plat.id} platform={plat} idx={idx} />
                ))
              : (stationDef?.platforms || ['P1', 'P2']).map((pid, idx) => (
                  <PlatformCard
                    key={pid}
                    platform={{ id: pid, state: 'CLEAR', trainId: null, signal: 'GREEN' }}
                    idx={idx}
                  />
                ))
            }
          </div>
        </div>

        {/* Bottom split: Arrivals + Alerts */}
        <div className="sm-bottom-split-grid">
          {/* Arrivals / Departures */}
          <div className="sm-split-left">
            <div className="sm-arrivals-card">
              <div className="sm-section-title font-mono">APPROACHING TRAINS</div>
              {approaching.length === 0 ? (
                <div className="sm-empty-state font-mono">No trains approaching in the next 15 minutes</div>
              ) : (
                <div className="sm-approaching-list">
                  <div className="sm-appr-header font-mono">
                    <span>TRAIN</span>
                    <span>TYPE</span>
                    <span>SPEED</span>
                    <span>ETA</span>
                    <span>STATUS</span>
                  </div>
                  {approaching.slice(0, 6).map(t => (
                    <ApproachingTrainRow key={t.id} train={t} />
                  ))}
                </div>
              )}

              {/* Trains currently at station */}
              {atStation.length > 0 && (
                <>
                  <div className="sm-section-title font-mono" style={{ marginTop: 16 }}>AT STATION NOW</div>
                  <div className="sm-at-station-list">
                    {atStation.map(t => (
                      <div key={t.id} className="sm-at-station-row font-mono">
                        <span className="sm-at-id font-bold">{t.id}</span>
                        <span className="sm-at-type">{t.type}</span>
                        <span className="sm-at-plat">P{t.platform || '?'}</span>
                        <span className="sm-at-dwell">{Math.round(t.dwellTime || 0)}s DWELL</span>
                        <span className={`sm-at-status ${(t.delay || 0) > 0 ? 'sm-delayed' : 'sm-ontime'}`}>
                          {(t.delay || 0) > 0 ? `DELAYED +${Math.round(t.delay)} MIN` : 'ON TIME'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alerts */}
          <div className="sm-split-right">
            <StationAlerts
              alerts={stationAlerts}
              selectedEntity={selectedEntity}
              onSelectAlert={(a) => setSelectedEntity(a.id)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
