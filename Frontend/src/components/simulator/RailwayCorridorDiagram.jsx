import React, { useState } from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function RailwayCorridorDiagram({ onSelectEntity }) {
  const { state, status } = useSimulation();

  const express201 = state.trains.find((t) => t.id === 'EXPRESS_201') || {};
  const local102 = state.trains.find((t) => t.id === 'LOCAL_102') || {};
  const local101 = state.trains.find((t) => t.id === 'LOCAL_101') || {};
  const express202 = state.trains.find((t) => t.id === 'EXPRESS_202') || {};

  const currentPhase = status.phase;

  // Track positions (0% at Vikhroli, 100% at Nahur)
  // Express 201 moves from left (Vikhroli 0%) to right (Nahur 100%) on DN MAIN
  const expProgress = express201.progressPct || 65;
  const expLeftPct = Math.min(88, Math.max(6, expProgress));

  // Local 102 moves from right (Nahur 100%) to left (Vikhroli 0%) on UP MAIN
  const locProgress = local102.progressPct || 35;
  const locLeftPct = Math.min(88, Math.max(6, 100 - locProgress));

  // Stations reference definitions
  const stations = [
    { id: 'VKR', name: 'VIKHROLI', code: 'VKR', km: '0.0', left: '10%', note: 'STATION B (ORIGIN)' },
    { id: 'KJM', name: 'KANJUR_MARG', code: 'KJM', km: '7.2', left: '38%', note: 'MIDPOINT BLOCK' },
    { id: 'BPL', name: 'BHANDUP', code: 'BPL', km: '12.4', left: '64%', note: 'JUNCTION J-02' },
    { id: 'NHR', name: 'NAHUR', code: 'NHR', km: '18.7', left: '90%', note: 'STATION C (DESTINATION)' }
  ];

  return (
    <div className="sim-corridor-card">
      
      {/* Top Corridor Header */}
      <div className="corridor-card-header">
        <div className="corridor-header-left">
          <span className="corridor-badge font-mono font-bold">OPERATIONAL TOPOLOGY</span>
          <h2 className="corridor-title">RAILWAY CORRIDOR</h2>
          <span className="corridor-corridor-route font-mono">
            CSMT ➔ VIKHROLI ➔ KANJUR_MARG ➔ BHANDUP ➔ NAHUR ➔ KALYAN
          </span>
        </div>

        <div className="corridor-header-right font-mono">
          <div className="corridor-meta-chip">
            <span className="meta-dot bg-green"></span>
            <span>SECTION B // 24.8 KM DUAL-PAIR CORRIDOR</span>
          </div>
          <div className="corridor-meta-chip">
            <span>SPEED CEILING: 140 KM/H</span>
          </div>
        </div>
      </div>

      {/* Main Track Visualization Canvas */}
      <div className="corridor-canvas-container">
        
        {/* Top Stations Reference Axis */}
        <div className="stations-reference-axis font-mono">
          {stations.map((st) => (
            <div 
              key={st.id} 
              className="station-axis-node"
              style={{ left: st.left }}
              onClick={() => onSelectEntity && onSelectEntity({ type: 'station', data: st })}
            >
              <div className="axis-station-card">
                <span className="axis-station-name font-bold">{st.name}</span>
                <span className="axis-station-code">{st.code} · KM {st.km}</span>
                <span className="axis-station-sub text-muted">{st.note}</span>
              </div>
              <div className="axis-vertical-guideline"></div>
            </div>
          ))}
        </div>

        {/* 4 Parallel Tracks Diagram Area */}
        <div className="corridor-tracks-board">
          
          {/* =========================================================================
              TRACK 1: UP MAIN (Northbound / Leftwards ◀)
              ========================================================================= */}
          <div 
            className={`track-corridor-row ${currentPhase === 5 ? 'track-caution' : 'track-normal'}`}
            onClick={() => onSelectEntity && onSelectEntity({ type: 'track', data: { name: 'UP MAIN', dir: 'NORTHBOUND (UP)', speed: '140 KM/H', status: 'ACTIVE TRAFFIC' } })}
          >
            <div className="track-name-badge font-mono">
              <span className="track-badge-title font-bold">UP MAIN</span>
              <span className="track-badge-dir">◀ UP (NORTH)</span>
            </div>

            <div className="track-rail-bed">
              <div className="steel-rail rail-top"></div>
              <div className="track-sleepers-layer"></div>
              <div className="steel-rail rail-bottom"></div>

              {/* Directional Chevrons */}
              <div className="track-direction-arrows font-mono">
                <span>◀ ◀ ◀ NAHUR TO VIKHROLI (NORTHBOUND MAIN) ◀ ◀ ◀</span>
              </div>

              {/* Moving Train: LOCAL_102 on UP MAIN */}
              <div 
                className="corridor-train-card card-local-train"
                style={{ left: `${locLeftPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity && onSelectEntity({ type: 'train', data: local102 });
                }}
              >
                <div className="train-card-header font-mono">
                  <span className="t-icon">🚆</span>
                  <span className="t-id font-bold">{local102.id}</span>
                  <span className="t-type font-mono">COMMUTER</span>
                  <span className="t-spd font-bold">{local102.speed} KM/H</span>
                  <span className="t-dir-badge">UP</span>
                </div>
                <div className="train-card-meta font-mono">
                  <span className="t-dest">TO: VIKHROLI (P2)</span>
                  <span className="t-eta">ETA: {local102.eta}</span>
                </div>
                <div className="train-card-progress font-mono">
                  <span>{local102.progressPct}% CORRIDOR TRAVERSED</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              TRACK 2: UP LOOP (Northbound / Standby)
              ========================================================================= */}
          <div 
            className="track-corridor-row track-loop-clear"
            onClick={() => onSelectEntity && onSelectEntity({ type: 'track', data: { name: 'UP LOOP', dir: 'NORTHBOUND (UP LOOP)', speed: '90 KM/H', status: 'STANDBY / CLEAR' } })}
          >
            <div className="track-name-badge font-mono">
              <span className="track-badge-title font-bold">UP LOOP</span>
              <span className="track-badge-dir">◀ UP (LOOP)</span>
            </div>

            <div className="track-rail-bed">
              <div className="steel-rail rail-top"></div>
              <div className="track-sleepers-layer"></div>
              <div className="steel-rail rail-bottom"></div>

              <div className="track-empty-label font-mono">
                <span className="loop-status-dot bg-green"></span>
                <span>UP LOOP TRACK // CLEAR & AVAILABLE FOR REGULATION</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              JUNCTION J-02 CROSSOVER INTERLOCKING (AT BHANDUP KM 12.4)
              ========================================================================= */}
          <div className={`corridor-junction-overlay ${currentPhase === 4 ? 'is-conflict-active' : ''}`}>
            <div className="junction-marker-box font-mono" style={{ left: '64%' }}>
              <div className="junction-mast">
                <span className="j-title font-bold">JUNCTION J-02</span>
                <span className="j-km">KM 12.4</span>
                {currentPhase === 4 && (
                  <span className="j-conflict-pill">⚠️ CONFLICT (87%)</span>
                )}
              </div>
            </div>
          </div>

          {/* =========================================================================
              TRACK 3: DN LOOP (Southbound / Standby)
              ========================================================================= */}
          <div 
            className="track-corridor-row track-loop-clear"
            onClick={() => onSelectEntity && onSelectEntity({ type: 'track', data: { name: 'DN LOOP', dir: 'SOUTHBOUND (DN LOOP)', speed: '90 KM/H', status: 'STANDBY / CLEAR' } })}
          >
            <div className="track-name-badge font-mono">
              <span className="track-badge-title font-bold">DN LOOP</span>
              <span className="track-badge-dir">DN ▶ (LOOP)</span>
            </div>

            <div className="track-rail-bed">
              <div className="steel-rail rail-top"></div>
              <div className="track-sleepers-layer"></div>
              <div className="steel-rail rail-bottom"></div>

              <div className="track-empty-label font-mono">
                <span className="loop-status-dot bg-green"></span>
                <span>DN LOOP TRACK // STANDBY / ROUTE UNLOCKED</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              TRACK 4: DN MAIN (Southbound / Rightwards ▶)
              ========================================================================= */}
          <div 
            className={`track-corridor-row ${currentPhase === 5 ? 'track-hazard' : currentPhase === 4 ? 'track-caution' : 'track-secured'}`}
            onClick={() => onSelectEntity && onSelectEntity({ type: 'track', data: { name: 'DN MAIN', dir: 'SOUTHBOUND (DN)', speed: '140 KM/H', status: currentPhase === 5 ? 'OBSTACLE HAZARD' : 'ROUTE SECURED' } })}
          >
            <div className="track-name-badge font-mono">
              <span className="track-badge-title font-bold">DN MAIN</span>
              <span className="track-badge-dir">DN ▶ (SOUTH)</span>
            </div>

            <div className="track-rail-bed">
              <div className="steel-rail rail-top"></div>
              <div className="track-sleepers-layer"></div>
              <div className="steel-rail rail-bottom"></div>

              {/* Directional Chevrons */}
              <div className="track-direction-arrows font-mono">
                <span>▶ ▶ ▶ VIKHROLI TO NAHUR (SOUTHBOUND MAIN) ▶ ▶ ▶</span>
              </div>

              {/* Phase 5 Track Hazard / Obstacle Indicator */}
              {currentPhase === 5 && (
                <div className="corridor-obstacle-pin font-mono" style={{ left: '88%' }}>
                  <div className="obstacle-icon-bubble">
                    <span className="obs-icon">⚠️</span>
                    <span className="obs-txt font-bold">AI VISION OBSTACLE (KM 18.2)</span>
                  </div>
                  <div className="obstacle-stem"></div>
                </div>
              )}

              {/* Moving Train: EXPRESS_201 on DN MAIN */}
              <div 
                className={`corridor-train-card card-express-train ${currentPhase === 5 ? 'train-restricted' : currentPhase === 4 ? 'train-conflict-priority' : ''}`}
                style={{ left: `${expLeftPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEntity && onSelectEntity({ type: 'train', data: express201 });
                }}
              >
                <div className="train-card-header font-mono">
                  <span className="t-icon">🚆</span>
                  <span className="t-id font-bold">{express201.id}</span>
                  <span className="t-type font-mono">INTERCITY</span>
                  <span className="t-spd font-bold">{express201.speed} KM/H</span>
                  <span className="t-dir-badge">DN</span>
                </div>
                <div className="train-card-meta font-mono">
                  <span className="t-dest">TO: NAHUR (P1)</span>
                  <span className="t-eta">ETA: {express201.eta}</span>
                </div>
                <div className="train-card-progress font-mono">
                  <span>{express201.progressPct}% CORRIDOR TRAVERSED</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          LOWER SECTION: STATION APPROACH & LIFECYCLE CONNECTOR
          ========================================================================= */}
      <div className="corridor-lifecycle-bar font-mono">
        
        {/* Origin Station B Platform Box */}
        <div className="lifecycle-station-box">
          <div className="station-box-title">
            <span className="s-icon">🏛️</span>
            <span className="font-bold">STATION B (VIKHROLI)</span>
          </div>
          <div className="station-box-content">
            <div className="plat-inline-status">
              <span className="plat-tag">P1:</span>
              <span className={`plat-val ${local101.delay > 0 ? 'text-amber font-bold' : ''}`}>
                {local101.id} ({local101.status}) {local101.delayFormatted !== '0 min' ? `[${local101.delayFormatted}]` : ''}
              </span>
            </div>
            <div className="plat-inline-status">
              <span className="plat-tag">P2:</span>
              <span className="plat-val text-green font-bold">CLEAR / STANDBY</span>
            </div>
          </div>
        </div>

        {/* Lifecycle Flow Arrow */}
        <div className="lifecycle-arrow-connector">
          <span className="flow-text">CORRIDOR TRANSIT</span>
          <span className="flow-arrow">➔ ➔ ➔</span>
        </div>

        {/* Section Approach Connector Card */}
        <div className="lifecycle-approach-card">
          <div className="approach-card-header font-bold text-blue">
            APPROACHING STATION C (NAHUR)
          </div>
          <div className="approach-card-steps">
            <span className="step-tag">SECTION B (DN MAIN)</span>
            <span className="step-arr">↓</span>
            <span className="step-tag">APPROACH TRACK 1</span>
            <span className="step-arr">↓</span>
            <span className="step-tag tag-dest font-bold">PLATFORM C1 (RESERVED)</span>
          </div>
        </div>

        {/* Lifecycle Flow Arrow */}
        <div className="lifecycle-arrow-connector">
          <span className="flow-text">BERTH ALLOCATION</span>
          <span className="flow-arrow">➔ ➔ ➔</span>
        </div>

        {/* Destination Station C Platform Box */}
        <div className="lifecycle-station-box">
          <div className="station-box-title">
            <span className="s-icon">🏛️</span>
            <span className="font-bold">STATION C (NAHUR)</span>
          </div>
          <div className="station-box-content">
            <div className="plat-inline-status">
              <span className="plat-tag">P1:</span>
              <span className="plat-val text-blue font-bold">RESERVED FOR EXPRESS_201</span>
            </div>
            <div className="plat-inline-status">
              <span className="plat-tag">P2:</span>
              <span className="plat-val text-green font-bold">{express202.id} (BOARDING)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
