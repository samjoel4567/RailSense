"""
TrainSense Feature Engineering Layer (Step 4)
Single source of truth for feature definitions, history summary calculations,
input normalization, and prediction confidence scoring.
"""

from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

# ----------------------------------------------------
# SINGLE SOURCE OF TRUTH: FEATURE COLUMNS
# ----------------------------------------------------
FEATURE_COLUMNS: List[str] = [
    # 1. Own Train Features
    "current_speed_kmh",
    "current_delay_min",
    "distance_to_next_station_km",
    "current_position_km",
    "distance_remaining_km",
    "estimated_running_time_min",
    "delay_ratio",
    "train_priority_EXPRESS",
    "train_priority_FREIGHT",
    "train_priority_HIGH_SPEED",
    "train_priority_PASSENGER",

    # 2. Relevant Train Ahead Features
    "has_train_ahead",
    "distance_to_ahead_train_km",
    "ahead_train_speed_kmh",
    "ahead_train_eta_min",
    "expected_clearance_time_min",
    "relative_speed_kmh",
    "closing_speed_kmh",
    "time_to_close_gap_min",
    "headway_margin_min",

    # 3. Railway Infrastructure & Conditions
    "signal_code",
    "current_headway_min",
    "safe_required_headway_min",
    "platform_available",
    "speed_restriction_kmh",
    "junction_busy",
    "route_blocked",
    "section_occupancy",
    "time_of_day",
    "weather_condition_CLEAR",
    "weather_condition_FOG",
    "weather_condition_RAIN",
    "weather_condition_STORM",

    # 4. Recent Operational History Features
    "speed_mean",
    "speed_std",
    "speed_trend",
    "position_progress_rate",
    "delay_mean",
    "delay_std",
    "delay_trend"
]

SIGNAL_MAP: Dict[str, float] = {
    "GREEN": 0.0,
    "DOUBLE_YELLOW": 1.0,
    "YELLOW": 2.0,
    "RED": 3.0
}

PLATFORM_MAP: Dict[str, float] = {
    "AVAILABLE": 1.0,
    "LIMITED": 0.5,
    "OCCUPIED": 0.0
}

JUNCTION_MAP: Dict[str, float] = {
    "CLEAR": 0.0,
    "BUSY": 0.5,
    "CONFLICT": 1.0
}

ROUTE_MAP: Dict[str, float] = {
    "NORMAL": 0.0,
    "RESTRICTED": 0.5,
    "BLOCKED": 1.0
}


def extract_history_features(
    speed_history: Optional[List[float]] = None,
    position_history: Optional[List[float]] = None,
    delay_history: Optional[List[float]] = None,
    fallback_speed: float = 60.0,
    fallback_delay: float = 0.0,
    fallback_position: float = 0.0
) -> Dict[str, float]:
    """
    Computes statistical and trend summary features from operational sequences.
    Gracefully handles empty or missing histories using fallback telemetry.
    """
    # 1. Speed History
    if speed_history and len(speed_history) > 0:
        speeds = np.array(speed_history, dtype=float)
        speed_mean = float(np.mean(speeds))
        speed_std = float(np.std(speeds)) if len(speeds) > 1 else 0.0
        speed_trend = float(speeds[-1] - speeds[0]) if len(speeds) > 1 else 0.0
    else:
        speed_mean = float(fallback_speed)
        speed_std = 0.0
        speed_trend = 0.0

    # 2. Position History & Progress Rate
    if position_history and len(position_history) > 1:
        positions = np.array(position_history, dtype=float)
        # Advance in km between start and latest sequence step
        position_progress_rate = float((positions[-1] - positions[0]) / max(len(positions) - 1, 1))
    else:
        # Fallback: estimate rate from speed (~ km per minute step)
        position_progress_rate = float(fallback_speed / 60.0)

    # 3. Delay History
    if delay_history and len(delay_history) > 0:
        delays = np.array(delay_history, dtype=float)
        delay_mean = float(np.mean(delays))
        delay_std = float(np.std(delays)) if len(delays) > 1 else 0.0
        delay_trend = float(delays[-1] - delays[0]) if len(delays) > 1 else 0.0
    else:
        delay_mean = float(fallback_delay)
        delay_std = 0.0
        delay_trend = 0.0

    return {
        "speed_mean": round(speed_mean, 2),
        "speed_std": round(speed_std, 2),
        "speed_trend": round(speed_trend, 2),
        "position_progress_rate": round(position_progress_rate, 3),
        "delay_mean": round(delay_mean, 2),
        "delay_std": round(delay_std, 2),
        "delay_trend": round(delay_trend, 2),
    }


