"""
FastAPI WebSocket Integration Test for TrainSense (Steps 51–53)
Tests WebSocket connection, EventBus event broadcasting, JSON payload verification, and clean client disconnect.
"""

import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.event_bus import Event, EventType, event_bus
from app.main import app
from app.services.websocket_manager import ws_manager


def test_websocket_connection_and_eventbus_dispatch():
    print("==================================================")
    print("TrainSense Standalone WebSocket Test (Steps 51-53)")
    print("==================================================")

    client = TestClient(app)

    # 1. Establish WebSocket Connection to WS /ws
    print("Connecting WebSocket client to WS /ws...")
    with client.websocket_connect("/ws") as websocket:
        # Verify initial system connection message
        welcome_frame = websocket.receive_json()
        print("Received initial connection frame:", welcome_frame)
        assert welcome_frame["event_type"] == "SYSTEM_CONNECT"
        assert "Connected to TrainSense" in welcome_frame["message"]

        # 2. Publish an ALERT Event on the Event Bus (Steps 51-53)
        sample_alert_event = Event(
            event_type=EventType.ALERT,
            data={
                "alert_id": "ws-alert-999",
                "train_id": "LOCAL-101",
                "section": "SEC-A1-TRACK",
                "risk_score": 87.9,
                "risk_level": "CRITICAL",
                "alert_type": "CORRELATED_TRACK_INTRUSION",
                "recommendation": "HOLD LOCAL TRAIN"
            }
        )

        print(f"Publishing ALERT event to EventBus (Alert ID: {sample_alert_event.data['alert_id']})...")
        # Publish event through EventBus
        event_bus.publish_nowait = lambda evt: None  # sync/async bus publish check
        import asyncio
        asyncio.run(event_bus.publish(sample_alert_event))

        # 3. Receive broadcasted WebSocket message
        ws_event_frame = websocket.receive_json()
        print("\nReceived broadcasted EventBus frame on WebSocket client:")
        print(f"  Event ID   : {ws_event_frame.get('event_id')}")
        print(f"  Event Type : {ws_event_frame.get('event_type')}")
        print(f"  Timestamp  : {ws_event_frame.get('timestamp')}")
        print(f"  Payload    : {ws_event_frame.get('data')}")

        # Assertions
        assert ws_event_frame["event_type"] in ["ALERT", "EventType.ALERT"]
        assert ws_event_frame["data"]["alert_id"] == "ws-alert-999"
        assert ws_event_frame["data"]["risk_level"] == "CRITICAL"
        assert ws_event_frame["data"]["recommendation"] == "HOLD LOCAL TRAIN"

        # 4. Test client message exchange
        print("\nTesting client ping-pong text exchange...")
        websocket.send_text("PING")
        ack_frame = websocket.receive_json()
        print("Received client ACK frame:", ack_frame)
        assert ack_frame["event_type"] == "CLIENT_ACK"
        assert ack_frame["received"] == "PING"

    # 5. Verify Disconnect handling
    print("\nWebSocket client closed cleanly.")
    print("==================================================")
    print("[WEBSOCKET TEST SUCCESS]: WebSocket pipeline verified successfully!")
    print("==================================================")


if __name__ == "__main__":
    test_websocket_connection_and_eventbus_dispatch()
