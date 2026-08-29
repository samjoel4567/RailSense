import asyncio
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.event_bus import Event, EventBus, EventType


async def main():
    print("=== TrainSense In-Memory Async Event Bus Test ===")
    
    bus = EventBus()
    received_events_sub1 = []
    received_events_sub2 = []

    # Subscriber 1: Telemetry Monitor
    async def telemetry_monitor_subscriber(event: Event):
        print(f"-> [Subscriber 1 - TelemetryMonitor] Received {event.event_type} (ID: {event.event_id}): {event.data}")
        received_events_sub1.append(event)

    # Subscriber 2: Risk Evaluator
    async def risk_evaluator_subscriber(event: Event):
        print(f"-> [Subscriber 2 - RiskEvaluator] Received {event.event_type} (ID: {event.event_id}): {event.data}")
        received_events_sub2.append(event)

    # Subscribe handlers to TRAIN_UPDATE event type
    bus.subscribe(EventType.TRAIN_UPDATE, telemetry_monitor_subscriber)
    bus.subscribe(EventType.TRAIN_UPDATE, risk_evaluator_subscriber)

    # Create sample TRAIN_UPDATE event payload
    sample_payload = {
        "train_id": "EXPRESS-2024",
        "speed_kmh": 120.5,
        "track_id": "TRK-901-NORTH",
        "status": "OPERATIONAL"
    }
    
    event = Event(
        event_type=EventType.TRAIN_UPDATE,
        data=sample_payload
    )

    print(f"\n[Publisher] Publishing TRAIN_UPDATE event for Train {sample_payload['train_id']}...")
    await bus.publish(event)

    # Assertions
    assert len(received_events_sub1) == 1, "Subscriber 1 did not receive event"
    assert len(received_events_sub2) == 1, "Subscriber 2 did not receive event"
    assert received_events_sub1[0].data["train_id"] == "EXPRESS-2024"
    assert received_events_sub2[0].data["speed_kmh"] == 120.5
    assert received_events_sub1[0].event_type == EventType.TRAIN_UPDATE

    print("\n[VERIFICATION PASSED] Published event was successfully delivered asynchronously to all subscribers!")


if __name__ == "__main__":
    asyncio.run(main())
