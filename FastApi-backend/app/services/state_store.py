"""
TrainSense State Store Service (Steps 12, 15)
Subscribes to Event Bus channels to maintain active in-memory operational state for REST API endpoints.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
from app.event_bus import Event, EventBus, EventType, event_bus

logger = logging.getLogger("TrainSense.StateStore")


class StateStore:
    """
    In-memory state store tracking trains, predictions, vision alerts, and risk alerts.
    Dynamically updated via EventBus subscribers.
    """

    def __init__(self, bus: EventBus = event_bus):
        self.bus = bus
        self.trains: Dict[str, Dict[str, Any]] = {}
        self.predictions: Dict[str, Dict[str, Any]] = {}
        self.alerts: Dict[str, Dict[str, Any]] = {}
        self.latest_prediction: Optional[Dict[str, Any]] = None
        self.latest_vision_detection: Optional[Dict[str, Any]] = None
        self._seed_default_state()
        self._subscribe_to_events()

    def _seed_default_state(self):
        """
        Seeds clean baseline operational layout placeholders for UI startup.
        No hardcoded fake ML predictions, conflict probabilities, or fake CRITICAL alerts are seeded.
        Live alerts and predictions are populated dynamically via EventBus events.
        """
        now_iso = datetime.now(timezone.utc).isoformat()

        # Clean baseline train operational telemetry placeholders (no hardcoded predictions)
        self.trains["LOCAL-101"] = {
            "train_id": "LOCAL-101",
            "section": "SEC-A1-TRACK",
            "speed": 45.0,
            "current_speed_kmh": 45.0,
            "current_delay": 0.0,
            "current_delay_min": 0.0,
            "predicted_delay": None,
            "expected_delay_min": None,
            "predicted_eta": None,
            "conflict_probability": None,
            "potential_conflict": False,
            "prediction_confidence": None,
            "recommended_action": "PROCEED",
            "recommendation": "PROCEED",
            "estimated_time_saved_min": None,
            "priority": "LOCAL",
            "train_priority": "LOCAL",
            "status": "OPERATIONAL",
            "is_live": False,
            "data_source": "DEMO_INITIAL",
            "telemetry_type": "SIMULATED_PLACEHOLDER",
            "last_updated": now_iso
        }

        self.trains["EXPRESS-202"] = {
            "train_id": "EXPRESS-202",
            "section": "SEC-A1-TRACK",
            "speed": 130.0,
            "current_speed_kmh": 130.0,
            "current_delay": 0.0,
            "current_delay_min": 0.0,
            "predicted_delay": None,
            "expected_delay_min": None,
            "predicted_eta": None,
            "conflict_probability": None,
            "potential_conflict": False,
            "prediction_confidence": None,
            "recommended_action": "PROCEED",
            "recommendation": "PROCEED",
            "estimated_time_saved_min": None,
            "priority": "EXPRESS",
            "train_priority": "EXPRESS",
            "status": "OPERATIONAL",
            "is_live": False,
            "data_source": "DEMO_INITIAL",
            "telemetry_type": "SIMULATED_PLACEHOLDER",
            "last_updated": now_iso
        }

        # Live dictionaries start strictly empty on startup
        self.predictions = {}
        self.alerts = {}
        self.latest_prediction = None
        self.latest_vision_detection = None

    def clear(self):
        """Clears all state and resets to initial clean startup state (useful for testing)."""
        self.trains.clear()
        self.predictions.clear()
        self.alerts.clear()
        self.latest_prediction = None
        self.latest_vision_detection = None
        self._seed_default_state()

    def _subscribe_to_events(self):
        """Registers EventBus handlers to update in-memory state in real time."""
        self.bus.subscribe(EventType.TRAIN_UPDATE, self.handle_train_update)
        self.bus.subscribe(EventType.PREDICTION, self.handle_prediction)
        self.bus.subscribe(EventType.VISION_DETECTION, self.handle_vision_detection)
        self.bus.subscribe(EventType.ALERT, self.handle_alert)

    async def handle_train_update(self, event: Event):
        data = event.data
        train_id = data.get("train_id")
        if train_id:
            if train_id not in self.trains:
                self.trains[train_id] = {}
            self.trains[train_id].update(data)
            self.trains[train_id]["is_live"] = True
            self.trains[train_id]["data_source"] = "LIVE"
            self.trains[train_id]["telemetry_type"] = "LIVE_TELEMETRY"
            self.trains[train_id]["last_updated"] = event.timestamp

    async def handle_prediction(self, event: Event):
        data = event.data
        train_id = data.get("train_id")
        self.latest_prediction = data
        if train_id:
            self.predictions[train_id] = data
            if train_id not in self.trains:
                self.trains[train_id] = {"train_id": train_id}
            self.trains[train_id].update({
                "predicted_delay": data.get("predicted_delay", data.get("expected_delay_min")),
                "expected_delay_min": data.get("expected_delay_min", data.get("predicted_delay")),
                "predicted_eta": data.get("predicted_eta"),
                "conflict_probability": data.get("conflict_probability"),
                "potential_conflict": data.get("potential_conflict"),
                "prediction_confidence": data.get("prediction_confidence"),
                "recommended_action": data.get("recommended_action"),
                "recommendation": data.get("recommendation"),
                "estimated_time_saved_min": data.get("estimated_time_saved_min"),
                "reasoning": data.get("reasoning"),
                "section": data.get("section", self.trains[train_id].get("section", "MAIN_LINE")),
                "is_live": True,
                "data_source": "LIVE",
                "telemetry_type": "LIVE_TELEMETRY",
                "last_updated": event.timestamp
            })

    async def handle_vision_detection(self, event: Event):
        self.latest_vision_detection = event.data

    async def handle_alert(self, event: Event):
        data = event.data
        alert_id = data.get("alert_id", data.get("id"))
        if alert_id:
            self.alerts[alert_id] = data

    def get_trains(self) -> List[Dict[str, Any]]:
        return list(self.trains.values())

    def get_predictions(self) -> List[Dict[str, Any]]:
        return list(self.predictions.values())

    def get_prediction(self, train_id: str) -> Optional[Dict[str, Any]]:
        return self.predictions.get(train_id)

    def get_alerts(self) -> List[Dict[str, Any]]:
        return list(self.alerts.values())

    def acknowledge_alert(self, alert_id: str) -> Optional[Dict[str, Any]]:
        from app.services.escalation_manager import escalation_manager
        if alert_id in self.alerts:
            self.alerts[alert_id]["status"] = "ACKNOWLEDGED"
            self.alerts[alert_id]["acknowledged"] = True
            self.alerts[alert_id]["escalated"] = False
            self.alerts[alert_id]["acknowledged_at"] = datetime.now(timezone.utc).isoformat()

            # Cancel active escalation timer if running
            escalation_manager.cancel_escalation(alert_id)
            return self.alerts[alert_id]
        return None

    def get_dashboard_summary(self) -> Dict[str, Any]:
        all_alerts = list(self.alerts.values())
        active_alerts = [a for a in all_alerts if a.get("status") == "ACTIVE"]
        critical_alerts = [a for a in active_alerts if a.get("risk_level") == "CRITICAL"]
        high_alerts = [a for a in active_alerts if a.get("risk_level") == "HIGH"]

        return {
            "system_status": "CRITICAL_ALERT" if critical_alerts else ("WARNING" if high_alerts else "NORMAL"),
            "active_trains_count": len(self.trains),
            "total_alerts_count": len(all_alerts),
            "active_alerts_count": len(active_alerts),
            "critical_alerts_count": len(critical_alerts),
            "high_alerts_count": len(high_alerts),
            "active_trains": self.get_trains(),
            "predictions": self.get_predictions(),
            "active_alerts": active_alerts,
            "latest_prediction": self.latest_prediction,
            "latest_vision_detection": self.latest_vision_detection,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global singleton instance
state_store = StateStore()
