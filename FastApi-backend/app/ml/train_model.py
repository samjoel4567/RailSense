"""
TrainSense Dual ML Model Training Pipeline (Steps 6, 7, 8, 18)
Trains:
1. XGBoost Conflict Classifier (Target: conflict) -> conflict_model.json
2. XGBoost Expected Delay Regressor (Target: expected_delay_min) -> delay_model.json
Saves models & metadata with single source of truth FEATURE_COLUMNS.
"""

import json
import os
import sys
from typing import Any, Dict
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier, XGBRegressor

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.ml.features import FEATURE_COLUMNS

SEED = 42
np.random.seed(SEED)


def train_and_evaluate():
    # 1. Resolve paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    data_path = os.path.join(base_dir, "data/train_operations.csv")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please run data_generator.py first.")

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)

    # 2. Extract feature matrix X and targets
    X = df[FEATURE_COLUMNS]
    y_conflict = df["conflict"]
    y_delay = df["expected_delay_min"]

    print(f"Total dataset samples: {len(X)} | Feature count: {len(FEATURE_COLUMNS)}")

    # 3. Train / Test Split (80/20)
    X_train, X_test, y_conf_train, y_conf_test, y_del_train, y_del_test = train_test_split(
        X, y_conflict, y_delay, test_size=0.20, random_state=SEED, stratify=y_conflict
    )

    print(f"Training samples: {len(X_train)} | Testing samples: {len(X_test)}")

    # ----------------------------------------------------
    # 4. Train Model A: Conflict Classifier (XGBoost)
    # ----------------------------------------------------
    print("\n--- Training Model 1: XGBoost Conflict Classifier ---")
    conflict_model = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=SEED,
        eval_metric="logloss"
    )
    conflict_model.fit(X_train, y_conf_train)

    y_conf_pred = conflict_model.predict(X_test)
    y_conf_proba = conflict_model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_conf_test, y_conf_pred))
    prec = float(precision_score(y_conf_test, y_conf_pred))
    rec = float(recall_score(y_conf_test, y_conf_pred))
    f1 = float(f1_score(y_conf_test, y_conf_pred))
    cm = confusion_matrix(y_conf_test, y_conf_pred)

    print(f"Conflict Accuracy  : {acc:.4f}")
    print(f"Conflict Precision : {prec:.4f}")
    print(f"Conflict Recall    : {rec:.4f}")
    print(f"Conflict F1 Score  : {f1:.4f}")
    print(f"Confusion Matrix   :\n  TN: {cm[0][0]:<5} FP: {cm[0][1]:<5}\n  FN: {cm[1][0]:<5} TP: {cm[1][1]:<5}")

    # ----------------------------------------------------
    # 5. Train Model B: Expected Delay Regressor (XGBoost)
    # ----------------------------------------------------
    print("\n--- Training Model 2: XGBoost Expected Delay Regressor ---")
    delay_model = XGBRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=SEED
    )
    delay_model.fit(X_train, y_del_train)

    y_del_pred = delay_model.predict(X_test)
    mae = float(mean_absolute_error(y_del_test, y_del_pred))
    rmse = float(np.sqrt(mean_squared_error(y_del_test, y_del_pred)))
    r2 = float(r2_score(y_del_test, y_del_pred))

    print(f"Delay MAE  : {mae:.2f} min")
    print(f"Delay RMSE : {rmse:.2f} min")
    print(f"Delay R2   : {r2:.4f}")

    # ----------------------------------------------------
    # 6. Model & Metadata Serialization
    # ----------------------------------------------------
    metadata: Dict[str, Any] = {
        "feature_columns": FEATURE_COLUMNS,
        "encoded_feature_names": FEATURE_COLUMNS,
        "feature_count": len(FEATURE_COLUMNS),
        "models": {
            "conflict_classifier": {
                "algorithm": "XGBClassifier",
                "target": "conflict",
                "metrics": {
                    "accuracy": acc,
                    "precision": prec,
                    "recall": rec,
                    "f1_score": f1
                }
            },
            "delay_regressor": {
                "algorithm": "XGBRegressor",
                "target": "expected_delay_min",
                "metrics": {
                    "mae_min": mae,
                    "rmse_min": rmse,
                    "r2_score": r2
                }
            }
        },
        "metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "delay_mae": mae,
            "delay_r2": r2
        }
    }

    model_dirs = [
        os.path.join(base_dir, "models"),
        os.path.abspath(os.path.join(base_dir, "../models"))
    ]

    for target_dir in model_dirs:
        os.makedirs(target_dir, exist_ok=True)
        conf_path = os.path.join(target_dir, "conflict_model.json")
        del_path = os.path.join(target_dir, "delay_model.json")
        meta_path = os.path.join(target_dir, "model_metadata.json")
        feat_meta_path = os.path.join(target_dir, "feature_metadata.json")

        conflict_model.save_model(conf_path)
        delay_model.save_model(del_path)

        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)
        with open(feat_meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"Saved conflict model artifact   : {conf_path}")
        print(f"Saved delay model artifact      : {del_path}")
        print(f"Saved model metadata            : {meta_path}")

    print("\n[TRAINING SUCCESS]: Dual XGBoost models trained and serialized successfully!")


if __name__ == "__main__":
    train_and_evaluate()
