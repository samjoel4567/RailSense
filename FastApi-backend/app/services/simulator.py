"""
TrainSense Telemetry & Demo Scenario Simulator (Step 13)
Generates real-time train operational telemetry across realistic railway operational scenarios:
- Scenario A: Normal Operation (Signal GREEN, safe headway, clear junction -> PROCEED)
- Scenario B: High-Risk Operational Conflict (Signal YELLOW/RED, train ahead close, unsafe headway -> HOLD)
- Scenario C: Multi-Modal Conflict (Telemetry + YOLOv8 track intrusion -> Correlation -> CRITICAL Alert)
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional

from app.event_bus import Event, EventBus, EventType, event_bus
from app.ml.predict import prediction_service
from app.services.state_store import state_store
from app.services.websocket_manager import ws_manager

logger = logging.getLogger("TrainSense.Simulator")


class TelemetrySimulator:
    """
    Real-time telemetry and multi-modal scenario simulator for TrainSense.
    Emits continuous TRAIN_UPDATE telemetry events and executes scripted demo scenarios.
    """

    def __init__(self, bus: EventBus = event_bus):
        self.bus = bus
        self.is_running: bool = False
        self._simulation_task: Optional[asyncio.Task] = None
        self.interval_seconds: float = 2.0
        self.current_step: int = 0
        self.scenario_name: str = "IDLE"

    async def start(self, interval_seconds: float = 2.0):
        """Starts background telemetry simulation loop."""
        if self.is_running:
            logger.info("[Simulator] Simulation already running.")
            return

        self.is_running = True
        self.interval_seconds = interval_seconds
        self.scenario_name = "LIVE_TELEMETRY_LOOP"
        self._simulation_task = asyncio.create_task(self._simulation_loop())
        logger.info(f"[Simulator] Simulation started (interval: {interval_seconds}s).")

    async def stop(self):
        """Stops background telemetry simulation loop."""
        if not self.is_running:
            return

        self.is_running = False
        self.scenario_name = "IDLE"
        if self._simulation_task and not self._simulation_task.done():
            self._simulation_task.cancel()
            self._simulation_task = None
        logger.info("[Simulator] Simulation stopped.")

    async def _simulation_loop(self):
        try:
            while self.is_running:
                self.current_step += 1
                await self.emit_telemetry_frame()
                await asyncio.sleep(self.interval_seconds)
        except asyncio.CancelledError:
            logger.info("[Simulator] Telemetry loop cancelled cleanly.")

    async def emit_telemetry_frame(self) -> Dict[str, Any]:
        """Emits a single standard telemetry frame for active trains over Event Bus."""
        now_iso = datetime.now(timezone.utc).isoformat()

        # Train 1: LOCAL-101 (Approaching danger region on SEC-A1-TRACK)
        local_telemetry = {
            "train_id": "LOCAL-101",
            "section": "SEC-A1-TRACK",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "current_position_km": 42.5,
            "speed": 45.0,
            "current_speed_kmh": 45.0,
            "train_speed": 45.0,
            "current_delay": 15.0,
            "current_delay_min": 15.0,
            "previous_delay": 12.0,
            "section_occupancy": 1,
            "headway": 1.8,
            "current_headway_min": 1.8,
            "safe_required_headway_min": 3.0,
            "train_priority": "LOCAL",
            "priority": "LOCAL",
            "distance_to_next_station": 1.5,
            "distance_to_next_station_km": 1.5,
            "time_of_day": 18.5,
            "weather_condition": "FOG",
            "current_signal": "YELLOW",
            "platform_availability": "LIMITED",
            "junction_status": "BUSY",
            "route_status": "NORMAL",
            "has_train_ahead": True,
            "distance_to_ahead_train_km": 1.2,
            "ahead_train_speed_kmh": 20.0,
            "speed_history": [55.0, 50.0, 48.0, 45.0],
            "position_history": [40.0, 41.0, 41.8, 42.5],
            "delay_history": [10.0, 12.0, 14.0, 15.0],
            "approaching_train_present": True,
            "approaching_train_priority": "EXPRESS",
            "arrival_time_overlap": True,
            "timestamp": now_iso
        }

        # Train 2: EXPRESS-202 (Express priority train on SEC-A1-TRACK)
        express_telemetry = {
            "train_id": "EXPRESS-202",
            "section": "SEC-A1-TRACK",
            "latitude": 28.6250,
            "longitude": 77.2150,
            "current_position_km": 40.0,
            "speed": 130.0,
            "current_speed_kmh": 130.0,
            "train_speed": 130.0,
            "current_delay": 0.0,
            "current_delay_min": 0.0,
            "previous_delay": 0.0,
            "section_occupancy": 1,
            "headway": 1.8,
            "current_headway_min": 1.8,
            "safe_required_headway_min": 3.0,
            "train_priority": "EXPRESS",
            "priority": "EXPRESS",
            "distance_to_next_station": 5.0,
            "distance_to_next_station_km": 5.0,
            "time_of_day": 18.5,
            "weather_condition": "CLEAR",
            "current_signal": "YELLOW",
            "platform_availability": "AVAILABLE",
            "junction_status": "BUSY",
            "route_status": "NORMAL",
            "has_train_ahead": True,
            "distance_to_ahead_train_km": 2.5,
            "ahead_train_speed_kmh": 45.0,
            "speed_history": [130.0, 130.0, 130.0, 130.0],
            "position_history": [34.0, 36.0, 38.0, 40.0],
            "delay_history": [0.0, 0.0, 0.0, 0.0],
            "timestamp": now_iso
        }

        # Publish TRAIN_UPDATE events to Event Bus
        await self.bus.publish(Event(event_type=EventType.TRAIN_UPDATE, data=local_telemetry))
        await self.bus.publish(Event(event_type=EventType.TRAIN_UPDATE, data=express_telemetry))

        return {
            "step": self.current_step,
            "trains_emitted": ["LOCAL-101", "EXPRESS-202"],
            "timestamp": now_iso
        }

    async def trigger_normal_scenario(self) -> Dict[str, Any]:
        """
        Triggers Scenario A: Normal Railway Operation
        - Signal GREEN, safe headway (15.0m), platform AVAILABLE, clear junction -> PROCEED
        """
        self.scenario_name = "NORMAL_OPERATION_SCENARIO"
        now_iso = datetime.now(timezone.utc).isoformat()

        normal_telemetry_1 = {
            "train_id": "EXPRESS-202",
            "section": "SEC-B2-CLEAR",
            "latitude": 28.7000,
            "longitude": 77.3000,
            "current_position_km": 110.0,
            "speed": 110.0,
            "current_speed_kmh": 110.0,
            "train_speed": 110.0,
            "current_delay": 0.0,
            "current_delay_min": 0.0,
            "previous_delay": 0.0,
            "section_occupancy": 0,
            "headway": 18.0,
            "current_headway_min": 18.0,
            "safe_required_headway_min": 3.0,
            "train_priority": "EXPRESS",
            "priority": "EXPRESS",
            "distance_to_next_station": 12.0,
            "distance_to_next_station_km": 12.0,
            "time_of_day": 10.0,
            "weather_condition": "CLEAR",
            "current_signal": "GREEN",
            "platform_availability": "AVAILABLE",
            "junction_status": "CLEAR",
            "route_status": "NORMAL",
            "has_train_ahead": False,
            "distance_to_ahead_train_km": 100.0,
            "ahead_train_speed_kmh": 0.0,
            "speed_history": [108.0, 110.0, 110.0, 110.0],
            "position_history": [100.0, 103.0, 107.0, 110.0],
            "delay_history": [0.0, 0.0, 0.0, 0.0],
            "timestamp": now_iso
        }

        await self.bus.publish(Event(event_type=EventType.TRAIN_UPDATE, data=normal_telemetry_1))
        predictions = state_store.get_predictions()
        latest_pred = state_store.get_prediction("EXPRESS-202")

        return {
            "scenario": "NORMAL_OPERATION_SCENARIO",
            "status": "SUCCESS",
            "train_emitted": "EXPRESS-202",
            "prediction": latest_pred,
            "timestamp": now_iso
        }

    async def trigger_high_risk_conflict_scenario(self) -> Dict[str, Any]:
        """
        Triggers Scenario B/C: Multi-Modal High-Risk Conflict & Vision Intrusion
        1. Emits high-conflict telemetry for LOCAL-101 vs EXPRESS-202.
        2. Emits Vision PERSON intrusion detection on SEC-A1-TRACK.
        3. Drives ML Prediction -> Vision Detection -> Correlation -> Risk Alert -> Escalation Timer.
        """
        self.scenario_name = "HIGH_RISK_CONFLICT_SCENARIO"
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Telemetry Telecasting
        await self.emit_telemetry_frame()

        # 2. Vision Intrusion Detection Telecasting
        vision_payload = {
            "event_type": EventType.VISION_DETECTION,
            "source": "railway_demo.mp4",
            "object_type": "person",
            "confidence": 0.8814,
            "bounding_box": [39.65, 172.87, 193.31, 403.19],
            "frame_number": 41,
            "section": "SEC-A1-TRACK",
            "location": "SEC-A1-TRACK",
            "track_id": "SEC-A1-TRACK",
            "severity": "CRITICAL",
            "description": "Track intrusion detected: PERSON in danger region (frame 41)",
            "timestamp": now_iso
        }

        print(f"[Simulator] Triggering Vision PERSON intrusion event on section SEC-A1-TRACK...")
        await self.bus.publish(Event(event_type=EventType.VISION_DETECTION, data=vision_payload))

        # Fetch latest correlated alert state
        alerts = state_store.get_alerts()
        latest_alert = alerts[-1] if alerts else None
        predictions = state_store.get_predictions()

        return {
            "scenario": "HIGH_RISK_CONFLICT_SCENARIO",
            "status": "SUCCESS",
            "telemetry_emitted": ["LOCAL-101", "EXPRESS-202"],
            "vision_event_emitted": "person",
            "latest_alert": latest_alert,
            "predictions_count": len(predictions),
            "timestamp": now_iso
        }

    def get_status(self) -> Dict[str, Any]:
        return {
            "is_running": self.is_running,
            "interval_seconds": self.interval_seconds,
            "current_step": self.current_step,
            "scenario_name": self.scenario_name,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global singleton instance
simulator = TelemetrySimulator()
