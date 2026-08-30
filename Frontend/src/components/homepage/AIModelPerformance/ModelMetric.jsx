import React, { useState, useEffect } from 'react';

/**
 * Single Model Metric Tile with animated counter, progress indicator, and informational tooltip.
 * Supports both percentage metrics (formatted to 1 decimal place) and absolute sample counts.
 */
export default function ModelMetric({
  label,
  value,
  tooltip,
  loading = false,
  isCount = false,
  decimalPlaces = 1
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Normalize target value
  const targetVal = typeof value === 'number'
    ? (isCount ? value : (value <= 1 ? value * 100 : value))
    : null;

  // Animate count-up from 0 to target value
  useEffect(() => {
    if (loading || targetVal === null || isNaN(targetVal)) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp = null;
    const duration = 1000; // ms

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(easeProgress * targetVal);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetVal);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetVal, loading, isCount]);

  if (loading) {
    return (
      <div className="model-metric-tile is-skeleton">
        <div className="metric-skeleton-header" />
        <div className="metric-skeleton-value" />
        <div className="metric-skeleton-bar" />
      </div>
    );
  }

  const formattedValue = targetVal !== null
    ? (isCount
        ? Number(Math.round(displayValue)).toLocaleString()
        : `${displayValue.toFixed(decimalPlaces)}%`)
    : '–';

  const progressPercent = isCount
    ? 100
    : Math.min(100, Math.max(0, displayValue));

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
          style={{ width: `${progressPercent}%` }}
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

