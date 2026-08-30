"""
TrainSense Correlation Engine
Consumes PREDICTION and VISION_DETECTION events, correlates spatial and temporal context,
computes unified risk assessments using RiskEngine, and publishes correlated ALERT events.
"""

from datetime import datetime, timezone
import logging
import re
from typing import Any, Dict, List, Optional

from app.event_bus import Event, EventBus, EventType, event_bus
from app.risk.engine import risk_engine, RiskEngine
from app.schemas.events import RiskAlert

logger = logging.getLogger("TrainSense.CorrelationEngine")


class CorrelationEngine:
    """
    Correlation Engine for TrainSense.
    Correlates independent AI telemetry (ML conflict predictions & Vision obstacle detections)
    to produce unified, context-aware operational risk alerts.
    """

    def __init__(self, bus: EventBus = event_bus, time_window_seconds: float = 300.0):
        self.bus = bus
        self.time_window_seconds = time_window_seconds
        self.prediction_cache: Dict[str, Dict[str, Any]] = {}
        self.vision_cache: Dict[str, Dict[str, Any]] = {}

    def correlate_signals(
        self,
        prediction_data: Optional[Dict[str, Any]] = None,
        vision_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Directly correlates a prediction event and vision event payload.
        """
        # Calculate time differential if timestamps present
        time_diff = 0.0
        if prediction_data and vision_data:
            try:
                t1 = datetime.fromisoformat(prediction_data.get("timestamp", datetime.now(timezone.utc).isoformat()))
                t2 = datetime.fromisoformat(vision_data.get("timestamp", datetime.now(timezone.utc).isoformat()))
                time_diff = abs((t1 - t2).total_seconds())
            except Exception:
                time_diff = 0.0

        return risk_engine.calculate_risk(
            prediction=prediction_data,
            vision=vision_data,
            temporal_diff_seconds=time_diff
        )

    def _normalize_section_key(self, section: Optional[str]) -> str:
        """
        Normalizes section identifiers for cross-event matching using generic pattern extraction.
        Strips harmless status/location suffixes (e.g., -TRACK, -CLEAR) while preserving actual section identity.
        """
        if not section or not str(section).strip():
            return "MAIN_LINE"
        sec = str(section).strip().upper()
        match = re.match(r'^([A-Z0-9]+-[A-Z0-9]+)(?:[-_].*)?$', sec)
        if match:
            return match.group(1)
        return sec

    async def handle_prediction_event(self, event: Event) -> Optional[Event]:
        """Handler for EventType.PREDICTION events."""
        pred_data = event.data
        section = pred_data.get("section", "MAIN_LINE")
        sec_key = self._normalize_section_key(section)

        self.prediction_cache[sec_key] = pred_data

        # Check matching cached vision event for this section
        vision_data = self.vision_cache.get(sec_key)
        alert_dict = self.correlate_signals(prediction_data=pred_data, vision_data=vision_data)

        # Create structured RiskAlert schema object
        alert_schema = RiskAlert(
            alert_id=alert_dict["alert_id"],
            risk_score=alert_dict["risk_score"],
            alert_level=alert_dict["risk_level"],
            location=alert_dict["location"],
            related_train_ids=alert_dict["related_train_ids"],
            related_events=alert_dict["related_events"],
            recommendation=alert_dict["recommendation"]
        )

        alert_event = Event(
            event_type=EventType.ALERT,
            data=alert_dict
        )

        await self.bus.publish(alert_event)
        logger.info(f"[CorrelationEngine] Published ALERT event (Level: {alert_dict['risk_level']}, Score: {alert_dict['risk_score']})")
        return alert_event

    async def handle_vision_event(self, event: Event) -> Optional[Event]:
        """Handler for EventType.VISION_DETECTION events."""
        vision_data = event.data
        section = vision_data.get("section", vision_data.get("location", "MAIN_LINE"))
        sec_key = self._normalize_section_key(section)

        self.vision_cache[sec_key] = vision_data

        # Check matching cached prediction event for this section
        pred_data = self.prediction_cache.get(sec_key)
        alert_dict = self.correlate_signals(prediction_data=pred_data, vision_data=vision_data)

        alert_event = Event(
            event_type=EventType.ALERT,
            data=alert_dict
        )

        await self.bus.publish(alert_event)
        logger.info(f"[CorrelationEngine] Published ALERT event from Vision (Level: {alert_dict['risk_level']}, Score: {alert_dict['risk_score']})")
        return alert_event

    def start_listening(self):
        """Subscribes the correlation engine to ML PREDICTION and Vision VISION_DETECTION event bus channels."""
        self.bus.subscribe(EventType.PREDICTION, self.handle_prediction_event)
        self.bus.subscribe(EventType.VISION_DETECTION, self.handle_vision_event)


# Global singleton instance
correlation_engine = CorrelationEngine()
