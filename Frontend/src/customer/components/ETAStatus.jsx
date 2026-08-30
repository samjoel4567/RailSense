import React from 'react';

/**
 * Visual ETA Component emphasizing predicted arrival over scheduled arrival.
 */
export default function ETAStatus({
  scheduledTime,
  predictedTime,
  delayMinutes = 0,
  delayStatusText = 'On time',
  isCompact = false
}) {
  const isDelayed = delayMinutes > 0;

  if (isCompact) {
    return (
      <div className="eta-status-compact font-mono">
        <span className="eta-pred font-bold">{predictedTime || scheduledTime || '--:--'}</span>
        {isDelayed ? (
          <span className="eta-badge badge-delayed">+{delayMinutes}m</span>
        ) : (
          <span className="eta-badge badge-ontime">ON TIME</span>
        )}
      </div>
    );
  }

  return (
    <div className="eta-status-block">
      <div className="eta-label font-mono">PREDICTED ARRIVAL</div>
      <div className="eta-time-row">
        <span className="eta-time-main font-mono font-bold">{predictedTime || scheduledTime || '--:--'}</span>
        {isDelayed ? (
          <span className="eta-pill pill-delayed font-mono">
            +{delayMinutes} MIN
          </span>
        ) : (
          <span className="eta-pill pill-ontime font-mono">
            ON TIME
          </span>
        )}
      </div>
      {scheduledTime && scheduledTime !== predictedTime && (
        <div className="eta-sched-row font-mono">
          <span>Scheduled: {scheduledTime}</span>
        </div>
      )}
    </div>
  );
}
