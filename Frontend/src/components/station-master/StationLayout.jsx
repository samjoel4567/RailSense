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
      
      {/* Visual Operations Header Toolbar */}
      <div className="sm-layout-toolbar">
        <div className="layout-toolbar-left">
          <div className="layout-live-dot"></div>
          <span className="layout-title font-mono">
            RAILWAY LIFECYCLE: STATION B (ORIGIN) ➔ SECTION B (24.8 KM) ➔ STATION C (DESTINATION)
          </span>
        </div>

        <div className="layout-toolbar-right font-mono">
          <span className="layout-mode-tag">ETCS L2 ACTIVE BLOCK</span>
          <span className="layout-res-tag">LIFECYCLE SCHEMATIC</span>
        </div>
      </div>

      {/* Main Lifecycle Flow Visual Canvas */}
      <div className="sm-layout-viewport">
        <div className="sm-lifecycle-flow-container">
          
          {/* =========================================================================
              ZONE 1: STATION B (ORIGIN STATION)
              ========================================================================= */}
          <div className="lifecycle-zone zone-station-b">
            <div className="zone-header font-mono">
              <div className="zone-badge">
                <span className="zone-tag">ORIGIN NODE</span>
                <h3 className="zone-title">STATION B</h3>
                <span className="zone-subtitle">[CENTRAL JUNCTION]</span>
              </div>
              <span className="zone-status-text text-amber">1 OCCUPIED / 1 DEPARTING</span>
            </div>

            {/* Station B Platforms Matrix */}
            <div className="station-platforms-grid">
              {stationB.platforms.map((plat) => {
                const isSelected = selectedEntity === plat.id || selectedEntity === plat.trainId;
                return (
                  <div 
                    key={plat.id}
                    className={`platform-bay-card bay-${plat.state.toLowerCase()} ${isSelected ? 'is-selected-bay' : ''}`}
                    onClick={() => onSelectEntity && onSelectEntity(plat.id, plat.trainId)}
                  >
                    <div className="bay-top font-mono">
                      <span className="bay-number">P{plat.number}</span>
                      <span className={`bay-state-pill state-${plat.state.toLowerCase()}`}>
                        {plat.state}
                      </span>
                    </div>

                    <div className="bay-content">
                      {plat.state === 'OCCUPIED' && (
                        <div className="bay-train-info font-mono">
                          <span className="train-id-bold text-amber">{plat.trainId}</span>
                          <span className="train-meta-dim">{plat.trainType} ➔ {plat.destination}</span>
                          <span className="train-dwell-tag">DWELL: +{plat.dwellMinutes}m</span>
                        </div>
                      )}
                      {plat.state === 'DEPARTING' && (
                        <div className="bay-train-info font-mono">
                          <span className="train-id-bold text-green">{plat.trainId}</span>
                          <span className="train-meta-dim">{plat.trainType} ➔ {plat.destination}</span>
                          <span className="train-departing-tag">DEPARTING ➔ SEC B</span>
                        </div>
                      )}
                      {plat.state === 'CLEAR' && (
                        <div className="bay-train-info font-mono">
                          <span className="train-clear-label">TRACK VACANT</span>
                          <span className="train-meta-dim">AVAILABLE / STANDBY</span>
                        </div>
                      )}
                    </div>

                    <div className="bay-footer font-mono">
                      <span>{plat.lengthMeters}M</span>
                      <span>{plat.signalId} [{plat.signalAspect}]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* =========================================================================
              ZONE CONNECTOR: STATION B DEPARTURE THROAT & SIGNAL
              ========================================================================= */}
          <div className="lifecycle-interlocking-junction">
            <div className="junction-arrow-flow">
              <span className="junction-label font-mono">DEPARTURE SWITCH SW-B1</span>
              <div className="junction-signals font-mono">
                <span className="sig-badge sig-amber">SIG-B1 [AMBER: 40 KM/H DIVERGE]</span>
                <span className="sig-badge sig-green">SIG-B2 [CLEAR]</span>
              </div>
            </div>
            <div className="interlocking-path-lines">
              <div className="interlocking-wire wire-down"></div>
              <div className="interlocking-wire wire-up"></div>
            </div>
          </div>

          {/* =========================================================================
              ZONE 2: SECTION B (PROMINENT TRANSIT CORRIDOR - 24.8 KM)
              ========================================================================= */}
          <div className={`lifecycle-zone zone-section-b ${selectedEntity === 'SECTION_B' ? 'is-selected-zone' : ''}`}>
            <div className="zone-header font-mono">
              <div className="zone-badge">
                <span className="zone-tag tag-corridor">TRANSIT CORRIDOR</span>
                <h3 className="zone-title">SECTION B</h3>
                <span className="zone-subtitle">[24.8 KM // SPEED LIMIT 140 KM/H]</span>
              </div>
              <div className="section-meta-right">
                <span className="section-occupancy-pill font-mono">OCCUPIED // 2 ACTIVE TRAINS</span>
                <span className="section-balise-pill font-mono">BALISE B-8842 SYNC</span>
              </div>
            </div>

            {/* High-Speed Double Track Bed */}
            <div className="section-track-bed">
              
              {/* TRACK 1 (SOUTHBOUND ↓: Station B -> Station C) */}
              <div className="corridor-track-lane lane-southbound">
                <div className="lane-id-header font-mono">
                  <div className="track-title-group">
                    <span className="track-direction-icon">↓</span>
                    <span className="track-name">TRACK 1 (SOUTHBOUND ➔ STATION C)</span>
                  </div>
                  <span className="track-status-tag font-mono text-green">ROUTE LOCKED TO STATION C</span>
                </div>

                <div className="railway-steel-track">
                  <div className="steel-rail rail-top"></div>
                  <div className="rail-ties-layer"></div>
                  <div className="steel-rail rail-bottom"></div>

                  {/* Train Moving in Section B: EXPRESS_201 */}
                  <div 
                    className={`transit-train-card card-express ${(selectedEntity === 'EXPRESS_201' || selectedEntity === 'STA_B_P2' || selectedEntity === 'STA_C_P1') ? 'is-focused-train' : ''}`}
                    style={{ left: '58%' }}
                    onClick={() => onSelectEntity && onSelectEntity('EXPRESS_201', 'SECTION_B')}
                  >
                    <div className="train-card-header font-mono">
                      <span className="train-icon">🚆</span>
                      <span className="train-title">EXPRESS_201</span>
                      <span className="train-badge-type">INTERCITY</span>
                    </div>

                    <div className="train-card-metrics font-mono">
                      <div className="metric-row">
                        <span className="m-label">SPEED:</span>
                        <span className="m-val text-bold">118 KM/H</span>
                      </div>
                      <div className="metric-row">
                        <span className="m-label">DESTINATION:</span>
                        <span className="m-val">STATION C [P1]</span>
                      </div>
                      <div className="metric-row">
                        <span className="m-label">ETA TO C:</span>
                        <span className="m-val text-green text-bold">8 MIN</span>
                      </div>
                    </div>

                    <div className="train-card-progress font-mono">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: '65%' }}></div>
                      </div>
                      <span className="progress-text">65% OF SECTION B TRAVERSED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACK 2 (NORTHBOUND ↑: Station C -> Station B) */}
              <div className="corridor-track-lane lane-northbound">
                <div className="lane-id-header font-mono">
                  <div className="track-title-group">
                    <span className="track-direction-icon">↑</span>
                    <span className="track-name">TRACK 2 (NORTHBOUND ➔ STATION B)</span>
                  </div>
                  <span className="track-status-tag font-mono text-amber">APPROACHING JUNCTION B-2</span>
                </div>

                <div className="railway-steel-track">
                  <div className="steel-rail rail-top"></div>
                  <div className="rail-ties-layer"></div>
                  <div className="steel-rail rail-bottom"></div>

                  {/* Train Moving in Section B: LOCAL_102 */}
                  <div 
                    className={`transit-train-card card-local ${(selectedEntity === 'LOCAL_102' || selectedEntity === 'STA_B_P2') ? 'is-focused-train' : ''}`}
                    style={{ left: '32%' }}
                    onClick={() => onSelectEntity && onSelectEntity('LOCAL_102', 'SECTION_B')}
                  >
                    <div className="train-card-header font-mono">
                      <span className="train-icon">🚆</span>
                      <span className="train-title">LOCAL_102</span>
                      <span className="train-badge-type type-local">COMMUTER</span>
                    </div>

                    <div className="train-card-metrics font-mono">
                      <div className="metric-row">
                        <span className="m-label">SPEED:</span>
                        <span className="m-val text-bold">76 KM/H</span>
                      </div>
                      <div className="metric-row">
                        <span className="m-label">DESTINATION:</span>
                        <span className="m-val">STATION B [P2]</span>
                      </div>
                      <div className="metric-row">
                        <span className="m-label">ETA TO B:</span>
                        <span className="m-val text-bold">12 MIN (+2m)</span>
                      </div>
                    </div>

                    <div className="train-card-progress font-mono">
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill progress-amber" style={{ width: '35%' }}></div>
                      </div>
                      <span className="progress-text">35% OF SECTION B TRAVERSED</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* =========================================================================
              ZONE CONNECTOR: STATION C APPROACH THROAT & SIGNAL
              ========================================================================= */}
          <div className="lifecycle-interlocking-junction">
            <div className="junction-arrow-flow">
              <span className="junction-label font-mono">APPROACH SWITCH SW-C1</span>
              <div className="junction-signals font-mono">
                <span className="sig-badge sig-green">SIG-C1 [GREEN: PROCEED TO P1]</span>
                <span className="sig-badge sig-red">SIG-C3 [RESTRICTED]</span>
              </div>
            </div>
            <div className="interlocking-path-lines">
              <div className="interlocking-wire wire-down"></div>
              <div className="interlocking-wire wire-up"></div>
            </div>
          </div>

          {/* =========================================================================
              ZONE 3: STATION C (DESTINATION STATION)
              ========================================================================= */}
          <div className="lifecycle-zone zone-station-c">
            <div className="zone-header font-mono">
              <div className="zone-badge">
                <span className="zone-tag">DESTINATION NODE</span>
                <h3 className="zone-title">STATION C</h3>
                <span className="zone-subtitle">[SOUTH HUB // TERMINAL]</span>
              </div>
              <span className="zone-status-text text-green">P1 PRE-RESERVED FOR INBOUND EXP_201</span>
            </div>

            {/* Station C Platforms Matrix */}
            <div className="station-platforms-grid">
              {stationC.platforms.map((plat) => {
                const isSelected = selectedEntity === plat.id || selectedEntity === plat.reservedForTrainId || selectedEntity === plat.trainId;
                return (
                  <div 
                    key={plat.id}
                    className={`platform-bay-card bay-${plat.state.toLowerCase()} ${isSelected ? 'is-selected-bay' : ''}`}
                    onClick={() => onSelectEntity && onSelectEntity(plat.id, plat.reservedForTrainId || plat.trainId)}
                  >
                    <div className="bay-top font-mono">
                      <span className="bay-number">P{plat.number}</span>
                      <span className={`bay-state-pill state-${plat.state.toLowerCase()}`}>
                        {plat.state}
                      </span>
                    </div>

                    <div className="bay-content">
                      {plat.state === 'RESERVED' && (
                        <div className="bay-train-info font-mono">
                          <span className="train-id-bold text-blue">RESERVED: {plat.reservedForTrainId}</span>
                          <span className="train-meta-dim">INBOUND FROM SECTION B</span>
                          <span className="train-eta-tag">ETA: 8 MIN // PLATFORM SECURED</span>
                        </div>
                      )}
                      {plat.state === 'OCCUPIED' && (
                        <div className="bay-train-info font-mono">
                          <span className="train-id-bold text-green">{plat.trainId}</span>
                          <span className="train-meta-dim">{plat.trainType} ➔ {plat.destination}</span>
                          <span className="train-dwell-tag">BOARDING // DEPART 14:47</span>
                        </div>
                      )}
                      {plat.state === 'CLEAR' && (
                        <div className="bay-train-info font-mono">
                          <span className="train-clear-label">TRACK VACANT</span>
                          <span className="train-meta-dim">AVAILABLE FOR DIVERSION</span>
                        </div>
                      )}
                    </div>

                    <div className="bay-footer font-mono">
                      <span>{plat.lengthMeters}M</span>
                      <span>{plat.signalId} [{plat.signalAspect}]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Lifecycle Diagram Footer Diagnostics */}
      <div className="sm-layout-footer font-mono">
        <div className="layout-footer-col">
          <span className="footer-lbl">LIFECYCLE FLOW:</span>
          <span className="footer-val text-green">STATION B (P1/P2) ➔ SECTION B (24.8 KM) ➔ STATION C (P1/P2)</span>
        </div>
        <div className="layout-footer-col">
          <span className="footer-lbl">INTERLOCKING HEADWAY:</span>
          <span className="footer-val text-amber">4.8 MIN MARGIN ON SECTION B</span>
        </div>
        <div className="layout-footer-col">
          <span className="footer-lbl">PLATFORM REVERSIBILITY:</span>
          <span className="footer-val">ACTIVE (P1 RESERVATION CONFIRMED)</span>
        </div>
      </div>

    </div>
  );
}
