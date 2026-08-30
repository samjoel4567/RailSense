import React, { useState, useEffect } from 'react';

/**
 * Single Model Metric Tile with animated percentage counter and informational tooltip.
 */
export default function ModelMetric({ label, value, tooltip, loading = false, tag = 'SIL-4' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize target value to percentage (0 - 100)
  const targetPct = typeof value === 'number'
    ? (value <= 1 ? value * 100 : value)
    : null;

  // Animate count-up from 0 to actual target percentage
  useEffect(() => {
    if (loading || targetPct === null || isNaN(targetPct)) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp = null;
    const duration = 1200; // ms

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(easeProgress * targetPct);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetPct);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetPct, loading]);

  if (loading) {
    return (
      <div className="model-metric-tile is-skeleton">
        <div className="metric-skeleton-header" />
        <div className="metric-skeleton-value" />
        <div className="metric-skeleton-bar" />
      </div>
    );
  }

  const formattedValue = targetPct !== null
    ? `${displayValue.toFixed(2)}%`
    : '–';

  return (
    <div
      className="model-metric-tile"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="metric-tile-top">
        <span className="metric-tile-label font-mono">{label}</span>
        <button
          type="button"
          className="metric-info-btn"
          aria-label={`Information about ${label}`}
          onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
        >
          ⓘ
        </button>
      </div>

      <div className="metric-tile-body">
        <div className="metric-tile-value font-mono font-bold">
          {formattedValue}
        </div>
      </div>

      {/* Metric Progress Bar */}
      <div className="metric-progress-track">
        <div
          className="metric-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, displayValue))}%` }}
        />
      </div>

      {/* Floating Tooltip */}
      {showTooltip && tooltip && (
        <div className="metric-floating-tooltip font-mono">
          <div className="tooltip-title">{label.toUpperCase()}</div>
          <div className="tooltip-content">{tooltip}</div>
        </div>
      )}
    </div>
  );
}
