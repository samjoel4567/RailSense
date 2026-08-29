import React from 'react';

export default function StationLayout({
  platforms = [],
  selectedPlatformId,
  onSelectPlatform
}) {
  return (
    <div className="sm-layout-card">
      
      {/* Operations Toolbar */}
      <div className="sm-layout-toolbar">
        <div className="layout-toolbar-left">
          <div className="layout-live-dot"></div>
          <span className="layout-title font-mono">STATION B // GEOMETRIC PLATFORM & INTERLOCKING LAYOUT</span>
        </div>

        <div className="layout-toolbar-right font-mono">
          <span className="layout-mode-tag">SCHEMATIC VIEW (STEP 3.1 SHELL)</span>
          <span className="layout-res-tag">RESERVED FOR VISUALIZATION</span>
        </div>
      </div>

      {/* Large Station Operations Area (Reserved for future visualization in Step 3.2) */}
      <div className="sm-layout-viewport">
        <div className="sm-layout-canvas-container">
          
          {/* Station Overview Blueprint Wireframe / Reserved Zone */}
          <div className="sm-canvas-grid-bg">
            <div className="sm-reserved-badge-box font-mono">
              <div className="reserved-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <div className="reserved-text-group">
                <span className="reserved-headline">STATION B PLATFORM & INTERLOCKING OPERATIONS AREA</span>
                <span className="reserved-subtext">Reserved surface for physical platform tracks, interlocking throat switches, catenary feeds & passenger density heatmaps.</span>
              </div>
            </div>

            {/* Platform Track Schematic Skeletons */}
            <div className="sm-platform-schematic-grid">
              {platforms.map((plat) => {
                const isSelected = selectedPlatformId === plat.id;
                return (
                  <div 
                    key={plat.id}
                    className={`sm-schematic-track-lane ${plat.occupancyState === 'OCCUPIED' ? 'is-occupied' : ''} ${isSelected ? 'is-selected-lane' : ''}`}
                    onClick={() => onSelectPlatform && onSelectPlatform(plat.id)}
                  >
                    <div className="lane-header font-mono">
                      <div className="lane-badge">
                        <span className="lane-num">PLATFORM {plat.number}</span>
                        <span className="lane-track-name">[{plat.assignedTrack}]</span>
                      </div>
                      <span className={`lane-state-tag state-${plat.occupancyState.toLowerCase()}`}>
                        {plat.occupancyState}
                      </span>
                    </div>

                    <div className="lane-track-graphic">
                      <div className="lane-rail-line"></div>
                      {plat.occupancyState === 'OCCUPIED' && (
                        <div className="lane-train-block font-mono">
                          <span className="train-block-id">{plat.currentTrainId}</span>
                          <span className="train-block-dwell font-mono">DWELL: +8m</span>
                        </div>
                      )}
                      {plat.occupancyState === 'RESERVED' && (
                        <div className="lane-approach-block font-mono">
                          <span>APPROACHING: {plat.approachingTrainId} (4 MIN)</span>
                        </div>
                      )}
                      {plat.occupancyState === 'CLEAR' && (
                        <div className="lane-clear-block font-mono">
                          <span>STANDBY / TRACK CLEAR</span>
                        </div>
                      )}
                    </div>

                    <div className="lane-footer font-mono">
                      <span>LENGTH: {plat.lengthMeters}M</span>
                      <span>SIGNAL: {plat.signalId} [{plat.signalAspect}]</span>
                      <span>NOTE: {plat.statusNote}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      </div>

      {/* Layout Footer */}
      <div className="sm-layout-footer font-mono">
        <div className="layout-footer-col">
          <span className="footer-lbl">PLATFORM CLEARANCE:</span>
          <span className="footer-val text-green">NOMINAL (BERTH 1 & 2 SECURED)</span>
        </div>
        <div className="layout-footer-col">
          <span className="footer-lbl">JUNCTION INTERLOCKING:</span>
          <span className="footer-val text-amber">SWITCH J-02 PENDING RELEASE</span>
        </div>
        <div className="layout-footer-col">
          <span className="footer-lbl">BALISE COUPLING:</span>
          <span className="footer-val">100% TELEMETRY SYNC</span>
        </div>
      </div>

    </div>
  );
}
