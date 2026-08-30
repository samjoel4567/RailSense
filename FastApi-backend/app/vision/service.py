"""
TrainSense Vision Service
Reads prerecorded video, runs VisionDetector, formats structured vision events,
and publishes alerts to the Event Bus (vision-events / EventType.VISION_DETECTION).
"""

from datetime import datetime, timezone
import os
from typing import Any, Dict, List, Optional
import cv2

from app.event_bus import Event, EventBus, EventType, event_bus
from app.schemas.events import VisionEvent
from app.vision.detector import VisionDetector


class VisionService:
    def __init__(
        self,
        model_name: str = "yolov8n.pt",
        confidence_threshold: float = 0.70,
        cooldown_seconds: float = 3.0,
        bus: EventBus = event_bus
    ):
        self.detector = VisionDetector(
            model_name=model_name,
            confidence_threshold=confidence_threshold,
            cooldown_seconds=cooldown_seconds
        )
        self.bus = bus

    async def process_video(
        self,
        video_path: str,
        section: str = "SEC-A1-TRACK"
    ) -> Dict[str, Any]:
        """
        Processes video frame-by-frame, evaluates YOLOv8 detections against ROI & debouncing,
        and publishes qualifying vision events to the Event Bus.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found at: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Could not open video file: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps and fps > 0:
            self.detector.fps = fps

        frame_number = 0
        total_raw_detections = 0
        published_events: List[Event] = []
        raw_detection_log: List[Dict[str, Any]] = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_number += 1

            raw_dets, alerts = self.detector.process_frame(frame, frame_number)
            total_raw_detections += len(raw_dets)
            raw_detection_log.extend(raw_dets)

            for alert in alerts:
                # Format event payload according to Step 39 specification
                event_payload = {
                    "event_type": EventType.VISION_DETECTION,
                    "source": alert["video_source"],
                    "object_type": alert["object_type"],
                    "confidence": alert["confidence"],
                    "bounding_box": alert["bounding_box"],
                    "frame_number": alert["frame_number"],
                    "section": section,
                    "location": section,
                    "track_id": section,
                    "severity": alert["severity"],
                    "description": alert["description"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                # Construct Pydantic VisionEvent schema instance
                vision_schema = VisionEvent(
                    object_type=alert["object_type"],
                    confidence=alert["confidence"],
                    location=section,
                    bounding_box=alert["bounding_box"],
                    video_source=alert["video_source"]
                )

                # Wrap in Event Bus Event container
                event = Event(
                    event_type=EventType.VISION_DETECTION,
                    data=event_payload
                )

                # Publish vision event to Event Bus (vision-events)
                await self.bus.publish(event)
                published_events.append(event)
                print(f"[VisionService ALERT] Published {alert['object_type'].upper()} alert on frame {frame_number} (Conf: {alert['confidence']})")

        cap.release()

        return {
            "frames_processed": frame_number,
            "total_raw_detections": total_raw_detections,
            "qualifying_alerts": len(published_events),
            "published_events": published_events,
            "raw_detection_log": raw_detection_log
        }
