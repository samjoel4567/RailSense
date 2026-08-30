import React, { useState } from 'react';
import { useModelEvaluation } from './useModelEvaluation';
import XGBoostCard from './XGBoostCard';
import YOLOv8Card from './YOLOv8Card';
import './AIModelPerformance.css';

export default function AIModelPerformance() {
  const { data, loading, error, retry } = useModelEvaluation();
  const [activeLightbox, setActiveLightbox] = useState(null); // { title, description, url }

  const xgboost = data?.xgboost;
  const yolov8 = data?.yolov8;

  return (
    <section className="ai-model-perf-section" id="model-performance">
      <div className="section-container">
        
        {/* Section Header */}
        <div className="section-header-centered">
          <div className="system-tag-badge font-mono">
            <span className="badge-bullet bg-red" />
            <span>AI MODEL PERFORMANCE</span>
          </div>

          <h2 className="section-main-title">
            Real-Time Evaluation of TrainSense Intelligence
          </h2>

          <p className="section-description">
            Live statistical evaluation and multi-modal validation metrics for the predictive models powering conflict resolution and track safety.
          </p>
        </div>

        {/* Visual Pipeline Progression Flow */}
        <div className="ai-pipeline-progression-bar font-mono">
          <div className="prog-node">
            <span className="node-icon">📡</span>
            <span className="node-label">Operational Railway Data</span>
          </div>
          <span className="prog-arrow">➔</span>
          <div className="prog-node">
            <span className="node-icon">🌲</span>
            <span className="node-label">XGBoost Conflict Prediction</span>
          </div>
          <span className="prog-arrow">➔</span>
          <div className="prog-node node-active">
            <span className="node-icon">📊</span>
            <span className="node-label">Measured Model Performance</span>
          </div>
          <span className="prog-arrow">➔</span>
          <div className="prog-node">
            <span className="node-icon">👁</span>
            <span className="node-label">YOLOv8 Intrusion Detection</span>
          </div>
          <span className="prog-arrow">➔</span>
          <div className="prog-node node-highlight">
            <span className="node-icon">🛡</span>
            <span className="node-label">Multi-Modal Safety Intelligence</span>
          </div>
        </div>

        {/* Error Notification with Retry */}
        {error && (
          <div className="ai-perf-error-banner font-mono">
            <div className="error-text-group">
              <span className="error-icon">⚠</span>
              <div>
                <strong>AI evaluation service temporarily unavailable</strong>
                <p className="error-hint">Failed to fetch live evaluation report from backend. Ensure FastAPI service is online.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary error-retry-btn"
              onClick={retry}
            >
              <span>RETRY EVALUATION</span>
              <span>↻</span>
            </button>
          </div>
        )}

        {/* Model Cards Grid */}
        <div className="model-cards-container">
          <XGBoostCard
            xgboostData={xgboost}
            loading={loading}
            onZoomImage={(img) => setActiveLightbox(img)}
          />

          <YOLOv8Card
            yolov8Data={yolov8}
            loading={loading}
          />
        </div>

      </div>

      {/* Lightbox / Modal for Enlarging Evaluation Artifacts */}
      {activeLightbox && (
        <div
          className="artifact-lightbox-backdrop"
          onClick={() => setActiveLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="artifact-lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-header">
              <div>
                <h3 className="lightbox-title font-mono">{activeLightbox.title}</h3>
                <p className="lightbox-subtitle">{activeLightbox.description}</p>
              </div>
              <button
                type="button"
                className="lightbox-close-btn font-mono"
                onClick={() => setActiveLightbox(null)}
                aria-label="Close enlarged artifact"
              >
                ✕
              </button>
            </div>

            <div className="lightbox-image-wrap">
              <img
                src={activeLightbox.url}
                alt={activeLightbox.title}
                className="lightbox-img"
              />
            </div>

            <div className="lightbox-footer font-mono">
              <span>SOURCE: FASTAPI BACKEND EVALUATION ARTIFACTS</span>
              <button
                type="button"
                className="lightbox-action-close"
                onClick={() => setActiveLightbox(null)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
