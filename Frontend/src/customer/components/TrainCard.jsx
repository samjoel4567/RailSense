import React from 'react';
import ETAStatus from './ETAStatus';
import { useCustomerData } from '../context/CustomerDataContext';

export default function TrainCard({ trip, onSelectDetails }) {
  const { pinnedTrainIds, togglePinTrain, isLiveBackend, secondsAgo } = useCustomerData();

  if (!trip) return null;

  const isPinned = pinnedTrainIds.includes(trip.id);
  const isDelayed = (trip.expectedDelayMinutes || 0) > 0;

  // Use leg times if from search, otherwise full train times
  const departureTime = trip.legDeparture || trip.scheduledDeparture;
  const arrivalTime = trip.legArrival || trip.scheduledArrival;
  const predictedArrivalTime = trip.legPredictedArrival || trip.predictedArrival;
  const originName = trip.searchOrigin || trip.origin;
  const destName = trip.searchDestination || trip.destination;

  return (
    <div className={`customer-train-card ${isDelayed ? 'card-has-delay' : ''}`}>
      {/* Top Strip */}
      <div className="card-top-strip font-mono">
        <div className="train-id-badge">
          <span className="train-icon">🚆</span>
          <span className="train-name font-bold">{trip.id}</span>
          <span className={`train-type-pill pill-${trip.type.toLowerCase()}`}>
            {trip.type}
          </span>
        </div>

        <div className="card-top-right">
          <div className="live-pulse-badge">
            <span className={`status-dot ${isLiveBackend ? 'dot-green' : 'dot-blue'}`} />
            <span>{isLiveBackend ? 'LIVE ML' : 'SIMULATOR'}</span>
          </div>

          <button
            type="button"
            className={`pin-btn ${isPinned ? 'is-pinned' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              togglePinTrain(trip.id);
            }}
            title={isPinned ? 'Remove from My Journey' : 'Pin to My Journey'}
          >
            {isPinned ? '★ PINNED' : '☆ PIN'}
          </button>
        </div>
      </div>

      {/* Main Route Heading */}
      <div className="card-route-row">
        <div className="route-origin font-bold">{originName}</div>
        <div className="route-arrow font-mono">➔</div>
        <div className="route-dest font-bold">{destName}</div>
      </div>

      {/* Grid of Schedule & Predicted ETA */}
      <div className="card-times-grid">
        <div className="time-col">
          <span className="time-label font-mono">DEPARTS</span>
          <span className="time-val font-mono">{departureTime}</span>
          <span className="time-sub font-mono">{trip.platform}</span>
        </div>

        <div className="time-col time-col-sched">
          <span className="time-label font-mono">SCHEDULED ARRIVAL</span>
          <span className="time-val font-mono text-muted">{arrivalTime}</span>
          <span className="time-sub font-mono">Estimated timetable</span>
        </div>

        <div className="time-col time-col-pred">
          <ETAStatus
            scheduledTime={arrivalTime}
            predictedTime={predictedArrivalTime}
            delayMinutes={trip.expectedDelayMinutes}
            delayStatusText={trip.delayStatusText}
          />
        </div>
      </div>

      {/* Card Footer */}
      <div className="card-footer">
        <div className="footer-left font-mono">
          <span className="footer-status-dot" />
          <span>Status: {trip.status}</span>
          <span className="footer-sep">•</span>
          <span>Speed: {trip.currentSpeedKmH} km/h</span>
          <span className="footer-sep">•</span>
          <span>Updated just now</span>
        </div>

        <button
          type="button"
          className="btn-view-details font-mono"
          onClick={() => onSelectDetails(trip.id)}
        >
          <span>VIEW DETAILS</span>
          <span>➔</span>
        </button>
      </div>
    </div>
  );
}
