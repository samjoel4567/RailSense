import React from 'react';

export default function SimulatorLegend() {
  return (
    <div className="sim-panel-card sim-legend-card">
      <div className="sim-panel-header">
        <div className="sim-panel-title-group font-mono">
          <span className="sim-panel-indicator bg-muted"></span>
          <h3 className="sim-panel-title">OPERATIONAL LEGEND</h3>
        </div>
        <span className="sim-panel-sub font-mono">DIAGRAM SYMBOLOGY</span>
      </div>

      <div className="sim-legend-grid font-mono">
        
        <div className="legend-entry">
          <span className="legend-swatch swatch-clear"></span>
          <span className="legend-name">CLEAR TRACK</span>
        </div>

        <div className="legend-entry">
          <span className="legend-swatch swatch-occupied"></span>
          <span className="legend-name">OCCUPIED TRACK</span>
        </div>

        <div className="legend-entry">
          <span className="legend-swatch swatch-secured"></span>
          <span className="legend-name">ROUTE SECURED</span>
        </div>

        <div className="legend-entry">
          <span className="legend-swatch swatch-restricted"></span>
          <span className="legend-name">RESTRICTED / HAZARD</span>
        </div>

        <div className="legend-entry">
          <span className="legend-sig-dot sig-clear-dot"></span>
          <span className="legend-name">SIGNAL CLEAR (GREEN)</span>
        </div>

        <div className="legend-entry">
          <span className="legend-sig-dot sig-caution-dot"></span>
          <span className="legend-name">SIGNAL CAUTION (AMBER)</span>
        </div>

        <div className="legend-entry">
          <span className="legend-sig-dot sig-stop-dot"></span>
          <span className="legend-name">SIGNAL STOP (RED)</span>
        </div>

        <div className="legend-entry">
          <span className="legend-dir-glyph text-blue">▶ DN</span>
          <span className="legend-name">DOWN DIRECTION (SOUTH)</span>
        </div>

        <div className="legend-entry">
          <span className="legend-dir-glyph text-amber">◀ UP</span>
          <span className="legend-name">UP DIRECTION (NORTH)</span>
        </div>

        <div className="legend-entry">
          <span className="legend-junc-icon">⑂</span>
          <span className="legend-name">JUNCTION / CROSSOVER</span>
        </div>

      </div>
    </div>
  );
}
