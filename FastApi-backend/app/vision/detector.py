"""
TrainSense Vision Detector
YOLOv8 + OpenCV video frame inference, ROI danger region analysis, and alert debouncing.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from ultralytics import YOLO

logger = logging.getLogger("TrainSense.VisionDetector")


class VisionDetector:
    """
    YOLOv8 Vision Detector for railway track safety.
    Processes video frames, identifies track intrusions within a danger zone ROI,
    and applies alert debouncing/cooldowns.
    """

    RELEVANT_CLASSES = {"person", "car", "truck", "bus", "motorcycle", "bicycle", "train", "cat", "dog", "obstacle"}

    def __init__(
        self,
        model_name: str = "yolov8n.pt",
        confidence_threshold: float = 0.70,
        cooldown_seconds: float = 3.0,
        fps: float = 24.0,
        danger_zone_normalized: Tuple[float, float, float, float] = (0.0, 0.0, 1.0, 1.0)
    ):
        self.model_name = model_name
        self.confidence_threshold = confidence_threshold
        self.cooldown_seconds = cooldown_seconds
        self.fps = fps
        self.danger_zone_normalized = danger_zone_normalized
        self.model = YOLO(model_name)
        self.last_alert_timestamp: Dict[str, float] = {}

    def is_in_danger_zone(
        self,
        bbox: List[float],
        frame_width: int,
        frame_height: int
    ) -> bool:
        """
        Determines whether a detection bounding box [x1, y1, x2, y2] overlaps
        with the configured danger region of interest (ROI).
        """
        x1, y1, x2, y2 = bbox

        # Danger zone normalized coords [ymin, xmin, ymax, xmax]
        dz_ymin = self.danger_zone_normalized[0] * frame_height
        dz_xmin = self.danger_zone_normalized[1] * frame_width
        dz_ymax = self.danger_zone_normalized[2] * frame_height
        dz_xmax = self.danger_zone_normalized[3] * frame_width

        # Check box overlap with danger zone
        overlap_x = max(0.0, min(x2, dz_xmax) - max(x1, dz_xmin))
        overlap_y = max(0.0, min(y2, dz_ymax) - max(y1, dz_ymin))
        overlap_area = overlap_x * overlap_y

        box_area = (x2 - x1) * (y2 - y1)
        if box_area <= 0:
            return False

        cx = (x1 + x2) / 2.0
        cy = (y1 + y2) / 2.0
        center_inside = (dz_xmin <= cx <= dz_xmax) and (dz_ymin <= cy <= dz_ymax)

        return (overlap_area / box_area > 0.10) or center_inside

    def process_frame(
        self,
        frame: np.ndarray,
        frame_number: int
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Processes a single frame:
        Returns (raw_detections, qualifying_alerts).
        """
        height, width = frame.shape[:2]
        frame_time_seconds = frame_number / self.fps

        results = self.model(frame, verbose=False, conf=self.confidence_threshold)
        boxes = results[0].boxes

        raw_detections = []
        alerts = []

        if len(boxes) == 0:
            return raw_detections, alerts

        for box in boxes:
            cls_id = int(box.cls[0])
            class_name = self.model.names[cls_id].lower()
            confidence = float(box.conf[0])
            bbox = [round(float(x), 2) for x in box.xyxy[0].tolist()]

            if class_name not in self.RELEVANT_CLASSES:
                continue

            detection_info = {
                "class": class_name,
                "confidence": round(confidence, 4),
                "bounding_box": bbox,
                "frame_number": frame_number,
                "timestamp_seconds": round(frame_time_seconds, 2)
            }
            raw_detections.append(detection_info)

            # Check if detection falls inside the danger region ROI
            in_danger = self.is_in_danger_zone(bbox, width, height)
            if not in_danger:
                continue

            # Apply Cooldown / Debouncing per object class
            last_alert = self.last_alert_timestamp.get(class_name, -999.0)
            if (frame_time_seconds - last_alert) >= self.cooldown_seconds:
                self.last_alert_timestamp[class_name] = frame_time_seconds

                alert_event = {
                    "object_type": class_name,
                    "confidence": round(confidence, 4),
                    "bounding_box": bbox,
                    "frame_number": frame_number,
                    "video_source": "railway_demo.mp4",
                    "section": "SEC-A1-TRACK",
                    "severity": "CRITICAL" if class_name in ["person", "car", "truck", "bus"] else "HIGH",
                    "description": f"Track intrusion detected: {class_name.upper()} in danger region (frame {frame_number})"
                }
                alerts.append(alert_event)

        return raw_detections, alerts
