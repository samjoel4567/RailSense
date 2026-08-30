"""
TrainSense Escalation Manager
Handles automated escalation of unacknowledged high/critical operational alerts.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, Optional

from app.event_bus import Event, EventBus, EventType, event_bus

logger = logging.getLogger("TrainSense.EscalationManager")


class EscalationManager:
    """
    Manages operational alert escalations and acknowledgement timeouts.
    """

    def __init__(self, bus: EventBus = event_bus, default_timeout_seconds: float = 30.0):
        self.bus = bus
        self.default_timeout_seconds = default_timeout_seconds
        self.active_timers: Dict[str, asyncio.Task] = {}

    def schedule_escalation(self, alert_id: str, timeout_seconds: Optional[float] = None):
        """Schedules automated escalation for an active alert."""
        timeout = timeout_seconds if timeout_seconds is not None else self.default_timeout_seconds
        self.cancel_escalation(alert_id)
        task = asyncio.create_task(self._escalate_after_delay(alert_id, timeout))
        self.active_timers[alert_id] = task

    async def _escalate_after_delay(self, alert_id: str, delay: float):
        try:
            await asyncio.sleep(delay)
            from app.services.state_store import state_store
            alert = state_store.alerts.get(alert_id)
            if alert and alert.get("status") == "ACTIVE" and not alert.get("acknowledged", False):
                alert["status"] = "ESCALATED"
                alert["escalated"] = True
                alert["escalated_at"] = datetime.now(timezone.utc).isoformat()
                logger.warning(f"[EscalationManager] Alert {alert_id} escalated due to acknowledgement timeout.")
        except asyncio.CancelledError:
            pass
        finally:
            self.active_timers.pop(alert_id, None)

    def cancel_escalation(self, alert_id: str):
        """Cancels any pending escalation timer for the given alert ID."""
        task = self.active_timers.pop(alert_id, None)
        if task and not task.done():
            task.cancel()


escalation_manager = EscalationManager()
