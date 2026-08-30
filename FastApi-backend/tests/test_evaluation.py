"""
TrainSense ML Model Evaluation Tests (Step 9)
Tests:
1. XGBoost evaluation function execution on real data
2. Metrics structure and numerical validity (accuracy, precision, recall, F1)
3. Confusion matrix structure and count consistency (TN, FP, FN, TP)
4. Feature correlation matrix & heatmap generation
5. REST API evaluation endpoints (/model/evaluation, /model/evaluation/xgboost, /model/evaluation/yolov8)
6. YOLOv8 evaluation status (verifies DATASET_REQUIRED when unlabelled, no fake metrics)
7. Static asset serving for generated evaluation PNGs and JSONs
8. Regression check to ensure existing endpoints remain fully functional
"""

import os
import sys
from fastapi.testclient import TestClient
import numpy as np
import pytest

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.ml.evaluation import (
    evaluate_conflict_classifier,
    evaluate_yolo_detector,
    generate_evaluation_summary,
    generate_feature_correlation_heatmap,
    get_evaluation_dir
)


def test_xgboost_evaluation_function_and_metrics():
    """Verifies XGBoost evaluation on real holdout test data."""
    results = evaluate_conflict_classifier(save_artifacts=True)

    assert results["model"] == "XGBoost"
    assert results["task"] == "Train Conflict Prediction"
    assert results["total_samples"] == 12000
    assert results["test_samples"] == 2400

    # Ensure genuine metrics within mathematical bounds [0.0, 1.0]
    assert 0.0 <= results["accuracy"] <= 1.0
    assert 0.0 <= results["precision"] <= 1.0
    assert 0.0 <= results["recall"] <= 1.0
    assert 0.0 <= results["f1_score"] <= 1.0

    # Verify realistic performance on real dataset
    assert results["accuracy"] > 0.70, f"Expected accuracy > 0.70 on real dataset, got {results['accuracy']}"
    assert results["precision"] > 0.60, f"Expected precision > 0.60 on real dataset, got {results['precision']}"
    assert results["recall"] > 0.50, f"Expected recall > 0.50 on real dataset, got {results['recall']}"


def test_xgboost_confusion_matrix_structure():
    """Verifies confusion matrix counts match test set size and are non-negative."""
    results = evaluate_conflict_classifier(save_artifacts=True)
    cm = results["confusion_matrix"]

    assert len(cm) == 2
    assert len(cm[0]) == 2
    assert len(cm[1]) == 2

    tn = cm[0][0]
    fp = cm[0][1]
    fn = cm[1][0]
    tp = cm[1][1]

    # All counts must be non-negative integers
    assert tn >= 0 and fp >= 0 and fn >= 0 and tp >= 0
    total_cm = tn + fp + fn + tp
    assert total_cm == results["test_samples"], f"Confusion matrix total {total_cm} must equal test samples {results['test_samples']}"

    breakdown = results["confusion_matrix_breakdown"]
    assert breakdown["true_negatives"] == tn
    assert breakdown["false_positives"] == fp
    assert breakdown["false_negatives"] == fn
    assert breakdown["true_positives"] == tp


def test_feature_correlation_heatmap_generation():
    """Verifies Pearson correlation matrix computation and artifact saving."""
    corr_results = generate_feature_correlation_heatmap(save_artifacts=True)

    assert "features" in corr_results
    assert len(corr_results["features"]) > 10
    assert "correlation_matrix" in corr_results
    assert corr_results["sample_count"] == 12000

    # Verify diagonal of correlation matrix is 1.0
    for feat in corr_results["features"]:
        val = corr_results["correlation_matrix"][feat][feat]
        assert abs(val - 1.0) < 1e-3, f"Diagonal correlation for {feat} must be 1.0, got {val}"

    # Verify generated artifact PNG exists and is non-empty
    eval_dir = get_evaluation_dir()
    heatmap_path = os.path.join(eval_dir, "xgboost_feature_heatmap.png")
    assert os.path.exists(heatmap_path)
    assert os.path.getsize(heatmap_path) > 10000


def test_yolo_evaluation_status_no_fake_metrics():
    """Verifies YOLO evaluation reports DATASET_REQUIRED when unlabelled, without fabricating numbers."""
    yolo_result = evaluate_yolo_detector(save_artifacts=True)

    assert yolo_result["model"] == "YOLOv8"
    assert yolo_result["task"] == "Railway Intrusion Detection"
    assert yolo_result["evaluation_status"] == "DATASET_REQUIRED"
    assert yolo_result["evaluation_available"] is False
    assert yolo_result["validation_dataset_present"] is False
    assert yolo_result["confusion_matrix_available"] is False
    assert "message" in yolo_result
    assert "labelled validation dataset is required" in yolo_result["message"]

    # Ensure no fabricated mAP or precision numbers are returned
    assert "mAP50" not in yolo_result


def test_unified_evaluation_summary():
    """Verifies combined evaluation summary artifact structure."""
    summary = generate_evaluation_summary(save_artifacts=True)

    assert "platform" in summary
    assert "xgboost" in summary
    assert "yolov8" in summary
    assert summary["xgboost"]["evaluation_available"] is True
    assert summary["yolov8"]["evaluation_available"] is False
    assert summary["yolov8"]["evaluation_status"] == "DATASET_REQUIRED"

    eval_dir = get_evaluation_dir()
    summary_path = os.path.join(eval_dir, "evaluation_summary.json")
    assert os.path.exists(summary_path)
    assert os.path.getsize(summary_path) > 100


def test_fastapi_evaluation_endpoints_and_static_assets():
    """Verifies FastAPI REST endpoints /model/evaluation/* and /evaluation-assets/*."""
    with TestClient(app) as client:
        # 1. GET /model/evaluation
        res_summary = client.get("/model/evaluation")
        assert res_summary.status_code == 200
        data_summary = res_summary.json()
        assert "xgboost" in data_summary
        assert "yolov8" in data_summary
        assert data_summary["xgboost"]["accuracy"] > 0.70

        # 2. GET /model/evaluation/xgboost
        res_xgb = client.get("/model/evaluation/xgboost")
        assert res_xgb.status_code == 200
        data_xgb = res_xgb.json()
        assert data_xgb["model"] == "XGBoost"
        assert "confusion_matrix" in data_xgb
        assert "confusion_matrix_breakdown" in data_xgb
        assert "artifact_image" in data_xgb
        assert "feature_heatmap_image" in data_xgb
        assert data_xgb["accuracy"] > 0.70

        # 3. GET /model/evaluation/yolov8
        res_yolo = client.get("/model/evaluation/yolov8")
        assert res_yolo.status_code == 200
        data_yolo = res_yolo.json()
        assert data_yolo["model"] == "YOLOv8"
        assert data_yolo["evaluation_status"] == "DATASET_REQUIRED"

        # 4. Verify static asset serving
        res_cm_img = client.get("/evaluation-assets/xgboost_confusion_matrix.png")
        assert res_cm_img.status_code == 200
        assert res_cm_img.headers["content-type"] in ["image/png", "application/octet-stream"]
        assert len(res_cm_img.content) > 5000

        res_heat_img = client.get("/evaluation-assets/xgboost_feature_heatmap.png")
        assert res_heat_img.status_code == 200
        assert len(res_heat_img.content) > 10000

        # 5. Regression test: ensure standard routes remain healthy
        res_health = client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"
