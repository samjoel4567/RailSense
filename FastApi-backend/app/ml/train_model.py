import json
import os
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

SEED = 42
np.random.seed(SEED)


def train_and_evaluate():
    # 1. Resolve paths
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    data_path = os.path.join(base_dir, "data/train_operations.csv")

    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}. Please run generate_dataset.py first.")

    print(f"Loading dataset from {data_path}...")
    df = pd.read_csv(data_path)

    # 2. Select Features and Target
    raw_feature_cols = [
        "train_speed",
        "current_delay",
        "previous_delay",
        "section_occupancy",
        "headway",
        "train_priority",
        "distance_to_next_station",
        "time_of_day",
        "weather_condition"
    ]
    target_col = "conflict"

    X_raw = df[raw_feature_cols]
    y = df[target_col]

    # 3. Categorical Encoding (One-Hot Encoding with fixed schema alignment)
    X_encoded = pd.get_dummies(X_raw, columns=["train_priority", "weather_condition"], dtype=int)
    feature_names = list(X_encoded.columns)

    # 4. Train / Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.20, random_state=SEED, stratify=y
    )

    print(f"Training samples: {len(X_train)} | Testing samples: {len(X_test)}")
    print(f"Features used ({len(feature_names)}): {feature_names}")

    # 5. Model Initialization & Training
    model = XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=SEED,
        eval_metric="logloss"
    )

    model.fit(X_train, y_train)

    # 6. Model Evaluation
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print("\n==================================================")
    print("XGBoost TrainSense Model Performance Metrics")
    print("==================================================")
    print(f"Accuracy  : {acc:.4f}")
    print(f"Precision : {prec:.4f}")
    print(f"Recall    : {rec:.4f}")
    print(f"F1 Score  : {f1:.4f}")
    print("\nConfusion Matrix:")
    print(f"  TN: {cm[0][0]:<5} FP: {cm[0][1]:<5}")
    print(f"  FN: {cm[1][0]:<5} TP: {cm[1][1]:<5}")
    print("==================================================")

    # 7. Model & Metadata Serialization
    # Save artifacts in both backend/models/ and root models/ for flexible path access
    model_dirs = [
        os.path.join(base_dir, "models"),
        os.path.abspath(os.path.join(base_dir, "../models"))
    ]

    metadata = {
        "raw_features": raw_feature_cols,
        "encoded_feature_names": feature_names,
        "categorical_columns": ["train_priority", "weather_condition"],
        "categorical_categories": {
            "train_priority": ["EXPRESS", "FREIGHT", "PASSENGER"],
            "weather_condition": ["CLEAR", "FOG", "RAIN", "STORM"]
        },
        "target": target_col,
        "metrics": {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1)
        }
    }

    for target_dir in model_dirs:
        os.makedirs(target_dir, exist_ok=True)
        model_path = os.path.join(target_dir, "conflict_model.json")
        meta_path = os.path.join(target_dir, "model_metadata.json")
        feat_meta_path = os.path.join(target_dir, "feature_metadata.json")

        model.save_model(model_path)
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)
        with open(feat_meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"Saved model artifact     : {model_path}")
        print(f"Saved model metadata     : {meta_path}")
        print(f"Saved feature metadata   : {feat_meta_path}")

    print("\n[STEPS 28-30 COMPLETE]: Model trained, evaluated, and saved successfully!")


if __name__ == "__main__":
    train_and_evaluate()