def build_feature_dict(raw_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Transforms raw operational telemetry dictionary into a clean numerical feature dictionary
    strictly adhering to FEATURE_COLUMNS.
    """
    # 1. Own Train Features
    speed = float(raw_data.get("current_speed_kmh", raw_data.get("train_speed", raw_data.get("speed", 60.0))))
    delay = float(raw_data.get("current_delay_min", raw_data.get("current_delay", raw_data.get("delay", 0.0))))
    dist_station = float(raw_data.get("distance_to_next_station_km", raw_data.get("distance_to_next_station", 10.0)))
    pos = float(raw_data.get("current_position_km", raw_data.get("latitude", 0.0)))
    dist_remaining = float(raw_data.get("distance_remaining_km", dist_station))
    
    # Running time estimate: distance / speed * 60 minutes
    effective_speed = max(speed, 5.0)
    est_running_time = (dist_remaining / effective_speed) * 60.0
    delay_ratio = delay / max(est_running_time, 1.0)

    train_priority = str(raw_data.get("train_priority", raw_data.get("priority", "PASSENGER"))).upper()
    if train_priority == "LOCAL":
        train_priority = "PASSENGER"

    # 2. Train Ahead Features
    has_train_ahead = bool(raw_data.get("has_train_ahead", raw_data.get("approaching_train_present", False)))
    dist_ahead = float(raw_data.get("distance_to_ahead_train_km", raw_data.get("distance_to_conflict_km", 2.0 if has_train_ahead else 100.0)))
    ahead_speed = float(raw_data.get("ahead_train_speed_kmh", 0.0 if not has_train_ahead else 30.0))
    ahead_eta = float(raw_data.get("ahead_train_eta_min", 0.0))
    clearance_time = float(raw_data.get("expected_clearance_time_min", 0.0))

    if has_train_ahead:
        rel_speed = speed - ahead_speed
        closing_speed = max(0.0, rel_speed)
        time_to_close = (dist_ahead / max(closing_speed, 1.0)) * 60.0 if closing_speed > 0 else 999.0
    else:
        rel_speed = 0.0
        closing_speed = 0.0
        time_to_close = 999.0

    time_to_close = float(np.clip(time_to_close, 0.0, 999.0))

    headway = float(raw_data.get("current_headway_min", raw_data.get("headway", 10.0)))
    safe_headway = float(raw_data.get("safe_required_headway_min", 3.0))
    headway_margin = headway - safe_headway

    # 3. Infrastructure & Conditions
    signal_str = str(raw_data.get("current_signal", raw_data.get("signal_status", "GREEN"))).upper()
    signal_code = SIGNAL_MAP.get(signal_str, 0.0)

    plat_str = str(raw_data.get("platform_availability", "AVAILABLE")).upper()
    plat_val = PLATFORM_MAP.get(plat_str, 1.0)

    speed_restriction = float(raw_data.get("speed_restriction_kmh", 120.0))

    junc_str = str(raw_data.get("junction_status", "CLEAR")).upper()
    junc_val = JUNCTION_MAP.get(junc_str, 0.0)

    route_str = str(raw_data.get("route_status", "NORMAL")).upper()
    route_val = ROUTE_MAP.get(route_str, 0.0)

    sec_occ = float(raw_data.get("section_occupancy", raw_data.get("section_occupied", 0)))
    time_of_day = float(raw_data.get("time_of_day", 12.0))

    weather_str = str(raw_data.get("weather_condition", "CLEAR")).upper()

    # 4. History Summary Features
    speed_hist = raw_data.get("speed_history")
    pos_hist = raw_data.get("position_history")
    delay_hist = raw_data.get("delay_history")

    hist_feats = extract_history_features(
        speed_history=speed_hist,
        position_history=pos_hist,
        delay_history=delay_hist,
        fallback_speed=speed,
        fallback_delay=delay,
        fallback_position=pos
    )

    feat_dict: Dict[str, float] = {
        # Own Train
        "current_speed_kmh": round(speed, 2),
        "current_delay_min": round(delay, 2),
        "distance_to_next_station_km": round(dist_station, 2),
        "current_position_km": round(pos, 3),
        "distance_remaining_km": round(dist_remaining, 2),
        "estimated_running_time_min": round(est_running_time, 2),
        "delay_ratio": round(delay_ratio, 3),
        "train_priority_EXPRESS": 1.0 if train_priority == "EXPRESS" else 0.0,
        "train_priority_FREIGHT": 1.0 if train_priority == "FREIGHT" else 0.0,
        "train_priority_HIGH_SPEED": 1.0 if train_priority in ["HIGH_SPEED", "HIGH-SPEED"] else 0.0,
        "train_priority_PASSENGER": 1.0 if train_priority in ["PASSENGER", "LOCAL"] else 0.0,

        # Train Ahead
        "has_train_ahead": 1.0 if has_train_ahead else 0.0,
        "distance_to_ahead_train_km": round(dist_ahead, 2),
        "ahead_train_speed_kmh": round(ahead_speed, 2),
        "ahead_train_eta_min": round(ahead_eta, 2),
        "expected_clearance_time_min": round(clearance_time, 2),
        "relative_speed_kmh": round(rel_speed, 2),
        "closing_speed_kmh": round(closing_speed, 2),
        "time_to_close_gap_min": round(time_to_close, 2),
        "headway_margin_min": round(headway_margin, 2),

        # Infrastructure
        "signal_code": signal_code,
        "current_headway_min": round(headway, 2),
        "safe_required_headway_min": round(safe_headway, 2),
        "platform_available": plat_val,
        "speed_restriction_kmh": round(speed_restriction, 2),
        "junction_busy": junc_val,
        "route_blocked": route_val,
        "section_occupancy": sec_occ,
        "time_of_day": round(time_of_day, 2),
        "weather_condition_CLEAR": 1.0 if weather_str == "CLEAR" else 0.0,
        "weather_condition_FOG": 1.0 if weather_str == "FOG" else 0.0,
        "weather_condition_RAIN": 1.0 if weather_str == "RAIN" else 0.0,
        "weather_condition_STORM": 1.0 if weather_str == "STORM" else 0.0,

        # History
        "speed_mean": hist_feats["speed_mean"],
        "speed_std": hist_feats["speed_std"],
        "speed_trend": hist_feats["speed_trend"],
        "position_progress_rate": hist_feats["position_progress_rate"],
        "delay_mean": hist_feats["delay_mean"],
        "delay_std": hist_feats["delay_std"],
        "delay_trend": hist_feats["delay_trend"]
    }

    return feat_dict


def build_feature_vector(raw_data: Dict[str, Any]) -> pd.DataFrame:
    """
    Constructs a 1-row pandas DataFrame strictly in FEATURE_COLUMNS order matching model training.
    """
    feat_dict = build_feature_dict(raw_data)
    row = {col: feat_dict.get(col, 0.0) for col in FEATURE_COLUMNS}
    return pd.DataFrame([row])[FEATURE_COLUMNS]


def calculate_prediction_confidence(
    raw_data: Dict[str, Any],
    conflict_probability: float
) -> float:
    """
    Calculates dynamic prediction confidence (0.0 to 1.0) based on data quality,
    feature completeness, history availability, and model prediction certainty.
    """
    confidence = 0.95

    # 1. Missing history penalties
    if not raw_data.get("speed_history") or len(raw_data.get("speed_history", [])) == 0:
        confidence -= 0.05
    if not raw_data.get("delay_history") or len(raw_data.get("delay_history", [])) == 0:
        confidence -= 0.05

    # 2. Missing train-ahead context penalty
    if "has_train_ahead" not in raw_data and "approaching_train_present" not in raw_data:
        confidence -= 0.04

    # 3. Model decision certainty penalty (uncertainty is highest around 0.50)
    certainty_factor = abs(conflict_probability - 0.5) * 2.0  # 0.0 at prob=0.5, 1.0 at prob=0.0 or 1.0
    uncertainty_penalty = (1.0 - certainty_factor) * 0.08
    confidence -= uncertainty_penalty

    # 4. Extreme weather condition penalty
    weather = str(raw_data.get("weather_condition", "CLEAR")).upper()
    if weather in ["FOG", "STORM"]:
        confidence -= 0.04

    return round(float(np.clip(confidence, 0.50, 0.98)), 2)
