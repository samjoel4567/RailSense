import React from 'react';

export default function StationLayout({
  stationB,
  sectionB,
  stationC,
  selectedEntity,
  onSelectEntity
}) {
  return (
    <div className="sm-layout-card">
      
      {/* Top Header Bar */}
      <div className="sm-schematic-header font-mono">
        <div className="schematic-header-left">
          <span className="schematic-badge-blue font-bold">TRANSIT CORRIDOR</span>
          <span className="schematic-header-title">
            <strong>SECTION B</strong> [24.8 KM HIGH-SPEED RUNNING // SPEED LIMIT 140 KM/H]
          </span>
        </div>
        
        <div className="schematic-header-right">
          <span className="schematic-badge-blue">TRAVELLING // 2 ACTIVE TRAINS</span>
          <span className="schematic-badge-gray">BALISE B-8842 SYNC</span>
          <span className="schematic-status-green font-bold">IN HIGH-SPEED TRANSIT</span>
        </div>
      </div>

      {/* Main 3-Column Schematic Area */}
      <div className="sm-schematic-viewport">
        <div className="sm-3col-corridor-grid">
          
          {/* =========================================================================
              COLUMN 1: STATION B (ORIGIN) - LEFT
              ========================================================================= */}
          <div className="sm-col-station sm-col-station-b">
            <div className="sm-station-header-bar bg-station-b font-mono">
              <span className="station-icon">🏛️</span>
              <span className="station-name-text">STATION B (ORIGIN)</span>
            </div>
            
            <div className="sm-station-subtitle font-mono">
              PLATFORMS (DEPARTURE / ARRIVAL)
            </div>

            <div className="sm-platforms-stack">
              {/* Platform 1 */}
              <div 
                className={`sm-plat-box plat-p1 ${(selectedEntity === 'STA_B_P1' || selectedEntity === 'LOCAL_101') ? 'is-selected' : ''}`}
                onClick={() => onSelectEntity && onSelectEntity('STA_B_P1', 'LOCAL_101')}
              >
                <div className="sm-plat-head font-mono">
                  <span className="sm-plat-num text-blue">P1</span>
                  <span className="sm-plat-badge badge-green-outline">CLEAR</span>
                </div>
                <div className="sm-plat-body font-mono">
                  <span className="plat-status-text">AVAILABLE</span>
                  <span className="plat-note-text text-muted">FOR ALLOCATION</span>
                </div>
                <div className="sm-plat-foot font-mono">
                  <span>SIG-B1 [GREEN]</span>
                  <span>360M</span>
                </div>
              </div>

              {/* Platform 2 */}
              <div 
                className={`sm-plat-box plat-p2 is-occupied-box ${(selectedEntity === 'STA_B_P2' || selectedEntity === 'LOCAL_102' || selectedEntity === 'EXPRESS_201') ? 'is-selected' : ''}`}
                onClick={() => onSelectEntity && onSelectEntity('STA_B_P2', 'LOCAL_102')}
              >
                <div className="sm-plat-head font-mono">
                  <span className="sm-plat-num text-amber">P2</span>
                  <span className="sm-plat-badge badge-amber-outline">OCCUPIED</span>
                </div>
                <div className="sm-plat-body font-mono">
                  <span className="plat-train-id font-bold text-amber">LOCAL_102</span>
                  <span className="plat-note-text">BOARDING / DEPART 09:12</span>
                </div>
                <div className="sm-plat-foot font-mono">
                  <span>SIG-B2 [GREEN]</span>
                  <span>360M</span>
                </div>
              </div>

              {/* Platform 3 */}
              <div 
                className={`sm-plat-box plat-p3 ${(selectedEntity === 'STA_B_P3') ? 'is-selected' : ''}`}
                onClick={() => onSelectEntity && onSelectEntity('STA_B_P3')}
              >
                <div className="sm-plat-head font-mono">
                  <span className="sm-plat-num text-blue">P3</span>
                  <span className="sm-plat-badge badge-green-outline">CLEAR</span>
                </div>
                <div className="sm-plat-body font-mono">
                  <span className="plat-status-text">AVAILABLE</span>
                  <span className="plat-note-text text-muted">FOR ALLOCATION</span>
                </div>
                <div className="sm-plat-foot font-mono">
                  <span>SIG-B3 [GREEN]</span>
                  <span>360M</span>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              INTERLOCKING CONNECTORS (STATION B ➔ SECTION B)
              ========================================================================= */}
          <div className="sm-crossover-wires-col">
            <svg className="crossover-svg" preserveAspectRatio="none" viewBox="0 0 40 280">
              <path d="M 0 45 C 20 45, 20 45, 40 45" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              <path d="M 0 135 C 20 135, 20 135, 40 135" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              <path d="M 0 225 C 20 225, 20 225, 40 225" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              {/* Converging switch curve */}
              <path d="M 0 45 C 25 45, 25 135, 40 135" fill="none" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
              <path d="M 0 225 C 25 225, 25 135, 40 135" fill="none" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
            </svg>
          </div>

          {/* =========================================================================
              COLUMN 2: SECTION B - 24.8 KM CORRIDOR (MIDDLE 3 TRACKS)
              ========================================================================= */}
          <div className="sm-col-corridor">
            <div className="corridor-main-title font-mono font-bold">
              SECTION B - 24.8 KM CORRIDOR
            </div>

            <div className="corridor-dir-guides font-mono">
              <span className="dir-guide-left">◀ TOWARDS STATION B (NORTHBOUND)</span>
              <span className="dir-guide-right">TOWARDS STATION C (SOUTHBOUND) ▶</span>
            </div>

            <div className="corridor-track-lanes">
              
              {/* TRACK 1 (Southbound: B ➔ C) */}
              <div className="corridor-track-row">
                <div className="track-row-label font-mono">
                  <span className="track-title-text font-bold">TRACK 1</span>
                  <span className="track-sub-dir text-muted">SOUTHBOUND</span>
                  <span className="track-route-tag">B ➔ C</span>
                </div>

                <div className="track-lane-graphic">
                  <div className="track-rail-line track-blue-line"></div>
                  <span className="track-end-arrow arrow-blue">▶</span>

                  {/* Train Marker: EXPRESS_201 */}
                  <div 
                    className={`corridor-train-card card-train-blue ${(selectedEntity === 'EXPRESS_201' || selectedEntity === 'STA_C_P1') ? 'is-focused' : ''}`}
                    style={{ left: '55%' }}
                    onClick={() => onSelectEntity && onSelectEntity('EXPRESS_201', 'SECTION_B')}
                  >
                    <div className="train-card-top-line font-mono">
                      <span className="train-icon">🚆</span>
                      <span className="train-id font-bold">EXPRESS_201</span>
                      <span className="train-spd font-bold">118 KM/H</span>
                    </div>
                    <div className="train-card-bot-line font-mono">
                      <span>65% TRAVERSED</span>
                      <span className="train-eta">ETA C: 8 MIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACK 2 (Northbound: C ➔ B) */}
              <div className="corridor-track-row">
                <div className="track-row-label font-mono">
                  <span className="track-title-text font-bold">TRACK 2</span>
                  <span className="track-sub-dir text-muted">NORTHBOUND</span>
                  <span className="track-route-tag">C ➔ B</span>
                </div>

                <div className="track-lane-graphic">
                  <div className="track-rail-line track-amber-line"></div>
                  <span className="track-start-arrow arrow-amber">◀</span>

                  {/* Train Marker: LOCAL_102 */}
                  <div 
                    className={`corridor-train-card card-train-amber ${(selectedEntity === 'LOCAL_102' || selectedEntity === 'STA_B_P2') ? 'is-focused' : ''}`}
                    style={{ left: '20%' }}
                    onClick={() => onSelectEntity && onSelectEntity('LOCAL_102', 'SECTION_B')}
                  >
                    <div className="train-card-top-line font-mono">
                      <span className="train-icon">🚆</span>
                      <span className="train-id font-bold">LOCAL_102</span>
                      <span className="train-spd font-bold">76 KM/H</span>
                    </div>
                    <div className="train-card-bot-line font-mono">
                      <span>35% TRAVERSED</span>
                      <span className="train-eta">ETA B: 12 MIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACK 3 (Northbound / Standby) */}
              <div className="corridor-track-row">
                <div className="track-row-label font-mono">
                  <span className="track-title-text font-bold">TRACK 3</span>
                  <span className="track-sub-dir text-muted">NORTHBOUND</span>
                  <span className="track-route-tag">C ➔ B</span>
                </div>

                <div className="track-lane-graphic">
                  <div className="track-rail-line track-gray-line"></div>
                  <span className="track-start-arrow arrow-gray">◀</span>

                  <div className="track-empty-status font-mono">
                    <span className="empty-title">CLEAR / AVAILABLE</span>
                    <span className="empty-sub text-muted">NO ACTIVE MOVEMENT</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              INTERLOCKING CONNECTORS (SECTION B ➔ STATION C)
              ========================================================================= */}
          <div className="sm-crossover-wires-col">
            <svg className="crossover-svg" preserveAspectRatio="none" viewBox="0 0 40 280">
              <path d="M 0 45 C 20 45, 20 45, 40 45" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              <path d="M 0 135 C 20 135, 20 135, 40 135" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              <path d="M 0 225 C 20 225, 20 225, 40 225" fill="none" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              {/* Diverging switch curves to Station C platforms */}
              <path d="M 0 45 C 15 45, 15 135, 40 135" fill="none" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
              <path d="M 0 45 C 15 45, 15 225, 40 225" fill="none" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth="1.5" />
            </svg>
          </div>

          {/* =========================================================================
              COLUMN 3: STATION C (DESTINATION) - RIGHT
              ========================================================================= */}
          <div className="sm-col-station sm-col-station-c">
            <div className="sm-station-header-bar bg-station-c font-mono">
              <span className="station-icon">🏛️</span>
              <span className="station-name-text">STATION C (DESTINATION)</span>
            </div>
            
            <div className="sm-station-subtitle font-mono">
              PLATFORMS (ARRIVAL / DEPARTURE)
            </div>

            <div className="sm-platforms-stack">
              {/* Platform 1 */}
              <div 
                className={`sm-plat-box plat-p1 is-reserved-box ${(selectedEntity === 'STA_C_P1' || selectedEntity === 'EXPRESS_201') ? 'is-selected' : ''}`}
                onClick={() => onSelectEntity && onSelectEntity('STA_C_P1', 'EXPRESS_201')}
              >
                <div className="sm-plat-head font-mono">
                  <span className="sm-plat-num text-blue">P1</span>
                  <span className="sm-plat-badge badge-blue-outline">RESERVED</span>
                </div>
                <div className="sm-plat-body font-mono">
                  <span className="plat-train-id font-bold text-blue">RESERVED: EXPRESS_201</span>
                  <span className="plat-note-text">ETA: 8 MIN</span>
                  <span className="plat-note-text text-green font-bold">PLATFORM SECURED</span>
                </div>
                <div className="sm-plat-foot font-mono">
                  <span>SIG-C1 [GREEN]</span>
                  <span>360M</span>
                </div>
              </div>

              {/* Platform 2 */}
              <div 
                className={`sm-plat-box plat-p2 is-occupied-box ${(selectedEntity === 'STA_C_P2' || selectedEntity === 'EXPRESS_202') ? 'is-selected' : ''}`}
                onClick={() => onSelectEntity && onSelectEntity('STA_C_P2', 'EXPRESS_202')}
              >
                <div className="sm-plat-head font-mono">
                  <span className="sm-plat-num text-amber">P2</span>
                  <span className="sm-plat-badge badge-amber-outline">OCCUPIED</span>
                </div>
                <div className="sm-plat-body font-mono">
                  <span className="plat-train-id font-bold text-green">EXPRESS_202</span>
                  <span className="plat-note-text">BOARDING / DEPART 14:47</span>
                </div>
                <div className="sm-plat-foot font-mono">
                  <span>SIG-C2 [GREEN]</span>
                  <span>360M</span>
                </div>
              </div>

              {/* Platform 3 */}
              <div 
                className={`sm-plat-box plat-p3 ${(selectedEntity === 'STA_C_P3') ? 'is-selected' : ''}`}
                onClick={() => onSelectEntity && onSelectEntity('STA_C_P3')}
              >
                <div className="sm-plat-head font-mono">
                  <span className="sm-plat-num text-blue">P3</span>
                  <span className="sm-plat-badge badge-green-outline">CLEAR</span>
                </div>
                <div className="sm-plat-body font-mono">
                  <span className="plat-status-text">AVAILABLE</span>
                  <span className="plat-note-text text-muted">FOR DIVERSION</span>
                </div>
                <div className="sm-plat-foot font-mono">
                  <span>SIG-C3 [RED]</span>
                  <span>360M</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* =========================================================================
            LOWER SECTION: STATION C APPROACH (INTERLOCKING THROAT)
            ========================================================================= */}
        <div className="sm-approach-interlocking-panel">
          <div className="approach-panel-header font-mono font-bold">
            STATION C APPROACH (INTERLOCKING THROAT)
          </div>

          <div className="approach-feeder-cards-grid">
            
            {/* Card 1: Track 1 -> Platform 1 (Southbound) */}
            <div className={`approach-feeder-card card-blue-feeder ${(selectedEntity === 'EXPRESS_201' || selectedEntity === 'STA_C_P1') ? 'is-selected-feeder' : ''}`}>
              <div className="feeder-title font-mono font-bold">
                TRACK 1 ➔ PLATFORM 1 (SOUTHBOUND)
              </div>
              <div className="feeder-track-visual font-mono">
                <div className="feeder-rail-line rail-blue"></div>
                <div className="feeder-train-pill pill-blue">
                  <span>🚆</span>
                  <span className="font-bold">EXPRESS_201</span>
                </div>
                <span className="feeder-arrow arrow-blue">➔</span>
                <span className="feeder-dest-box dest-blue font-bold">P1</span>
              </div>
              <div className="feeder-badges-row font-mono">
                <span className="f-badge badge-green">ROUTE SECURED</span>
                <span className="f-badge badge-green">SIG-C1 [GREEN]</span>
                <span className="f-badge badge-blue">SPEED RESTRICTION 40 KM/H</span>
              </div>
            </div>

            {/* Card 2: Track 2 -> Platform 2 (Northbound) */}
            <div className={`approach-feeder-card card-amber-feeder ${(selectedEntity === 'LOCAL_102' || selectedEntity === 'STA_C_P2') ? 'is-selected-feeder' : ''}`}>
              <div className="feeder-title font-mono font-bold">
                TRACK 2 ➔ PLATFORM 2 (NORTHBOUND)
              </div>
              <div className="feeder-track-visual font-mono">
                <div className="feeder-rail-line rail-amber"></div>
                <div className="feeder-train-pill pill-amber">
                  <span>🚆</span>
                  <span className="font-bold">LOCAL_102</span>
                </div>
                <span className="feeder-arrow arrow-amber">◀</span>
                <span className="feeder-dest-box dest-amber font-bold">P2</span>
              </div>
              <div className="feeder-badges-row font-mono">
                <span className="f-badge badge-amber">OPPOSITE FLOW</span>
                <span className="f-badge badge-green">SIG-C2 [GREEN]</span>
                <span className="f-badge badge-blue">SPEED RESTRICTION 40 KM/H</span>
              </div>
            </div>

            {/* Card 3: Track 3 -> Platform 3 (Northbound) */}
            <div className="approach-feeder-card card-gray-feeder">
              <div className="feeder-title font-mono font-bold">
                TRACK 3 ➔ PLATFORM 3 (NORTHBOUND)
              </div>
              <div className="feeder-track-visual font-mono">
                <div className="feeder-rail-line rail-gray"></div>
                <span className="feeder-arrow arrow-gray">➔</span>
                <span className="feeder-dest-box dest-gray font-bold">P3</span>
              </div>
              <div className="feeder-badges-row font-mono">
                <span className="f-badge badge-blue">CLEAR</span>
                <span className="f-badge badge-red">SIG-C3 [RED]</span>
                <span className="f-badge badge-blue">AVAILABLE</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Control Room Layout Diagnostics Footer */}
      <div className="sm-layout-footer font-mono">
        <div className="layout-footer-col">
          <span className="footer-lbl">LIFECYCLE FLOW:</span>
          <span className="footer-val font-bold">
            🚆 STATION B (P1/P2/P3) ➔ 🏛️ SECTION B (24.8 KM) ➔ 🏗️ STATION C APPROACH (TR 1/2/3) ➔ 🏛️ STATION C (P1/P2/P3)
          </span>
        </div>
        <div className="layout-footer-col">
          <span className="footer-lbl">INTERLOCKING HEADWAY:</span>
          <span className="footer-val text-amber font-bold">4.8 MIN MARGIN ON SECTION B</span>
        </div>
        <div className="layout-footer-col">
          <span className="footer-lbl">APPROACH FEEDER:</span>
          <span className="footer-val font-bold">TRACK 1 ➔ P1 (EXP_201 LOCKED)</span>
        </div>
      </div>

    </div>
  );
}
