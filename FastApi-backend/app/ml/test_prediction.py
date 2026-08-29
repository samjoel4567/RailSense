"""
Standalone Prediction Test for TrainSense (Steps 31–34)
Tests prediction pipeline, conflict detection, decision engine, and Event Bus integration.
"""

import asyncio
import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.event_bus import Event, EventBus, EventType
from app.ml.predict import PredictionService, attach_prediction_service_to_bus


async def run_standalone_prediction_test():
    print("==================================================")
    print("TrainSense Standalone Prediction Test (Steps 31-34)")
    print("==================================================")

    # 1. Initialize Prediction Service (Loads trained XGBoost model & metadata without retraining)
    service = PredictionService()

    # ----------------------------------------------------
    # TEST CASE 1: HIGH CONFLICT
    # ----------------------------------------------------
    print("\n--- [TEST CASE 1: HIGH CONFLICT] ---")
    high_conflict_input = {
        "train_id": "LOCAL-101",
        "train_speed": 45.0,
        "current_delay": 15.0,
        "previous_delay": 12.0,
        "section_occupancy": 1,
        "headway": 2.0,
        "train_priority": "LOCAL",
        "distance_to_next_station": 1.5,
        "time_of_day": 18.5,
        "weather_condition": "FOG"
    }

    res1 = service.predict(
        raw_features=high_conflict_input,
        approaching_train_present=True,
        approaching_train_priority="EXPRESS",
        arrival_time_overlap=True
    )

    print("Input Features:")
    for k, v in high_conflict_input.items():
        print(f"  {k:<25}: {v}")
    print("\nPrediction Results:")
    print(f"  Predicted Delay     : {res1['predicted_delay']} min")
    print(f"  Conflict Probability: {res1['conflict_probability']:.4f}")
    print(f"  Predicted ETA       : {res1['predicted_eta']}")
    print(f"  Potential Conflict  : {res1['potential_conflict']}")
    print(f"  Recommendation      : {res1['recommendation']}")

    # Assertions for Test Case 1
    assert res1["conflict_probability"] > 0.40, "Expected high conflict probability for Test Case 1"
    assert res1["potential_conflict"] is True, "Expected potential_conflict = True for Test Case 1"
    assert res1["recommendation"] == "HOLD LOCAL TRAIN", f"Expected HOLD LOCAL TRAIN, got {res1['recommendation']}"

    # ----------------------------------------------------
    # TEST CASE 2: LOW CONFLICT
    # ----------------------------------------------------
    print("\n--- [TEST CASE 2: LOW CONFLICT] ---")
    low_conflict_input = {
        "train_id": "EXPRESS-202",
        "train_speed": 130.0,
        "current_delay": 0.0,
        "previous_delay": 0.0,
        "section_occupancy": 0,
        "headway": 25.0,
        "train_priority": "EXPRESS",
        "distance_to_next_station": 30.0,
        "time_of_day": 10.0,
        "weather_condition": "CLEAR"
    }

    res2 = service.predict(
        raw_features=low_conflict_input,
        approaching_train_present=False,
        approaching_train_priority=None,
        arrival_time_overlap=False
    )

    print("Input Features:")
    for k, v in low_conflict_input.items():
        print(f"  {k:<25}: {v}")
    print("\nPrediction Results:")
    print(f"  Predicted Delay     : {res2['predicted_delay']} min")
    print(f"  Conflict Probability: {res2['conflict_probability']:.4f}")
    print(f"  Predicted ETA       : {res2['predicted_eta']}")
    print(f"  Potential Conflict  : {res2['potential_conflict']}")
    print(f"  Recommendation      : {res2['recommendation']}")

    # Assertions for Test Case 2
    assert res2["conflict_probability"] < 0.40, "Expected low conflict probability for Test Case 2"
    assert res2["potential_conflict"] is False, "Expected potential_conflict = False for Test Case 2"
    assert res2["recommendation"] == "PROCEED", f"Expected PROCEED, got {res2['recommendation']}"

    # ----------------------------------------------------
    # TEST CASE 3: EVENT BUS INTEGRATION (Step 32)
    # ----------------------------------------------------
    print("\n--- [TEST CASE 3: EVENT BUS INTEGRATION] ---")
    bus = EventBus()
    attach_prediction_service_to_bus(bus)

    received_prediction_events = []

    async def prediction_subscriber(event: Event):
        print(f"-> [EventBus Subscriber] Received {event.event_type} event: {event.data}")
        received_prediction_events.append(event)

    bus.subscribe(EventType.PREDICTION, prediction_subscriber)

    telemetry_event = Event(
        event_type=EventType.TRAIN_UPDATE,
        data={
            "train_id": "LOCAL-101",
            "section": "SEC-A1",
            "train_speed": 50.0,
            "current_delay": 12.0,
            "section_occupancy": 1,
            "headway": 3.0,
            "train_priority": "LOCAL",
            "approaching_train_present": True,
            "approaching_train_priority": "EXPRESS"
        }
    )

    print(f"Publishing TRAIN_UPDATE event to EventBus for train {telemetry_event.data['train_id']}...")
    await bus.publish(telemetry_event)

    assert len(received_prediction_events) == 1, "Prediction event was not published to EventBus subscriber"
    published_pred = received_prediction_events[0].data
    assert published_pred["train_id"] == "LOCAL-101"
    assert published_pred["potential_conflict"] is True
    assert published_pred["recommendation"] == "HOLD LOCAL TRAIN"
    print("Event Bus dispatch verification PASSED!")

    print("\n==================================================")
    print("[STEPS 31-34 SUCCESS]: All test cases passed successfully!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_standalone_prediction_test())
