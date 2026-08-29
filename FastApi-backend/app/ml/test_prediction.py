"""
TrainSense ML Prediction & Feature Engineering Test Suite (Step 19)
Verifies:
1. Feature Engineering (ordering, history extraction, missing data handling, confidence scoring)
2. Dual Model Inference (ETA, expected delay, conflict probability, confidence, action, time saved, reasoning)
3. Operational Scenarios (Normal vs High-Risk Conflict vs Rule-Based Interlocking Overrides)
4. EventBus Subscriptions (TRAIN_UPDATE -> ML Inference -> PREDICTION event)
"""

import asyncio
import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.event_bus import Event, EventBus, EventType
from app.ml.features import (
    FEATURE_COLUMNS,
    build_feature_dict,
    build_feature_vector,
    calculate_prediction_confidence,
    extract_history_features
)
from app.ml.predict import PredictionService, attach_prediction_service_to_bus


async def run_standalone_prediction_test():
    print("==================================================")
    print("TrainSense Upgraded ML Prediction & Feature Test")
    print("==================================================")

    # ----------------------------------------------------
    # 1. FEATURE ENGINEERING TESTS
    # ----------------------------------------------------
    print("\n--- [TEST GROUP 1: FEATURE ENGINEERING LAYER] ---")
    
    # 1.1 History feature summary & trend calculations
    speed_hist = [42.0, 44.0, 43.0, 41.0, 39.0]
    pos_hist = [102.1, 102.8, 103.5, 104.1, 104.6]
    delay_hist = [5.0, 5.5, 6.0, 7.0, 8.0]

    hist_feats = extract_history_features(
        speed_history=speed_hist,
        position_history=pos_hist,
        delay_history=delay_hist
    )
    print("Extracted History Features:")
    for k, v in hist_feats.items():
        print(f"  {k:<25}: {v}")

    assert hist_feats["speed_mean"] == 41.8, f"Expected 41.8, got {hist_feats['speed_mean']}"
    assert hist_feats["speed_trend"] == -3.0, f"Expected -3.0, got {hist_feats['speed_trend']}"
    assert hist_feats["delay_mean"] == 6.3, f"Expected 6.3, got {hist_feats['delay_mean']}"
    assert hist_feats["delay_trend"] == 3.0, f"Expected 3.0, got {hist_feats['delay_trend']}"
    assert hist_feats["position_progress_rate"] > 0.0

    # 1.2 Missing history handling
    empty_hist = extract_history_features(speed_history=[], fallback_speed=75.0, fallback_delay=4.0)
    assert empty_hist["speed_mean"] == 75.0
    assert empty_hist["speed_trend"] == 0.0
    assert empty_hist["delay_mean"] == 4.0

    # 1.3 Feature vector schema & ordering
    raw_sample = {
        "train_id": "LOCAL-101",
        "speed": 55.0,
        "current_delay": 8.0,
        "has_train_ahead": True,
        "distance_to_ahead_train_km": 2.5,
        "ahead_train_speed_kmh": 30.0,
        "current_signal": "YELLOW",
        "current_headway_min": 2.2,
        "speed_history": [60.0, 58.0, 55.0],
        "delay_history": [6.0, 7.0, 8.0]
    }
    feat_df = build_feature_vector(raw_sample)
    assert list(feat_df.columns) == FEATURE_COLUMNS, "Feature vector columns do not match FEATURE_COLUMNS single source of truth"
    assert feat_df.shape == (1, len(FEATURE_COLUMNS)), f"Expected shape (1, {len(FEATURE_COLUMNS)}), got {feat_df.shape}"
    print(f"Feature Vector Verification PASSED ({len(FEATURE_COLUMNS)} features)")

    # 1.4 Dynamic confidence score calculation
    conf_complete = calculate_prediction_confidence(raw_sample, conflict_probability=0.85)
    conf_missing = calculate_prediction_confidence({"speed": 55.0}, conflict_probability=0.50)
    assert conf_complete > conf_missing, f"Expected complete data confidence ({conf_complete}) > missing data confidence ({conf_missing})"
    print(f"Confidence score verification PASSED (Complete: {conf_complete}, Missing: {conf_missing})")

    # ----------------------------------------------------
    # 2. DUAL MODEL INFERENCE & SCENARIO TESTS
    # ----------------------------------------------------
    print("\n--- [TEST GROUP 2: DUAL ML MODEL INFERENCE] ---")
    service = PredictionService()

    # Scenario A: Normal Operation
    normal_input = {
        "train_id": "EXPRESS-202",
        "current_speed_kmh": 110.0,
        "current_delay_min": 0.0,
        "distance_to_next_station_km": 15.0,
        "train_priority": "EXPRESS",
        "current_signal": "GREEN",
        "current_headway_min": 18.0,
        "safe_required_headway_min": 3.0,
        "platform_availability": "AVAILABLE",
        "junction_status": "CLEAR",
        "route_status": "NORMAL",
        "has_train_ahead": False,
        "speed_history": [110.0, 110.0, 110.0],
        "delay_history": [0.0, 0.0, 0.0]
    }
    res_normal = service.predict(normal_input)
    print("\nScenario A (Normal Operation) Prediction:")
    print(f"  Conflict Probability   : {res_normal['conflict_probability']:.4f}")
    print(f"  Expected Delay         : {res_normal['expected_delay_min']:.2f} min")
    print(f"  Predicted ETA          : {res_normal['predicted_eta']}")
    print(f"  Recommended Action     : {res_normal['recommended_action']}")
    print(f"  Estimated Time Saved   : {res_normal['estimated_time_saved_min']:.1f} min")
    print(f"  Prediction Confidence  : {res_normal['prediction_confidence']:.2f}")

    assert res_normal["conflict_probability"] < 0.45, "Expected low conflict probability for normal scenario"
    assert res_normal["recommended_action"] == "PROCEED", f"Expected PROCEED, got {res_normal['recommended_action']}"
    assert res_normal["estimated_time_saved_min"] > 0.0
    assert "predicted_eta" in res_normal and isinstance(res_normal["predicted_eta"], str)

    # Scenario B: High-Risk Conflict
    conflict_input = {
        "train_id": "LOCAL-101",
        "current_speed_kmh": 50.0,
        "current_delay_min": 15.0,
        "distance_to_next_station_km": 2.0,
        "train_priority": "LOCAL",
        "current_signal": "YELLOW",
        "current_headway_min": 1.5,
        "safe_required_headway_min": 3.0,
        "junction_status": "BUSY",
        "platform_availability": "LIMITED",
        "has_train_ahead": True,
        "distance_to_ahead_train_km": 1.0,
        "ahead_train_speed_kmh": 20.0,
        "speed_history": [55.0, 52.0, 50.0],
        "delay_history": [10.0, 12.0, 15.0],
        "weather_condition": "FOG"
    }
    res_conflict = service.predict(conflict_input)
    print("\nScenario B (High-Risk Conflict) Prediction:")
    print(f"  Conflict Probability   : {res_conflict['conflict_probability']:.4f}")
    print(f"  Expected Delay         : {res_conflict['expected_delay_min']:.2f} min")
    print(f"  Predicted ETA          : {res_conflict['predicted_eta']}")
    print(f"  Recommended Action     : {res_conflict['recommended_action']}")
    print(f"  Estimated Time Saved   : {res_conflict['estimated_time_saved_min']:.1f} min")
    print(f"  Prediction Confidence  : {res_conflict['prediction_confidence']:.2f}")
    print(f"  Reasoning              : {res_conflict['reasoning']}")

    # Relationship assertions
    assert res_conflict["conflict_probability"] > res_normal["conflict_probability"], "Conflict scenario must have higher conflict prob than normal scenario"
    assert res_conflict["expected_delay_min"] > res_normal["expected_delay_min"], "Conflict scenario must have higher expected delay than normal scenario"
    assert res_conflict["recommended_action"] == "HOLD", f"Expected HOLD, got {res_conflict['recommended_action']}"
    assert res_conflict["estimated_time_saved_min"] > 0.0

    # Scenario C: Rule-Based Safety Override (RED Signal -> HOLD regardless of ML prob)
    red_signal_input = dict(normal_input)
    red_signal_input["current_signal"] = "RED"
    res_red = service.predict(red_signal_input)
    assert res_red["recommended_action"] == "HOLD", f"RED signal must trigger mandatory HOLD, got {res_red['recommended_action']}"
    assert res_red["reasoning"]["safety_override"] is True
    print("Rule-Based Safety Interlocking Override Verification PASSED (RED signal -> HOLD)")

    # ----------------------------------------------------
    # 3. EVENT BUS INTEGRATION TEST
    # ----------------------------------------------------
    print("\n--- [TEST GROUP 3: EVENT BUS INTEGRATION] ---")
    bus = EventBus()
    attach_prediction_service_to_bus(bus)

    received_events = []

    async def prediction_subscriber(event: Event):
        received_events.append(event)

    bus.subscribe(EventType.PREDICTION, prediction_subscriber)

    telemetry_event = Event(
        event_type=EventType.TRAIN_UPDATE,
        data={
            "train_id": "LOCAL-101",
            "section": "SEC-A1-TRACK",
            "current_speed_kmh": 45.0,
            "current_delay_min": 14.0,
            "current_signal": "YELLOW",
            "current_headway_min": 1.8,
            "has_train_ahead": True,
            "distance_to_ahead_train_km": 1.2
        }
    )

    await bus.publish(telemetry_event)

    assert len(received_events) == 1, "Expected 1 published PREDICTION event on EventBus"
    pub_data = received_events[0].data
    assert pub_data["train_id"] == "LOCAL-101"
    assert "expected_delay_min" in pub_data
    assert "conflict_probability" in pub_data
    assert "recommended_action" in pub_data
    assert "estimated_time_saved_min" in pub_data
    assert "prediction_confidence" in pub_data
    assert pub_data["recommended_action"] == "HOLD"

    print("Event Bus Publish/Subscribe Verification PASSED!")
    print("\n==================================================")
    print("ML PREDICTION PIPELINE VERIFICATION SUCCESS")
    print("==================================================")


def test_prediction_pipeline_end_to_end():
    """Makes verification visible to pytest."""
    asyncio.run(run_standalone_prediction_test())


if __name__ == "__main__":
    asyncio.run(run_standalone_prediction_test())
