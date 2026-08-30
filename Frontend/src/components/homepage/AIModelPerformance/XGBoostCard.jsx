import React from 'react';
import ModelMetric from './ModelMetric';
import EvaluationImage from './EvaluationImage';

const METRIC_DEFINITIONS = {
  testSamples: {
    label: 'TEST SAMPLES',
    tooltip: 'Total isolated validation samples evaluated from train_operations.csv.'
  },
  accuracy: {
    label: 'Accuracy',
    tooltip: 'Overall percentage of correct conflict and clear-track predictions across tested railway routes.'
  },
  precision: {
    label: 'Precision',
    tooltip: 'How often a predicted conflict is actually a true headway or route conflict.'
  },
  recall: {
    label: 'Recall',
    tooltip: 'Percentage of all actual physical conflicts that the model successfully detects.'
  },
  f1Score: {
    label: 'F1 Score',
    tooltip: 'Balanced harmonic measure of precision and recall, ensuring robust detection without false alarms.'
  }
};

export default function XGBoostCard({
  evaluation,
  xgboostData,
  loading = false,
  error = null,
  onRetry = null,
  onZoomImage = null
}) {
  const data = evaluation || xgboostData;
  const testSamples = data?.test_samples;
  const accuracy = data?.accuracy;
  const precision = data?.precision;
  const recall = data?.recall;
  const f1Score = data?.f1_score;

  // Dynamic artifact images from FastAPI response
  const confusionMatrixImage = data?.artifact_image || data?.artifacts?.confusion_matrix_image;
  const featureHeatmapImage = data?.feature_heatmap_image || data?.artifacts?.feature_heatmap_image;

  // The "MODEL VERIFIED" badge only appears when FastAPI request succeeds and returned model is XGBoost
  const isVerified = !loading && !error && data && data.model === 'XGBoost';

  return (
    <div className="model-performance-card model-card-xgboost">
      {/* Card Header */}
      <div className="model-card-header">
        <div className="model-header-left">
          <div className="model-type-chip font-mono">GRADIENT BOOSTING ALGORITHM</div>
          <h3 className="model-title font-display">XGBoost</h3>
          <div className="model-subtitle font-mono">Train Conflict Prediction & Route Divergence</div>
        </div>

        <div className="model-header-right">
          {loading ? (
            <div className="model-status-badge badge-loading font-mono">
              <span className="status-dot dot-cyan" />
              <span>MODEL EVALUATION</span>
            </div>
          ) : isVerified ? (
            <div className="model-status-badge badge-verified font-mono">
              <span className="status-dot dot-green" />
              <span>MODEL VERIFIED</span>
            </div>
          ) : error ? (
            <div className="model-status-badge badge-error font-mono">
              <span className="status-dot dot-red" />
              <span>EVALUATION OFFLINE</span>
            </div>
          ) : null}

          <div className="model-source-chip font-mono">
            <span>Source: FastAPI ML Evaluation API</span>
          </div>
        </div>
      </div>

      {/* Loading state indicator */}
      {loading && (
        <div className="model-loading-banner font-mono">
          <span className="loading-spinner">↻</span>
          <span>Loading evaluation artifacts...</span>
        </div>
      )}

      {/* Compact error state with retry button */}
      {error && !loading && (
        <div className="xgboost-error-compact font-mono">
          <div className="error-compact-text">
            <span className="error-compact-icon">⚠</span>
            <span>Unable to load XGBoost evaluation from FastAPI.</span>
          </div>
          {onRetry && (
            <button
              type="button"
              className="error-compact-retry-btn"
              onClick={onRetry}
            >
              <span>RETRY</span>
              <span>↻</span>
            </button>
          )}
        </div>
      )}

      {/* 5 Metric Cards (Desktop: 5 in a row, responsive wrap on mobile/tablet) */}
      <div className="model-metrics-grid">
        <ModelMetric
          label={METRIC_DEFINITIONS.testSamples.label}
          value={testSamples}
          tooltip={METRIC_DEFINITIONS.testSamples.tooltip}
          loading={loading}
          isCount={true}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.accuracy.label}
          value={accuracy}
          tooltip={METRIC_DEFINITIONS.accuracy.tooltip}
          loading={loading}
          decimalPlaces={1}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.precision.label}
          value={precision}
          tooltip={METRIC_DEFINITIONS.precision.tooltip}
          loading={loading}
          decimalPlaces={1}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.recall.label}
          value={recall}
          tooltip={METRIC_DEFINITIONS.recall.tooltip}
          loading={loading}
          decimalPlaces={1}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.f1Score.label}
          value={f1Score}
          tooltip={METRIC_DEFINITIONS.f1Score.tooltip}
          loading={loading}
          decimalPlaces={1}
        />
      </div>

      {/* Artifacts Visual Section (Confusion Matrix + Feature Heatmap) */}
      <div className="model-artifacts-section">
        <div className="artifacts-header font-mono">
          <div className="artifacts-header-left">
            <span className="artifacts-title">MEASURED EVALUATION ARTIFACTS</span>
            <span className="artifacts-sub">FASTAPI REPRODUCIBILITY VALIDATION</span>
          </div>
          <div className="artifacts-source font-mono">
            <span>Source: FastAPI ML Evaluation API</span>
          </div>
        </div>

        <div className="artifacts-grid">
          <EvaluationImage
            title="Confusion Matrix"
            description="Shows how accurately the model distinguishes conflict and no-conflict situations across tested railway routes."
            imagePath={confusionMatrixImage}
            loading={loading}
            onZoom={onZoomImage}
            icon="📊"
          />
          <EvaluationImage
            title="Feature Correlation Heatmap"
            description="Shows relationships between operational factors (speed, headway margin, track gradient) used by the conflict prediction model."
            imagePath={featureHeatmapImage}
            loading={loading}
            onZoom={onZoomImage}
            icon="📈"
          />
        </div>
      </div>
    </div>
  );
}

