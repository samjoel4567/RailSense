"""
Standalone Escalation Test Suite for TrainSense (Steps 54–55)
Tests automatic CRITICAL alert escalation timeout, acknowledgement cancellation, EventBus dispatch,
WebSocket broadcasting, and REST API state integration.
"""

import asyncio
import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.event_bus import Event, EventType, event_bus
from app.services.escalation_manager import EscalationManager, escalation_manager
from app.services.state_store import state_store
from app.services.websocket_manager import ws_manager


async def run_escalation_async_tests():
    print("==================================================")
    print("TrainSense Standalone Escalation Test (Steps 54-55)")
    print("==================================================")

    # ----------------------------------------------------
    # TEST CASE 1: UNACKNOWLEDGED CRITICAL ALERT ESCALATES
    # ----------------------------------------------------
    print("\n--- [TEST CASE 1: CRITICAL ALERT UNACKNOWLEDGED -> ESCALATES] ---")
    alert_id_1 = "crit-alert-101"
    received_bus_escalations = []
    received_ws_broadcasts = []

    async def bus_escalation_listener(event: Event):
        if event.data.get("status") == "ESCALATED":
            print(f"-> [EventBus Listener] Received ESCALATED event for Alert: {event.data.get('alert_id')}")
            received_bus_escalations.append(event)

    # Mock WebSocket client broadcasting recorder
    async def mock_ws_broadcast(message: dict):
        if message.get("data", {}).get("alert_id") == alert_id_1:
            received_ws_broadcasts.append(message)

    ws_manager.broadcast = mock_ws_broadcast
    event_bus.subscribe(EventType.ALERT, bus_escalation_listener)

    critical_event_1 = Event(
        event_type=EventType.ALERT,
        data={
            "alert_id": alert_id_1,
            "train_id": "LOCAL-101",
            "section": "SEC-A1-TRACK",
            "risk_score": 87.9,
            "risk_level": "CRITICAL",
            "alert_type": "CORRELATED_TRACK_INTRUSION",
            "recommendation": "HOLD LOCAL TRAIN",
            "status": "ACTIVE",
            "acknowledged": False,
            "escalated": False,
            "escalation_timeout": 0.20  # Fast test timeout (Production default remains 15.0s)
        }
    )

    print(f"Publishing CRITICAL alert '{alert_id_1}' to EventBus (timeout: 0.20s)...")
    await event_bus.publish(critical_event_1)

    # Verify initial alert registered in state store
    initial_alert = state_store.alerts.get(alert_id_1)
    assert initial_alert is not None
    assert initial_alert["status"] == "ACTIVE"
    assert initial_alert["escalated"] is False

    print("Waiting 0.35s for escalation timeout to expire...")
    await asyncio.sleep(0.35)

    # Verify EventBus received escalation event
    assert len(received_bus_escalations) >= 1, "Expected EventBus escalation event"
    escalated_bus_event = received_bus_escalations[-1].data
    assert escalated_bus_event["alert_id"] == alert_id_1
    assert escalated_bus_event["status"] == "ESCALATED"
    assert escalated_bus_event["escalated"] is True
    assert "escalation_timestamp" in escalated_bus_event

    # Verify WebSocket broadcast received escalation event
    assert len(received_ws_broadcasts) >= 1, "Expected WebSocket escalation broadcast"
    ws_event = received_ws_broadcasts[-1]
    assert ws_event["data"]["status"] == "ESCALATED"
    assert ws_event["data"]["escalated"] is True

    # Verify StateStore & REST API state shows escalated=True
    current_state = state_store.alerts.get(alert_id_1)
    assert current_state["status"] == "ESCALATED"
    assert current_state["escalated"] is True
    print(f"Test Case 1 PASSED: Alert '{alert_id_1}' escalated = {current_state['escalated']}, status = {current_state['status']}")

    # ----------------------------------------------------
    # TEST CASE 2: ACKNOWLEDGED IN TIME -> NO ESCALATION
    # ----------------------------------------------------
    print("\n--- [TEST CASE 2: CRITICAL ALERT ACKNOWLEDGED IN TIME -> NO ESCALATION] ---")
    alert_id_2 = "crit-alert-202"
    received_bus_escalations.clear()

    critical_event_2 = Event(
        event_type=EventType.ALERT,
        data={
            "alert_id": alert_id_2,
            "train_id": "EXPRESS-202",
            "section": "SEC-A1-TRACK",
            "risk_score": 92.5,
            "risk_level": "CRITICAL",
            "alert_type": "CORRELATED_TRACK_INTRUSION",
            "recommendation": "HOLD LOCAL TRAIN",
            "status": "ACTIVE",
            "acknowledged": False,
            "escalated": False,
            "escalation_timeout": 0.40  # 0.40s test timeout
        }
    )

    print(f"Publishing CRITICAL alert '{alert_id_2}' to EventBus...")
    await event_bus.publish(critical_event_2)

    # Acknowledge alert before 0.40s timeout
    print(f"Acknowledging alert '{alert_id_2}' via StateStore / API...")
    ack_result = state_store.acknowledge_alert(alert_id_2)
    assert ack_result is not None
    assert ack_result["status"] == "ACKNOWLEDGED"
    assert ack_result["acknowledged"] is True
    assert ack_result["escalated"] is False

    print("Waiting 0.55s (longer than timeout)...")
    await asyncio.sleep(0.55)

    # Verify escalation did NOT occur
    assert len(received_bus_escalations) == 0, "No escalation event should occur when acknowledged in time"
    final_alert_2 = state_store.alerts.get(alert_id_2)
    assert final_alert_2["status"] == "ACKNOWLEDGED"
    assert final_alert_2["acknowledged"] is True
    assert final_alert_2["escalated"] is False
    print(f"Test Case 2 PASSED: Alert '{alert_id_2}' acknowledged = {final_alert_2['acknowledged']}, escalated = {final_alert_2['escalated']}")

    print("\n==================================================")
    print("[ESCALATION TEST SUCCESS]: All escalation test cases passed successfully!")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(run_escalation_async_tests())
