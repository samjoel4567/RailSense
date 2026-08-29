import React from 'react';
import { useSimulation } from '../../simulator/SimulationContext';

export default function SimulatorInspectModal({ entity, onClose }) {
  const { status } = useSimulation();

  if (!entity) return null;

  const { type, data } = entity;

  return (
    <div className="sim-modal-backdrop" onClick={onClose}>
      <div className="sim-modal-card font-mono" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="sim-modal-header">
          <div className="modal-title-group">
            <span className="modal-type-tag">
              {type === 'train' ? '🚆 TRAIN TELEMETRY' : type === 'station' ? '🏛️ STATION PROFILE' : '🛤️ TRACK TELEMETRY'}
            </span>
            <h3 className="modal-title-text font-bold">
              {type === 'train' ? `${data.id} (${data.name})` : type === 'station' ? `${data.name} (${data.code})` : data.name}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Modal Body */}
        <div className="sim-modal-body">
          {type === 'train' && (
            <div className="modal-specs-grid">
              <div className="spec-row">
                <span className="spec-label">TRAIN ID:</span>
                <span className="spec-val font-bold text-blue">{data.id}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">SERVICE TYPE:</span>
                <span className="spec-val">{data.type}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">CURRENT SPEED:</span>
                <span className="spec-val font-bold">{data.speed} KM/H (LIMIT {data.speedLimit} KM/H)</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">DIRECTION:</span>
                <span className="spec-val">{data.direction} ({data.directionArrow})</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">CORRIDOR LOCATION:</span>
                <span className="spec-val font-bold">{data.section || 'SECTION_B'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">ORIGIN ➔ DESTINATION:</span>
                <span className="spec-val">{data.origin} ➔ {data.destination}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">ETA TO DESTINATION:</span>
                <span className="spec-val text-green font-bold">{data.eta}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">SCHEDULE DELAY:</span>
                <span className={`spec-val font-bold ${data.delay > 0 ? 'text-amber' : 'text-green'}`}>
                  {data.delayFormatted || '0 min'}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">OPERATIONAL STATUS:</span>
                <span className="spec-val font-bold">{data.status}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">SIMULATION PHASE:</span>
                <span className="spec-val text-blue font-bold">PHASE {status.phase} — {status.phaseMeta?.shortTitle}</span>
              </div>
            </div>
          )}

          {type === 'station' && (
            <div className="modal-specs-grid">
              <div className="spec-row">
                <span className="spec-label">STATION NAME:</span>
                <span className="spec-val font-bold text-navy">{data.name}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">STATION CODE:</span>
                <span className="spec-val font-bold text-blue">{data.code}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">KILOMETER POST:</span>
                <span className="spec-val">KM {data.km}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">CORRIDOR ROLE:</span>
                <span className="spec-val font-bold">{data.note}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">INTERLOCKING STATUS:</span>
                <span className="spec-val text-green font-bold">SIL-4 ROUTE SECURED</span>
              </div>
            </div>
          )}

          {type === 'track' && (
            <div className="modal-specs-grid">
              <div className="spec-row">
                <span className="spec-label">TRACK IDENTIFIER:</span>
                <span className="spec-val font-bold text-navy">{data.name}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">RUNNING DIRECTION:</span>
                <span className="spec-val">{data.dir}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">SPEED LIMIT:</span>
                <span className="spec-val font-bold">{data.speed}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">TRACK OCCUPANCY / STATUS:</span>
                <span className="spec-val text-blue font-bold">{data.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sim-modal-footer">
          <button className="sim-btn sim-btn-primary" onClick={onClose}>
            CLOSE INSPECTION
          </button>
        </div>

      </div>
    </div>
  );
}
