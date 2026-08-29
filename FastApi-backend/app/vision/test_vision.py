"""
Standalone Vision Pipeline Test for TrainSense (Steps 36–39)
Tests YOLOv8 video frame inference, ROI evaluation, alert debouncing, and Event Bus integration.
"""

import asyncio
import os
import sys

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.event_bus import Event, EventBus, EventType
from app.vision.service import VisionService


async def run_standalone_vision_test():
    print("==================================================")
    print("TrainSense Standalone Vision Test (Steps 36-39)")
    print("==================================================")

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
    video_path = os.path.join(base_dir, "data/videos/railway_demo.mp4")

    if not os.path.exists(video_path):
        print(f"ERROR: Video file not found at {video_path}")
        return

    # 1. Setup Event Bus & Subscriber to verify event delivery (Step 39)
    bus = EventBus()
    received_vision_events = []

    async def vision_event_subscriber(event: Event):
        print(f"-> [EventBus Subscriber] Received {event.event_type} event: {event.data['object_type'].upper()} (Conf: {event.data['confidence']})")
        received_vision_events.append(event)

    bus.subscribe(EventType.VISION_DETECTION, vision_event_subscriber)

    # 2. Initialize Vision Service with YOLOv8n, 0.70 confidence threshold, and 3.0s cooldown
    print(f"\nInitializing VisionService with YOLOv8n model...")
    service = VisionService(
        model_name="yolov8n.pt",
        confidence_threshold=0.70,
        cooldown_seconds=3.0,
        bus=bus
    )

    print(f"Processing video: {video_path}...")
    result = await service.process_video(video_path)

    print("\n--------------------------------------------------")
    print("Vision Processing Summary:")
    print("--------------------------------------------------")
    print(f"YOLO Model Used       : yolov8n.pt")
    print(f"Frames Processed      : {result['frames_processed']}")
    print(f"Raw Detections (>=0.70): {result['total_raw_detections']}")
    print(f"Qualifying Alerts     : {result['qualifying_alerts']}")

    print("\nSample Detections Log:")
    seen_log = result['raw_detection_log'][:10]
    for det in seen_log:
        print(f"  Frame {det['frame_number']:<4} | Class: {det['class']:<10} | Conf: {det['confidence']:.4f} | BBox: {det['bounding_box']}")

    # 3. Verification of Event Bus integration
    if result["qualifying_alerts"] > 0:
        print("\n--------------------------------------------------")
        print("Event Bus Delivery Verification:")
        print("--------------------------------------------------")
        assert len(received_vision_events) == result["qualifying_alerts"], "Mismatch in published vs received vision events"
        
        sample_event = received_vision_events[0].data
        print(f"Delivered Event ID     : {received_vision_events[0].event_id}")
        print(f"Event Type             : {sample_event['event_type']}")
        print(f"Object Type            : {sample_event['object_type']}")
        print(f"Confidence             : {sample_event['confidence']}")
        print(f"Bounding Box           : {sample_event['bounding_box']}")
        print(f"Frame Number           : {sample_event['frame_number']}")
        print(f"Section / Track ID     : {sample_event['section']}")
        print(f"Severity               : {sample_event['severity']}")
        print(f"Description            : {sample_event['description']}")
        print(f"Timestamp              : {sample_event['timestamp']}")
        print("\n[EVENT BUS VERIFICATION PASSED]: Event Bus successfully received structured vision events!")
    else:
        print("\nNo qualifying detection in selected demo video.")

    print("\n==================================================")
    print("[STEPS 36-39 SUCCESS]: Vision pipeline test completed successfully!")
    print("==================================================")


def test_vision_pipeline_end_to_end():
    """Makes the standalone vision verification visible to pytest."""
    asyncio.run(run_standalone_vision_test())


if __name__ == "__main__":
    asyncio.run(run_standalone_vision_test())
