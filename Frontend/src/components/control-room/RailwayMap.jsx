import React from 'react';
import TrainMarker from './TrainMarker';

export default function RailwayMap({
  trains = [],
  stations = [],
  sections = [],
  selectedTrainId,
  selectedSectionId,
  onSelectTrain,
  onSelectSection
}) {
  return (
    <div className="cr-map-card">
      
      {/* Map Control Bar */}
      <div className="cr-map-toolbar">
        <div className="map-toolbar-left">
          <div className="map-live-dot"></div>
          <span className="map-title font-mono">CORRIDOR TOPOLOGY MAP // INTERLOCKING GRID 01</span>
        </div>

        <div className="map-legend font-mono">
          <div className="legend-item">
            <span className="legend-swatch swatch-normal"></span>
            <span>ON TIME</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-warning"></span>
            <span>DELAYED</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-caution"></span>
            <span>MINOR DELAY</span>
          </div>
          <div className="legend-item">
            <span className="legend-signal-dot sig-green"></span>
            <span>SIGNAL CLEAR</span>
          </div>
          <div className="legend-item">
            <span className="legend-signal-dot sig-amber"></span>
            <span>APPROACH CAUTION</span>
          </div>
        </div>
      </div>

      {/* Primary SVG / CSS Interactive Railway Diagram */}
      <div className="cr-map-viewport">
        <div className="cr-map-canvas-container">
          
          <svg className="cr-map-svg-grid" viewBox="0 0 980 340" preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Patterns & Subtle Grid */}
              <pattern id="railSubtleGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(15, 23, 42, 0.04)" strokeWidth="0.8" />
              </pattern>
            </defs>

            <rect width="980" height="340" fill="url(#railSubtleGrid)" />

            {/* SECTION BACKGROUND OCCUPANCY ZONES */}
            {/* Section A Zone: x: 80 to 480 */}
            <rect 
              x="100" y="115" width="360" height="150" 
              rx="6" 
              className={`section-zone-rect ${selectedSectionId === 'SECTION_A' ? 'is-selected-zone' : ''}`}
              onClick={() => onSelectSection && onSelectSection('SECTION_A')}
            />
            {/* Section B Zone: x: 480 to 720 */}
            <rect 
              x="480" y="115" width="180" height="150" 
              rx="6" 
              className={`section-zone-rect is-delayed-zone ${selectedSectionId === 'SECTION_B' ? 'is-selected-zone' : ''}`}
              onClick={() => onSelectSection && onSelectSection('SECTION_B')}
            />
            {/* Section C Zone: x: 660 to 880 */}
            <rect 
              x="660" y="115" width="200" height="150" 
              rx="6" 
              className={`section-zone-rect ${selectedSectionId === 'SECTION_C' ? 'is-selected-zone' : ''}`}
              onClick={() => onSelectSection && onSelectSection('SECTION_C')}
            />

            {/* SECTION LABELS & OCCUPANCY STATUS HEADERS */}
            <g className="section-labels-group font-mono">
              {/* Section A */}
              <text x="260" y="105" textAnchor="middle" className="section-name-text">SECTION A // 18.4 KM</text>
              <text x="260" y="280" textAnchor="middle" className="section-occupancy-text">OCCUPIED: 1 TRAIN (LOCAL_102)</text>

              {/* Section B */}
              <text x="570" y="105" textAnchor="middle" className="section-name-text text-amber-label">SECTION B // 24.8 KM [INTERLOCKING B-2]</text>
              <text x="570" y="280" textAnchor="middle" className="section-occupancy-text text-amber-label">OCCUPIED: 1 TRAIN (LOCAL_101 DELAYED)</text>

              {/* Section C */}
              <text x="760" y="105" textAnchor="middle" className="section-name-text">SECTION C // 32.0 KM</text>
              <text x="760" y="280" textAnchor="middle" className="section-occupancy-text">OCCUPIED: 2 TRAINS (EXPRESS 201/202)</text>
            </g>

            {/* TRACK 1 (DOWN / SOUTHBOUND) */}
            <path 
              d="M 60 170 L 920 170" 
              fill="none" 
              stroke="#cbd5e1" 
              strokeWidth="5" 
              strokeLinecap="round" 
            />
            <path 
              d="M 60 170 L 920 170" 
              fill="none" 
              stroke="#0f172a" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />

            {/* TRACK 2 (UP / NORTHBOUND) */}
            <path 
              d="M 60 240 L 920 240" 
              fill="none" 
              stroke="#cbd5e1" 
              strokeWidth="5" 
              strokeLinecap="round" 
            />
            <path 
              d="M 60 240 L 920 240" 
              fill="none" 
              stroke="#0f172a" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />

            {/* INTERLOCKING CROSSOVER SWITCHES AT JUNCTIONS */}
            {/* Junction A-1 Crossover */}
            <path d="M 120 170 L 150 240" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3 3" />
            
            {/* Junction B-2 Central Crossover (Active Switching) */}
            <path d="M 460 170 L 500 240" fill="none" stroke="#e11d48" strokeWidth="3" />
            <path d="M 500 170 L 460 240" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />

            {/* Junction C-1 Crossover */}
            <path d="M 840 170 L 870 240" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="3 3" />

            {/* RAILWAY SIGNALS (Aspect Mast Nodes) */}
            {/* Station A Signal SIG-A1 */}
            <g transform="translate(100, 142)" className="signal-mast-svg">
              <rect x="0" y="0" width="16" height="24" rx="3" fill="#0f172a" />
              <circle cx="8" cy="8" r="4" fill="#10b981" />
              <circle cx="8" cy="17" r="3" fill="#334155" />
              <text x="22" y="16" className="signal-lbl-text font-mono">SIG-A1 [CLR]</text>
            </g>

            {/* Station B Approach Signal SIG-B1 (Caution / Amber) */}
            <g transform="translate(440, 142)" className="signal-mast-svg">
              <rect x="0" y="0" width="16" height="24" rx="3" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" />
              <circle cx="8" cy="8" r="3" fill="#334155" />
              <circle cx="8" cy="17" r="4.5" fill="#d97706" />
              <text x="-48" y="16" className="signal-lbl-text font-mono text-amber-label">SIG-B1 [CAUT]</text>
            </g>

            {/* Station B Signal SIG-B2 */}
            <g transform="translate(540, 142)" className="signal-mast-svg">
              <rect x="0" y="0" width="16" height="24" rx="3" fill="#0f172a" />
              <circle cx="8" cy="8" r="4" fill="#10b981" />
              <circle cx="8" cy="17" r="3" fill="#334155" />
              <text x="22" y="16" className="signal-lbl-text font-mono">SIG-B2 [CLR]</text>
            </g>

            {/* Station C Signal SIG-C1 */}
            <g transform="translate(700, 142)" className="signal-mast-svg">
              <rect x="0" y="0" width="16" height="24" rx="3" fill="#0f172a" />
              <circle cx="8" cy="8" r="4" fill="#10b981" />
              <circle cx="8" cy="17" r="3" fill="#334155" />
              <text x="22" y="16" className="signal-lbl-text font-mono">SIG-C1 [CLR]</text>
            </g>

            {/* Up Track Signal (Northbound) SIG-A2 */}
            <g transform="translate(240, 248)" className="signal-mast-svg">
              <rect x="0" y="0" width="16" height="24" rx="3" fill="#0f172a" />
              <circle cx="8" cy="8" r="4" fill="#10b981" />
              <circle cx="8" cy="17" r="3" fill="#334155" />
              <text x="22" y="16" className="signal-lbl-text font-mono">SIG-A2 [CLR]</text>
            </g>

            {/* STATION HUBS */}
            {/* STATION A */}
            <g transform="translate(80, 140)" className="station-node-group">
              <rect x="-35" y="-15" width="70" height="130" rx="6" className="station-building-rect" />
              <text x="0" y="38" textAnchor="middle" className="station-code-text font-mono">STA-A</text>
              <text x="0" y="58" textAnchor="middle" className="station-name-text">STATION A</text>
              <text x="0" y="74" textAnchor="middle" className="station-plat-text font-mono">2 PLATFORMS</text>
            </g>

            {/* STATION B */}
            <g transform="translate(480, 140)" className="station-node-group">
              <rect x="-40" y="-15" width="80" height="130" rx="6" className="station-building-rect is-junction-station" />
              <text x="0" y="38" textAnchor="middle" className="station-code-text font-mono">STA-B</text>
              <text x="0" y="58" textAnchor="middle" className="station-name-text">STATION B</text>
              <text x="0" y="74" textAnchor="middle" className="station-plat-text font-mono">JUNCTION // 3 PLATS</text>
            </g>

            {/* STATION C */}
            <g transform="translate(880, 140)" className="station-node-group">
              <rect x="-35" y="-15" width="70" height="130" rx="6" className="station-building-rect" />
              <text x="0" y="38" textAnchor="middle" className="station-code-text font-mono">STA-C</text>
              <text x="0" y="58" textAnchor="middle" className="station-name-text">STATION C</text>
              <text x="0" y="74" textAnchor="middle" className="station-plat-text font-mono">2 PLATFORMS</text>
            </g>

            {/* TRACK DIRECTION ARROWS */}
            <g className="track-direction-indicators font-mono" fill="#64748b">
              <text x="320" y="166">TRACK 1 (SOUTHBOUND) ────────▶</text>
              <text x="320" y="236">◀──────── TRACK 2 (NORTHBOUND)</text>
            </g>

          </svg>

          {/* DYNAMIC TRAIN MARKERS OVERLAY */}
          <div className="cr-train-markers-layer">
            {trains.map((train) => (
              <TrainMarker
                key={train.id}
                train={train}
                isSelected={selectedTrainId === train.id}
                onClick={onSelectTrain}
              />
            ))}
          </div>

        </div>
      </div>

      {/* Map Footer Bar with Interlocking Diagnostics */}
      <div className="cr-map-footer font-mono">
        <div className="map-footer-item">
          <span className="footer-label">INTERLOCKING MATRIX:</span>
          <span className="footer-val text-green">NORMAL OPERATION (99.8% AVAILABILITY)</span>
        </div>
        <div className="map-footer-item">
          <span className="footer-label">SPEED RESTRICTIONS:</span>
          <span className="footer-val">NONE ACTIVE</span>
        </div>
        <div className="map-footer-item">
          <span className="footer-label">POWER FEED:</span>
          <span className="footer-val">25kV AC CONTINUOUS</span>
        </div>
      </div>

    </div>
  );
}
