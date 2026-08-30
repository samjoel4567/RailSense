import React from 'react';
import JourneyProgress from './JourneyProgress';
import ETAStatus from './ETAStatus';
import { useCustomerData } from '../context/CustomerDataContext';

export default function TrainDetailsModal({ trainId, onClose }) {
  const { trains, isLiveBackend, pinnedTrainIds, togglePinTrain, secondsAgo } = useCustomerData();

  const train = trains.find(t => t.id === trainId || t.id.replace(/_/g, '-') === trainId);

  if (!train) return null;

  const isPinned = pinnedTrainIds.includes(train.id);
  const isDelayed = (train.expectedDelayMinutes || 0) > 0;

  return (
    <div className="train-details-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="train-details-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="details-header">
          <div className="details-header-left">
            <div className="details-badge-strip font-mono">
              <span className={`type-tag tag-${train.type.toLowerCase()}`}>{train.type}</span>
              <span className="status-tag">{train.status}</span>
              <span className={`live-tag ${isLiveBackend ? 'tag-live' : 'tag-demo'}`}>
                {isLiveBackend ? '● LIVE ML' : '● SIMULATOR'}
              </span>
            </div>
            <h2 className="details-train-title font-mono">{train.id}</h2>
            <div className="details-route-subtitle">
              {train.origin} ➔ {train.destination}
            </div>
          </div>

          <div className="details-header-actions">
            <button
              type="button"
              className={`details-pin-btn font-mono ${isPinned ? 'is-pinned' : ''}`}
              onClick={() => togglePinTrain(train.id)}
            >
              {isPinned ? '★ PINNED TO MY JOURNEY' : '☆ PIN JOURNEY'}
            </button>
            <button
              type="button"
              className="details-close-btn"
              onClick={onClose}
              aria-label="Close details"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="details-metrics-grid">
          <div className="detail-card">
            <span className="detail-label font-mono">CURRENT LOCATION</span>
            <span className="detail-val-highlight">{train.currentLocation}</span>
            <span className="detail-sub font-mono">Speed: {train.currentSpeedKmH} km/h</span>
          </div>

          <div className="detail-card">
            <span className="detail-label font-mono">NEXT STOP</span>
            <span className="detail-val-highlight">{train.nextStation}</span>
            <span className="detail-sub font-mono">ETA: {train.nextStationEta}</span>
          </div>

          <div className="detail-card">
            <span className="detail-label font-mono">PREDICTED DESTINATION ETA</span>
            <span className="detail-val-highlight text-blue font-mono font-bold">{train.predictedArrival}</span>
            <span className="detail-sub font-mono">Sched: {train.scheduledArrival}</span>
          </div>

          <div className="detail-card">
            <span className="detail-label font-mono">EXPECTED DELAY</span>
            <span className={`detail-val-highlight font-mono ${isDelayed ? 'text-amber' : 'text-green'}`}>
              {train.delayStatusText}
            </span>
            <span className="detail-sub font-mono">{train.platform}</span>
          </div>
        </div>

        {/* Informational passenger advisory if delayed */}
        {isDelayed && (
          <div className="passenger-advisory font-mono">
            <span className="advisory-icon">ℹ</span>
            <div>
              <strong>Passenger Notice:</strong> Arrival time updated due to operational conditions along corridor.
            </div>
          </div>
        )}

        {/* Journey Progress Horizontal Route */}
        <div className="details-progress-section">
          <JourneyProgress train={train} />
        </div>

        {/* Footer info */}
        <div className="details-footer font-mono">
          <span>Information updated continuously via RAIL//AI Digital Twin Engine</span>
          <button type="button" className="btn-details-dismiss" onClick={onClose}>
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
