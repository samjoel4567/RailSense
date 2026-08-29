"""
Standalone Correlation Engine Test for TrainSense
Tests ML prediction & Vision detection signal correlation, risk-scoring, and Event Bus alert dispatch.
"""

import asyncio
import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.event_bus import Event, EventBus, EventType
from app.correlation.engine import CorrelationEngine
from app.risk.engine import RiskEngine


async def run_standalone_correlation_test():
    print("==================================================")
    print("TrainSense Standalone Correlation & Risk Test")
    print("==================================================")

    bus = EventBus()
    correlation_engine = CorrelationEngine(bus=bus)
    correlation_engine.start_listening()

    received_risk_alerts = []

    async def alert_event_subscriber(event: Event):
        print(f"-> [EventBus Subscriber] Received {event.event_type} event (Alert ID: {event.data['alert_id']}): {event.data['alert_type']} (Level: {event.data['risk_level']}, Score: {event.data['risk_score']})")
        received_risk_alerts.append(event)

    bus.subscribe(EventType.ALERT, alert_event_subscriber)

    # ----------------------------------------------------
    # TEST CASE 1: HIGH / CRITICAL CORRELATED RISK
    # ----------------------------------------------------
    print("\n--- [TEST CASE 1: HIGH / CRITICAL CORRELATED RISK] ---")

    high_prediction_data = {
        "event_id": "pred-evt-101",
        "event_type": EventType.PREDICTION,
        "train_id": "LOCAL-101",
        "predicted_delay": 32.6,
        "predicted_eta": "2026-08-29T18:30:00+00:00",
        "conflict_probability": 0.9157,
        "potential_conflict": True,
        "recommendation": "HOLD LOCAL TRAIN",
        "section": "SEC-A1-TRACK",
        "timestamp": "2026-08-29T17:35:00+00:00"
    }

    high_vision_data = {
        "event_id": "vis-evt-202",
        "event_type": EventType.VISION_DETECTION,
        "object_type": "person",
        "confidence": 0.8814,
        "bounding_box": [39.65, 172.87, 193.31, 403.19],
        "frame_number": 41,
        "section": "SEC-A1-TRACK",
        "severity": "CRITICAL",
        "description": "Track intrusion detected: PERSON in danger region (frame 41)",
        "timestamp": "2026-08-29T17:35:02+00:00"
    }

    print("Publishing ML Prediction Event (LOCAL-101, High Conflict Prob 0.9157)...")
    await bus.publish(Event(event_type=EventType.PREDICTION, data=high_prediction_data))

    print("Publishing Vision Detection Event (PERSON intrusion, Conf 0.8814)...")
    await bus.publish(Event(event_type=EventType.VISION_DETECTION, data=high_vision_data))

    # Assertions for Test Case 1
    assert len(received_risk_alerts) >= 2, "Expected at least 2 alert publications during test sequence"
    tc1_alert = received_risk_alerts[-1].data

    print("\nCorrelated Risk Alert Results (Test Case 1):")
    print(f"  Train ID             : {tc1_alert['train_id']}")
    print(f"  Section              : {tc1_alert['section']}")
    print(f"  Risk Score           : {tc1_alert['risk_score']} / 100")
    print(f"  Risk Level           : {tc1_alert['risk_level']}")
    print(f"  Alert Type           : {tc1_alert['alert_type']}")
    print(f"  ML Conflict Prob     : {tc1_alert['ml_probability']}")
    print(f"  Vision Object        : {tc1_alert['vision_object_type'].upper()}")
    print(f"  Vision Confidence    : {tc1_alert['vision_confidence']}")
    print(f"  Recommendation       : {tc1_alert['recommendation']}")
    print(f"  Explanation          : {tc1_alert['explanation']}")

    assert tc1_alert["risk_level"] in ["HIGH", "CRITICAL"], f"Expected HIGH or CRITICAL, got {tc1_alert['risk_level']}"
    assert tc1_alert["risk_score"] >= 75.0, f"Expected risk_score >= 75.0, got {tc1_alert['risk_score']}"
    assert tc1_alert["recommendation"] == "HOLD LOCAL TRAIN", f"Expected HOLD LOCAL TRAIN, got {tc1_alert['recommendation']}"
    assert "CORRELATED" in tc1_alert["explanation"], "Explanation must describe why signals were correlated"

    # ----------------------------------------------------
    # TEST CASE 2: LOW RISK
    # ----------------------------------------------------
    print("\n--- [TEST CASE 2: LOW RISK] ---")

    received_risk_alerts.clear()

    low_prediction_data = {
        "event_id": "pred-evt-303",
        "event_type": EventType.PREDICTION,
        "train_id": "EXPRESS-202",
        "predicted_delay": 0.0,
        "predicted_eta": "2026-08-29T18:45:00+00:00",
        "conflict_probability": 0.0659,
        "potential_conflict": False,
        "recommendation": "PROCEED",
        "section": "SEC-B2-CLEAR",
        "timestamp": "2026-08-29T17:40:00+00:00"
    }

    print("Publishing ML Prediction Event (EXPRESS-202, Low Conflict Prob 0.0659)...")
    await bus.publish(Event(event_type=EventType.PREDICTION, data=low_prediction_data))

    assert len(received_risk_alerts) == 1, "Expected 1 alert publication for Test Case 2"
    tc2_alert = received_risk_alerts[0].data

    print("\nCorrelated Risk Alert Results (Test Case 2):")
    print(f"  Train ID             : {tc2_alert['train_id']}")
    print(f"  Section              : {tc2_alert['section']}")
    print(f"  Risk Score           : {tc2_alert['risk_score']} / 100")
    print(f"  Risk Level           : {tc2_alert['risk_level']}")
    print(f"  Alert Type           : {tc2_alert['alert_type']}")
    print(f"  Recommendation       : {tc2_alert['recommendation']}")
    print(f"  Explanation          : {tc2_alert['explanation']}")

    assert tc2_alert["risk_level"] == "LOW", f"Expected LOW risk level, got {tc2_alert['risk_level']}"
    assert tc2_alert["risk_score"] < 25.0, f"Expected risk_score < 25.0, got {tc2_alert['risk_score']}"
    assert tc2_alert["recommendation"] == "PROCEED", f"Expected PROCEED, got {tc2_alert['recommendation']}"

    print("\n==================================================")
    print("Event Bus Delivery Verification:")
    print("--------------------------------------------------")
    print(f"Delivered Alert Event ID : {received_risk_alerts[0].event_id}")
    print(f"Delivered Event Type     : {received_risk_alerts[0].event_type}")
    print("[EVENT BUS VERIFICATION PASSED]: Correlated risk alerts successfully delivered over Event Bus!")

    print("\n==================================================")
    print("[CORRELATION & RISK ENGINE SUCCESS]: All test cases passed successfully!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_standalone_correlation_test())
