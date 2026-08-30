import React from 'react';
import ModelMetric from './ModelMetric';
import EvaluationImage from './EvaluationImage';

const METRIC_DEFINITIONS = {
  accuracy: {
    label: 'Accuracy',
    tooltip: 'Overall percentage of correct conflict and clear-track predictions across all corridor segments.'
  },
  precision: {
    label: 'Precision',
    tooltip: 'How often a predicted conflict is actually a true headway or route conflict.'
  },
  recall: {
    label: 'Recall',
    tooltip: 'Percentage of all actual physical conflicts that the model successfully detects.'
  },
  f1_score: {
    label: 'F1 Score',
    tooltip: 'Balanced harmonic measure of precision and recall, ensuring robust detection without false alarms.'
  }
};

export default function XGBoostCard({ xgboostData, loading = false, onZoomImage }) {
  const accuracy = xgboostData?.accuracy;
  const precision = xgboostData?.precision;
  const recall = xgboostData?.recall;
  const f1Score = xgboostData?.f1_score;
  const testSamples = xgboostData?.test_samples;
  const artifacts = xgboostData?.artifacts || {};

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
          <div className="model-status-badge badge-verified font-mono">
            <span className="status-dot dot-green" />
            <span>MODEL VERIFIED</span>
          </div>
          <div className="model-samples-badge font-mono">
            <span>TEST SAMPLES:</span>
            <strong className="samples-val font-bold">
              {loading ? '···' : (testSamples ? Number(testSamples).toLocaleString() : '–')}
            </strong>
          </div>
        </div>
      </div>

      {/* Metrics Row (4 Metrics) */}
      <div className="model-metrics-grid">
        <ModelMetric
          label={METRIC_DEFINITIONS.accuracy.label}
          value={accuracy}
          tooltip={METRIC_DEFINITIONS.accuracy.tooltip}
          loading={loading}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.precision.label}
          value={precision}
          tooltip={METRIC_DEFINITIONS.precision.tooltip}
          loading={loading}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.recall.label}
          value={recall}
          tooltip={METRIC_DEFINITIONS.recall.tooltip}
          loading={loading}
        />
        <ModelMetric
          label={METRIC_DEFINITIONS.f1_score.label}
          value={f1Score}
          tooltip={METRIC_DEFINITIONS.f1_score.tooltip}
          loading={loading}
        />
      </div>

      {/* Artifacts Visual Section (Confusion Matrix + Feature Heatmap) */}
      <div className="model-artifacts-section">
        <div className="artifacts-header font-mono">
          <span className="artifacts-title">MEASURED EVALUATION ARTIFACTS</span>
          <span className="artifacts-sub">FASTAPI REPRODUCIBILITY VALIDATION</span>
        </div>

        <div className="artifacts-grid">
          <EvaluationImage
            title="Confusion Matrix"
            description="Shows how accurately the model distinguishes conflict and no-conflict situations across tested railway routes."
            imagePath={artifacts.confusion_matrix_image}
            loading={loading}
            onZoom={onZoomImage}
          />
          <EvaluationImage
            title="Feature Correlation Heatmap"
            description="Shows relationships between operational factors (speed, headway margin, track gradient) used by the conflict prediction model."
            imagePath={artifacts.feature_heatmap_image}
            loading={loading}
            onZoom={onZoomImage}
          />
        </div>
      </div>
    </div>
  );
}
