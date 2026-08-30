"""
TrainSense WebSocket Manager (Step 16)
Manages real-time WebSocket client connections and broadcasts Event Bus events
(TRAIN_UPDATE, PREDICTION, VISION_DETECTION, ALERT) to all connected clients.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List
from fastapi import WebSocket

from app.event_bus import Event, EventBus, EventType, event_bus

logger = logging.getLogger("TrainSense.WebSocketManager")


class WebSocketManager:
    """
    Manages active WebSocket connections and relays EventBus events to connected frontend clients.
    """

    def __init__(self, bus: EventBus = event_bus):
        self.bus = bus
        self.active_connections: List[WebSocket] = []
        self._subscribe_to_events()

    def _subscribe_to_events(self):
        """Subscribes to all major event bus channels for client broadcasting."""
        self.bus.subscribe(EventType.TRAIN_UPDATE, self._handle_bus_event)
        self.bus.subscribe(EventType.PREDICTION, self._handle_bus_event)
        self.bus.subscribe(EventType.VISION_DETECTION, self._handle_bus_event)
        self.bus.subscribe(EventType.ALERT, self._handle_bus_event)

    async def _handle_bus_event(self, event: Event):
        """Relays received event bus events to all active WebSocket clients."""
        evt_type = event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type)
        payload = {
            "event_type": evt_type,
            "event_id": event.event_id,
            "data": event.data,
            "timestamp": event.timestamp
        }
        await self.broadcast(payload)

    async def connect(self, websocket: WebSocket):
        """Accepts and registers a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocketManager] Client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Unregisters a disconnected WebSocket client."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WebSocketManager] Client disconnected. Total active connections: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON message to all connected clients."""
        disconnected = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            self.disconnect(conn)


# Global singleton instance
ws_manager = WebSocketManager()
