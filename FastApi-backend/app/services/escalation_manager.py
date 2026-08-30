"""
TrainSense Escalation Manager
Provides automatic escalation for CRITICAL risk alerts when unacknowledged within 15 seconds.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional

from app.event_bus import Event, EventBus, EventType, event_bus

logger = logging.getLogger("TrainSense.EscalationManager")


class EscalationManager:
    """
    Manages automatic alert escalation timers for CRITICAL risk alerts.
    If a CRITICAL alert is not acknowledged within the configured timeout (default 15s),
    it is automatically escalated and an ESCALATED event is published over the Event Bus.
    """

    def __init__(self, bus: EventBus = event_bus, default_timeout_seconds: float = 15.0):
        self.bus = bus
        self.default_timeout_seconds = default_timeout_seconds
        self.active_timers: Dict[str, asyncio.Task] = {}
        self._subscribe_to_event_bus()

    def _subscribe_to_event_bus(self):
        """Subscribes handler to EventType.ALERT events on the Event Bus."""
        self.bus.subscribe(EventType.ALERT, self.handle_alert_event)

    async def handle_alert_event(self, event: Event):
        """Monitors incoming alerts and schedules escalation for CRITICAL alerts."""
        data = event.data
        alert_id = data.get("alert_id", data.get("id"))
        risk_level = str(data.get("risk_level", "")).upper()
        status = str(data.get("status", "ACTIVE")).upper()
        acknowledged = bool(data.get("acknowledged", False))
        escalated = bool(data.get("escalated", False))

        # Only process active CRITICAL alerts that have not been acknowledged/escalated
        if not alert_id or risk_level != "CRITICAL":
            return
        if status in ["ACKNOWLEDGED", "ESCALATED"] or acknowledged or escalated:
            return

        # Prevent duplicate active timers for the same alert
        if alert_id in self.active_timers and not self.active_timers[alert_id].done():
            return

        timeout = float(data.get("escalation_timeout", self.default_timeout_seconds))
        task = asyncio.create_task(self._escalation_timer(alert_id, event, timeout))
        self.active_timers[alert_id] = task
        logger.info(f"[EscalationManager] Scheduled escalation timer ({timeout}s) for CRITICAL alert '{alert_id}'")

    async def _escalation_timer(self, alert_id: str, original_event: Event, timeout: float):
        try:
            await asyncio.sleep(timeout)

            # Timeout expired -> Perform Escalation!
            data = original_event.data
            data["status"] = "ESCALATED"
            data["escalated"] = True
            data["acknowledged"] = False
            data["escalation_timestamp"] = datetime.now(timezone.utc).isoformat()
            data["escalation_target"] = "CONTROL_ROOM"

            escalated_event = Event(
                event_type=EventType.ALERT,
                data=data
            )

            await self.bus.publish(escalated_event)
            logger.warning(f"[EscalationManager] CRITICAL Alert '{alert_id}' ESCALATED to CONTROL ROOM after {timeout}s!")

        except asyncio.CancelledError:
            logger.info(f"[EscalationManager] Escalation timer for alert '{alert_id}' was CANCELLED (acknowledged in time).")
        finally:
            self.active_timers.pop(alert_id, None)

    def cancel_escalation(self, alert_id: str) -> bool:
        """Cancels active escalation timer when alert is acknowledged in time."""
        timer_task = self.active_timers.pop(alert_id, None)
        if timer_task and not timer_task.done():
            timer_task.cancel()
            return True
        return False


# Global singleton instance
escalation_manager = EscalationManager()
