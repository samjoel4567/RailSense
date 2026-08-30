"""
TrainSense ML Model Evaluation Layer
Evaluates XGBoost conflict classifier and YOLOv8 intrusion detector using genuine test/validation data.
Generates confusion matrices, correlation heatmaps, machine-readable JSON metrics, and visual artifacts.
"""

import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

# Ensure FastApi-backend is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.ml.features import FEATURE_COLUMNS

logger = logging.getLogger("TrainSense.Evaluation")


def get_base_dir() -> str:
    """Returns absolute path to FastApi-backend directory."""
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))


def get_evaluation_dir() -> str:
    """Ensures and returns the data/evaluation output directory."""
    base_dir = get_base_dir()
    eval_dir = os.path.join(base_dir, "data/evaluation")
    os.makedirs(eval_dir, exist_ok=True)
    return eval_dir


def evaluate_conflict_classifier(
    data_path: Optional[str] = None,
    model_path: Optional[str] = None,
    save_artifacts: bool = True,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Evaluates the XGBoost train conflict prediction classifier on genuine holdout test data.
    Computes accuracy, precision, recall, F1 score, confusion matrix, and classification report.
    Optionally saves confusion matrix PNG and metrics JSON.
    """
    base_dir = get_base_dir()
    eval_dir = get_evaluation_dir()

    # Resolve dataset path
    if data_path is None:
        data_path = os.path.join(base_dir, "data/train_operations.csv")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Evaluation dataset not found at: {data_path}")

    # Resolve model path
    if model_path is None:
        possible_paths = [
            os.path.join(base_dir, "models/conflict_model.json"),
            os.path.abspath(os.path.join(base_dir, "../models/conflict_model.json"))
        ]
        model_path = next((p for p in possible_paths if os.path.exists(p)), None)

    if not model_path or not os.path.exists(model_path):
        raise FileNotFoundError(f"Conflict model artifact not found at: {model_path}")

    # Load data
    df = pd.read_csv(data_path)
    X = df[FEATURE_COLUMNS]
    y = df["conflict"]

    # Stratified 80/20 split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )

    # Load trained model
    model = XGBClassifier()
    model.load_model(model_path)

    # Predict on test set
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Calculate real evaluation metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = int(cm[0][0]), int(cm[0][1]), int(cm[1][0]), int(cm[1][1])
    report = classification_report(y_test, y_pred, target_names=["No Conflict", "Conflict"], output_dict=True)

    metrics_result = {
        "model": "XGBoost",
        "task": "Train Conflict Prediction",
        "dataset": os.path.basename(data_path),
        "total_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": [
            [tn, fp],
            [fn, tp]
        ],
        "confusion_matrix_breakdown": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp
        },
        "classification_report": report,
        "artifact_image": "/evaluation-assets/xgboost_confusion_matrix.png",
        "feature_heatmap_image": "/evaluation-assets/xgboost_feature_heatmap.png"
    }

    if save_artifacts:
        # 1. Save machine-readable JSON
        json_path = os.path.join(eval_dir, "xgboost_metrics.json")
        with open(json_path, "w") as f:
            json.dump(metrics_result, f, indent=2)

        # 2. Generate presentation-ready confusion matrix plot
        plot_path = os.path.join(eval_dir, "xgboost_confusion_matrix.png")
        _plot_confusion_matrix(
            cm=cm,
            labels=["No Conflict", "Conflict"],
            metrics=metrics_result,
            output_path=plot_path
        )
        logger.info(f"[Evaluation] Saved XGBoost evaluation artifacts to {eval_dir}")

    return metrics_result


def _plot_confusion_matrix(
    cm: np.ndarray,
    labels: List[str],
    metrics: Dict[str, Any],
    output_path: str
):
    """
    Renders and saves a presentation-quality confusion matrix image.
    """
    fig, ax = plt.subplots(figsize=(7, 6), dpi=200)

    # Use clean colormap
    cax = ax.matshow(cm, cmap="Blues", alpha=0.85)
    fig.colorbar(cax, fraction=0.046, pad=0.04)

    # Set tick labels
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(labels, fontsize=11, fontweight="bold")
    ax.set_yticklabels(labels, fontsize=11, fontweight="bold")

    ax.tick_params(top=False, bottom=True, labeltop=False, labelbottom=True)
    ax.set_xlabel("Predicted Label", fontsize=12, fontweight="bold", labelpad=10)
    ax.set_ylabel("Actual Label", fontsize=12, fontweight="bold", labelpad=10)

    # Cell labels & values
    total = np.sum(cm)
    cell_names = [["TN (True Negative)", "FP (False Positive)"], ["FN (False Negative)", "TP (True Positive)"]]

    for i in range(2):
        for j in range(2):
            count = cm[i, j]
            pct = (count / total) * 100.0
            cell_name = cell_names[i][j]
            color = "white" if count > (total * 0.3) else "black"

            text = f"{cell_name}\n\n{count:,}\n({pct:.1f}%)"
            ax.text(
                j, i, text,
                ha="center", va="center",
                color=color,
                fontsize=10,
                fontweight="bold"
            )

    # Title and subtitle banner
    acc_pct = metrics["accuracy"] * 100.0
    f1_pct = metrics["f1_score"] * 100.0
    prec_pct = metrics["precision"] * 100.0
    rec_pct = metrics["recall"] * 100.0

    title_str = "TrainSense XGBoost Conflict Prediction — Confusion Matrix\n"
    subtitle_str = f"Accuracy: {acc_pct:.1f}% | Precision: {prec_pct:.1f}% | Recall: {rec_pct:.1f}% | F1: {f1_pct:.1f}% (N = {total:,})"
    ax.set_title(f"{title_str}{subtitle_str}", fontsize=11, pad=18, fontweight="bold")

    plt.tight_layout()
    plt.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def generate_feature_correlation_heatmap(
    data_path: Optional[str] = None,
    save_artifacts: bool = True
) -> Dict[str, Any]:
    """
    Computes Pearson feature correlations for operational features present in the dataset
    and generates a presentation-ready correlation heatmap.
    """
    base_dir = get_base_dir()
    eval_dir = get_evaluation_dir()

    if data_path is None:
        data_path = os.path.join(base_dir, "data/train_operations.csv")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at: {data_path}")

    df = pd.read_csv(data_path)

    # Select representative continuous operational features present in dataset
    core_features = [
        "current_speed_kmh",
        "current_delay_min",
        "distance_to_next_station_km",
        "current_position_km",
        "distance_to_ahead_train_km",
        "ahead_train_speed_kmh",
        "ahead_train_eta_min",
        "expected_clearance_time_min",
        "relative_speed_kmh",
        "headway_margin_min",
        "signal_code",
        "current_headway_min",
        "platform_available",
        "speed_restriction_kmh",
        "junction_busy",
        "route_blocked",
        "speed_mean",
        "speed_trend",
        "delay_mean",
        "delay_trend",
        "conflict"
    ]

    # Filter to existing columns with non-zero variance (to ensure valid Pearson correlation)
    selected_cols = [col for col in core_features if col in df.columns and df[col].std() > 0]
    corr_df = df[selected_cols].corr().fillna(0.0)

    # Convert to serializable dictionary
    corr_dict = {
        "features": selected_cols,
        "sample_count": int(len(df)),
        "correlation_matrix": {col: corr_df[col].round(4).to_dict() for col in selected_cols},
        "artifact_image": "/evaluation-assets/xgboost_feature_heatmap.png"
    }

    if save_artifacts:
        # Save JSON
        json_path = os.path.join(eval_dir, "feature_correlations.json")
        with open(json_path, "w") as f:
            json.dump(corr_dict, f, indent=2)

        # Generate plot
        plot_path = os.path.join(eval_dir, "xgboost_feature_heatmap.png")
        _plot_correlation_heatmap(corr_df, selected_cols, plot_path)
        logger.info(f"[Evaluation] Saved feature correlation artifacts to {eval_dir}")

    return corr_dict


def _plot_correlation_heatmap(
    corr_df: pd.DataFrame,
    feature_names: List[str],
    output_path: str
):
    """
    Renders and saves a correlation heatmap for operational features.
    """
    n = len(feature_names)
    fig, ax = plt.subplots(figsize=(11, 9), dpi=200)

    cax = ax.imshow(corr_df.values, cmap="coolwarm", vmin=-1.0, vmax=1.0)
    fig.colorbar(cax, fraction=0.046, pad=0.04, label="Pearson Correlation")

    ax.set_xticks(range(n))
    ax.set_yticks(range(n))

    # Readable labels
    clean_labels = [f.replace("_", " ") for f in feature_names]
    ax.set_xticklabels(clean_labels, rotation=45, ha="right", fontsize=8)
    ax.set_yticklabels(clean_labels, fontsize=8)

    # Annotate values inside cells if size permits
    if n <= 25:
        for i in range(n):
            for j in range(n):
                val = corr_df.values[i, j]
                color = "white" if abs(val) > 0.55 else "black"
                ax.text(
                    j, i, f"{val:.2f}",
                    ha="center", va="center",
                    color=color,
                    fontsize=6.5
                )

    ax.set_title(
        "TrainSense Operational Feature Correlation Matrix (XGBoost Feature Relationships)",
        fontsize=11, fontweight="bold", pad=15
    )

    plt.tight_layout()
    plt.savefig(output_path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def evaluate_yolo_detector(
    weights_path: Optional[str] = None,
    dataset_yaml: Optional[str] = None,
    save_artifacts: bool = True
) -> Dict[str, Any]:
    """
    Evaluates YOLOv8 railway intrusion detector.
    If a valid labelled dataset YAML is provided and exists, runs Ultralytics validation.
    If no labelled validation dataset exists, transparently reports DATASET_REQUIRED
    without fabricating fake metrics or fake confusion matrices.
    """
    base_dir = get_base_dir()
    eval_dir = get_evaluation_dir()

    # Locate weights
    if weights_path is None:
        possible_weights = [
            os.path.join(base_dir, "yolov8n.pt"),
            os.path.abspath(os.path.join(base_dir, "../yolov8n.pt")),
            "yolov8n.pt"
        ]
        weights_path = next((w for w in possible_weights if os.path.exists(w)), "yolov8n.pt")

    target_classes = ["person", "car", "truck", "bus", "motorcycle", "bicycle", "train", "cat", "dog", "obstacle"]

    # Check for dataset configuration
    has_dataset = bool(dataset_yaml and os.path.exists(dataset_yaml))

    if has_dataset:
        try:
            from ultralytics import YOLO
            model = YOLO(weights_path)
            metrics = model.val(data=dataset_yaml, verbose=False)

            result = {
                "model": "YOLOv8",
                "task": "Railway Intrusion Detection",
                "weights": os.path.basename(weights_path),
                "evaluation_status": "COMPLETED",
                "evaluation_available": True,
                "validation_dataset_present": True,
                "confusion_matrix_available": True,
                "target_classes": target_classes,
                "metrics": {
                    "mAP50": round(float(metrics.box.map50), 4),
                    "mAP50_95": round(float(metrics.box.map), 4),
                    "precision": round(float(metrics.box.mp), 4),
                    "recall": round(float(metrics.box.mr), 4)
                }
            }
        except Exception as e:
            logger.warning(f"[Evaluation] YOLO validation failed with dataset: {e}")
            result = {
                "model": "YOLOv8",
                "task": "Railway Intrusion Detection",
                "weights": os.path.basename(weights_path) if weights_path else "yolov8n.pt",
                "evaluation_status": "DATASET_REQUIRED",
                "evaluation_available": False,
                "validation_dataset_present": False,
                "confusion_matrix_available": False,
                "target_classes": target_classes,
                "message": f"Error running YOLO validation: {str(e)}"
            }
    else:
        # Transparently report that labelled validation dataset is required
        result = {
            "model": "YOLOv8",
            "task": "Railway Intrusion Detection",
            "weights": os.path.basename(weights_path) if weights_path else "yolov8n.pt",
            "evaluation_status": "DATASET_REQUIRED",
            "evaluation_available": False,
            "validation_dataset_present": False,
            "confusion_matrix_available": False,
            "target_classes": target_classes,
            "message": "A labelled validation dataset is required to generate a valid confusion matrix."
        }

    if save_artifacts:
        json_path = os.path.join(eval_dir, "yolov8_metrics.json")
        with open(json_path, "w") as f:
            json.dump(result, f, indent=2)
        logger.info(f"[Evaluation] Saved YOLOv8 evaluation status to {eval_dir}")

    return result


def generate_evaluation_summary(save_artifacts: bool = True) -> Dict[str, Any]:
    """
    Generates unified evaluation status across all platform ML models (XGBoost & YOLOv8).
    """
    eval_dir = get_evaluation_dir()

    # Evaluate or load XGBoost
    xgb_metrics = evaluate_conflict_classifier(save_artifacts=save_artifacts)
    # Evaluate or load YOLOv8
    yolo_metrics = evaluate_yolo_detector(save_artifacts=save_artifacts)
    # Feature correlations
    feat_corr = generate_feature_correlation_heatmap(save_artifacts=save_artifacts)

    summary = {
        "platform": "TrainSense Multi-Modal AI Evaluation Suite",
        "timestamp": pd.Timestamp.now("UTC").isoformat(),
        "xgboost": {
            "model": xgb_metrics["model"],
            "task": xgb_metrics["task"],
            "evaluation_available": True,
            "accuracy": xgb_metrics["accuracy"],
            "precision": xgb_metrics["precision"],
            "recall": xgb_metrics["recall"],
            "f1_score": xgb_metrics["f1_score"],
            "test_samples": xgb_metrics["test_samples"],
            "artifacts": {
                "confusion_matrix_image": "/evaluation-assets/xgboost_confusion_matrix.png",
                "feature_heatmap_image": "/evaluation-assets/xgboost_feature_heatmap.png",
                "metrics_endpoint": "/model/evaluation/xgboost"
            }
        },
        "yolov8": {
            "model": yolo_metrics["model"],
            "task": yolo_metrics["task"],
            "evaluation_available": yolo_metrics.get("evaluation_available", False),
            "evaluation_status": yolo_metrics.get("evaluation_status", "DATASET_REQUIRED"),
            "confusion_matrix_available": yolo_metrics.get("confusion_matrix_available", False),
            "message": yolo_metrics.get("message", "A labelled validation dataset is required to generate a valid confusion matrix."),
            "artifacts": {
                "metrics_endpoint": "/model/evaluation/yolov8"
            }
        }
    }

    if save_artifacts:
        summary_path = os.path.join(eval_dir, "evaluation_summary.json")
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)

    return summary


def run_all_evaluations() -> Dict[str, Any]:
    """Generates all evaluation artifacts (PNGs and JSONs) across all models."""
    return generate_evaluation_summary(save_artifacts=True)


if __name__ == "__main__":
    print("Running TrainSense ML Model Evaluation Suite...")
    summary = run_all_evaluations()
    print(json.dumps(summary, indent=2))
