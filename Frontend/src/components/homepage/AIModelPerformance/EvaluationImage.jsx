import React, { useState } from 'react';
import { resolveEvaluationImageUrl } from '../../../services/mlPredictionClient';

/**
 * Image artifact card with responsive layout, hover interaction, and click-to-zoom trigger.
 */
export default function EvaluationImage({
  title,
  description,
  imagePath,
  loading = false,
  onZoom = null
}) {
  const [imageError, setImageError] = useState(false);
  const fullImageUrl = resolveEvaluationImageUrl(imagePath);

  if (loading) {
    return (
      <div className="eval-artifact-card is-skeleton">
        <div className="artifact-header-skeleton" />
        <div className="artifact-image-skeleton" />
        <div className="artifact-desc-skeleton" />
      </div>
    );
  }

  return (
    <div className="eval-artifact-card">
      <div className="eval-artifact-header">
        <h4 className="artifact-title font-mono">{title}</h4>
        <span className="artifact-badge font-mono">ARTIFACT</span>
      </div>

      <div
        className="artifact-image-container"
        onClick={() => {
          if (fullImageUrl && !imageError && onZoom) {
            onZoom({ title, description, url: fullImageUrl });
          }
        }}
        title="Click to enlarge artifact"
      >
        {fullImageUrl && !imageError ? (
          <>
            <img
              src={fullImageUrl}
              alt={title}
              className="eval-artifact-img"
              loading="lazy"
              onError={() => setImageError(true)}
            />
            <div className="artifact-zoom-overlay">
              <span className="zoom-icon font-mono">🔍 CLICK TO ENLARGE</span>
            </div>
          </>
        ) : (
          <div className="eval-artifact-placeholder font-mono">
            <span className="placeholder-icon">📊</span>
            <span className="placeholder-text">
              {imageError ? 'Artifact image unavailable from backend' : 'Generating artifact...'}
            </span>
          </div>
        )}
      </div>

      <p className="artifact-description">
        {description}
      </p>
    </div>
  );
}
