import React from 'react';
import { STATION_CHAIN, STATIONS } from '../../simulator/networkModel';
import { formatClockTime } from '../services/customerApi';

/**
 * Horizontal Live Journey Progress visualization component.
 * Displays stations along the train's route with departure and arrival status.
 */
export default function JourneyProgress({ train }) {
  if (!train) return null;

  const originId = train.originId || 'STATION_A';
  const destId = train.destinationId || 'STATION_J';
  const oIdx = STATION_CHAIN.indexOf(originId);
  const dIdx = STATION_CHAIN.indexOf(destId);

  if (oIdx === -1 || dIdx === -1) return null;

  // Build ordered list of stations along this train's route
  const step = dIdx > oIdx ? 1 : -1;
  const routeStations = [];
  for (let i = oIdx; i !== dIdx + step; i += step) {
    routeStations.push(STATION_CHAIN[i]);
  }

  // Estimate which station the train is currently at or between
  const positionPct = train.positionPct ?? 50;
  const currentStationIndex = Math.min(
    routeStations.length - 1,
    Math.floor((positionPct / 100) * (routeStations.length - 1))
  );

  return (
    <div className="journey-progress-container">
      <div className="progress-header font-mono">
        <span>LIVE JOURNEY PROGRESS</span>
        <span className="progress-train-tag">{train.trainNumber}</span>
      </div>

      <div className="progress-track-visual">
        <div className="track-line-bg" />
        <div 
          className="track-line-active" 
          style={{ width: `${Math.min(100, Math.max(5, positionPct))}%` }} 
        />

        <div className="progress-stations-grid">
          {routeStations.map((stId, index) => {
            const station = STATIONS[stId];
            const isOrigin = index === 0;
            const isDestination = index === routeStations.length - 1;
            const isPassed = index < currentStationIndex;
            const isCurrent = index === currentStationIndex;
            const isFuture = index > currentStationIndex;

            // Compute estimated stop time
            const baseMins = index * 12;
            const stopEta = isOrigin 
              ? train.scheduledDeparture 
              : isDestination 
                ? train.predictedArrival 
                : formatClockTime(train.scheduledDeparture, baseMins + (train.expectedDelayMinutes || 0));

            return (
              <div 
                key={stId} 
                className={`progress-station-node ${
                  isPassed ? 'node-passed' : isCurrent ? 'node-current' : 'node-future'
                }`}
              >
                <div className="node-marker-wrap">
                  {isPassed ? (
                    <div className="node-marker marker-passed font-mono">✓</div>
                  ) : isCurrent ? (
                    <div className="node-marker marker-current">
                      <span className="current-pulse" />
                      <span className="current-dot" />
                    </div>
                  ) : (
                    <div className="node-marker marker-future">○</div>
                  )}
                </div>

                <div className="node-info">
                  <span className="node-name font-bold">{station?.name || stId}</span>
                  <span className="node-status font-mono">
                    {isPassed ? (
                      `Departed ${stopEta}`
                    ) : isCurrent ? (
                      `Approaching • ETA ${stopEta}`
                    ) : isDestination ? (
                      `Destination • ETA ${stopEta}`
                    ) : (
                      `ETA ${stopEta}`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
