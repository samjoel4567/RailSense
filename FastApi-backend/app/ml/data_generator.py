"""
TrainSense Synthetic Railway Operations Dataset Generator (Step 17)
Generates high-fidelity operational datasets featuring Own Train, Train Ahead,
Railway Infrastructure, and Operational History features with realistic physical interactions.
"""

import os
import sys
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.ml.features import FEATURE_COLUMNS, build_feature_dict

SEED = 42
np.random.seed(SEED)


def generate_railway_dataset(n_samples: int = 12000) -> pd.DataFrame:
    """
    Generates synthetic railway operational dataset with realistic physics,
    traffic, signaling, and weather relationships for ML conflict & delay prediction.
    """
    # 1. Train Priorities & Categories
    priorities = np.random.choice(
        ["EXPRESS", "PASSENGER", "FREIGHT", "HIGH_SPEED"],
        size=n_samples,
        p=[0.35, 0.35, 0.15, 0.15]
    )

    speed_ranges = {
        "HIGH_SPEED": (120.0, 160.0),
        "EXPRESS": (80.0, 130.0),
        "PASSENGER": (45.0, 85.0),
        "FREIGHT": (30.0, 70.0)
    }
    speed_kmh = np.array([
        np.round(np.random.uniform(*speed_ranges[p]), 1) for p in priorities
    ])

    # Delays (base + lognormal variability)
    current_delay_min = np.round(np.random.exponential(scale=6.0, size=n_samples), 1)
    distance_to_station_km = np.round(np.random.uniform(1.0, 30.0, size=n_samples), 1)
    position_km = np.round(np.random.uniform(10.0, 250.0, size=n_samples), 1)

    # 2. Train Ahead Dynamics (60% of cases have a relevant train ahead)
    has_train_ahead = np.random.choice([1.0, 0.0], size=n_samples, p=[0.60, 0.40])
    distance_to_ahead_km = np.where(
        has_train_ahead == 1.0,
        np.round(np.random.exponential(scale=8.0, size=n_samples) + 0.5, 2),
        100.0
    )
    ahead_speed_kmh = np.where(
        has_train_ahead == 1.0,
        np.round(np.clip(speed_kmh * np.random.uniform(0.5, 1.1, size=n_samples), 20.0, 140.0), 1),
        0.0
    )
    ahead_eta_min = np.where(
        has_train_ahead == 1.0,
        np.round((distance_to_ahead_km / np.maximum(ahead_speed_kmh, 10.0)) * 60.0, 1),
        0.0
    )
    expected_clearance_min = np.where(
        has_train_ahead == 1.0,
        np.round(ahead_eta_min + np.random.uniform(1.0, 5.0, size=n_samples), 1),
        0.0
    )

    # 3. Infrastructure & Signaling
    traffic_density = np.round(np.random.uniform(0.1, 1.0, size=n_samples), 2)
    headway_min = np.round(np.clip(25.0 * (1.0 - 0.7 * traffic_density) + np.random.normal(0, 1.5, size=n_samples), 1.0, 35.0), 1)
    safe_headway_min = np.full(n_samples, 3.0)

    # Signal status driven by train ahead distance and traffic
    signal_options = ["GREEN", "DOUBLE_YELLOW", "YELLOW", "RED"]
    signals = []
    for dist, has_ahead in zip(distance_to_ahead_km, has_train_ahead):
        if has_ahead and dist < 1.5:
            p = [0.02, 0.10, 0.38, 0.50]
        elif has_ahead and dist < 4.0:
            p = [0.10, 0.35, 0.40, 0.15]
        elif has_ahead and dist < 8.0:
            p = [0.45, 0.35, 0.15, 0.05]
        else:
            p = [0.80, 0.15, 0.04, 0.01]
        signals.append(np.random.choice(signal_options, p=p))
    signals = np.array(signals)

    platform_avail = np.random.choice(["AVAILABLE", "LIMITED", "OCCUPIED"], size=n_samples, p=[0.70, 0.20, 0.10])
    speed_restrictions = np.random.choice([160.0, 120.0, 80.0, 50.0, 30.0], size=n_samples, p=[0.15, 0.50, 0.20, 0.10, 0.05])
    junction_statuses = np.random.choice(["CLEAR", "BUSY", "CONFLICT"], size=n_samples, p=[0.75, 0.18, 0.07])
    route_statuses = np.random.choice(["NORMAL", "RESTRICTED", "BLOCKED"], size=n_samples, p=[0.80, 0.15, 0.05])
    weather_conditions = np.random.choice(["CLEAR", "RAIN", "FOG", "STORM"], size=n_samples, p=[0.60, 0.22, 0.12, 0.06])
    time_of_day = np.round(np.random.uniform(0.0, 24.0, size=n_samples), 1)

    # 4. History Generation
    speed_mean = np.round(speed_kmh + np.random.normal(0, 3.0, size=n_samples), 1)
    speed_std = np.round(np.abs(np.random.normal(2.5, 1.5, size=n_samples)), 1)
    speed_trend = np.round(np.random.normal(0, 4.0, size=n_samples), 1)
    position_progress = np.round(speed_kmh / 60.0 + np.random.normal(0, 0.1, size=n_samples), 3)

    delay_mean = np.round(current_delay_min + np.random.normal(0, 1.5, size=n_samples), 1)
    delay_std = np.round(np.abs(np.random.normal(1.5, 1.0, size=n_samples)), 1)
    delay_trend = np.round(np.random.normal(0.5, 1.5, size=n_samples), 1)

    # 5. Targets: Conflict Probability (Logit Model) & Expected Future Delay
    signal_risk = np.array([{"GREEN": 0.0, "DOUBLE_YELLOW": 0.35, "YELLOW": 0.85, "RED": 1.6}[s] for s in signals])
    weather_risk = np.array([{"CLEAR": 0.0, "RAIN": 0.2, "FOG": 0.5, "STORM": 0.8}[w] for w in weather_conditions])
    junc_risk = np.array([{"CLEAR": 0.0, "BUSY": 0.6, "CONFLICT": 1.8}[j] for j in junction_statuses])
    route_risk = np.array([{"NORMAL": 0.0, "RESTRICTED": 0.5, "BLOCKED": 1.7}[r] for r in route_statuses])

    closing_speeds = np.maximum(0.0, speed_kmh - ahead_speed_kmh) * has_train_ahead
    closing_hazard = (closing_speeds / 100.0) / (distance_to_ahead_km + 0.5)

    z_conflict = (
        -3.8 +
        1.8 * has_train_ahead +
        2.6 * (1.0 / (distance_to_ahead_km + 0.3)) * has_train_ahead +
        1.4 * closing_hazard +
        2.2 * (1.0 / (headway_min + 0.8)) +
        1.5 * signal_risk +
        1.2 * junc_risk +
        1.1 * route_risk +
        0.4 * weather_risk +
        0.03 * current_delay_min +
        np.random.normal(0, 0.3, size=n_samples)
    )
    conflict_prob = 1.0 / (1.0 + np.exp(-z_conflict))
    conflict_binary = (np.random.rand(n_samples) < conflict_prob).astype(int)

    # Expected delay progression regression target
    expected_delay_min = np.maximum(
        0.0,
        current_delay_min * 0.85 +
        delay_trend * 1.8 +
        signal_risk * 4.5 +
        junc_risk * 3.5 +
        route_risk * 5.0 +
        (130.0 - speed_restrictions) * 0.05 +
        weather_risk * 2.0 +
        (10.0 / (headway_min + 0.5)) +
        conflict_binary * 6.0 +
        np.random.normal(0, 1.0, size=n_samples)
    )
    expected_delay_min = np.round(expected_delay_min, 1)

    # 6. Build Structured DataFrame using Feature Engineering Layer
    rows = []
    for i in range(n_samples):
        raw_row = {
            "current_speed_kmh": speed_kmh[i],
            "current_delay_min": current_delay_min[i],
            "distance_to_next_station_km": distance_to_station_km[i],
            "current_position_km": position_km[i],
            "distance_remaining_km": distance_to_station_km[i],
            "train_priority": priorities[i],
            "has_train_ahead": bool(has_train_ahead[i]),
            "distance_to_ahead_train_km": distance_to_ahead_km[i],
            "ahead_train_speed_kmh": ahead_speed_kmh[i],
            "ahead_train_eta_min": ahead_eta_min[i],
            "expected_clearance_time_min": expected_clearance_min[i],
            "current_headway_min": headway_min[i],
            "safe_required_headway_min": safe_headway_min[i],
            "current_signal": signals[i],
            "platform_availability": platform_avail[i],
            "speed_restriction_kmh": speed_restrictions[i],
            "junction_status": junction_statuses[i],
            "route_status": route_statuses[i],
            "weather_condition": weather_conditions[i],
            "time_of_day": time_of_day[i],
            "speed_history": [speed_mean[i] - speed_trend[i], speed_mean[i], speed_mean[i] + speed_trend[i]],
            "position_history": [position_km[i] - position_progress[i], position_km[i]],
            "delay_history": [current_delay_min[i] - delay_trend[i], current_delay_min[i]]
        }
        feat_dict = build_feature_dict(raw_row)
        feat_dict["conflict"] = conflict_binary[i]
        feat_dict["conflict_probability"] = round(float(conflict_prob[i]), 4)
        feat_dict["expected_delay_min"] = expected_delay_min[i]
        rows.append(feat_dict)

    df = pd.DataFrame(rows)
    return df


def validate_and_save_dataset(df: pd.DataFrame, output_path: str):
    """Saves and validates dataset."""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[Dataset Generator] Successfully saved {len(df)} samples to {output_path}")
    print(f"[Dataset Generator] Feature columns ({len(FEATURE_COLUMNS)}): {FEATURE_COLUMNS}")
    print(f"[Dataset Generator] Conflict rate: {df['conflict'].mean():.2%}")
    print(f"[Dataset Generator] Mean expected delay: {df['expected_delay_min'].mean():.2f} min")


if __name__ == "__main__":
    output_csv = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/train_operations.csv"))
    dataset = generate_railway_dataset(n_samples=12000)
    validate_and_save_dataset(dataset, output_csv)
