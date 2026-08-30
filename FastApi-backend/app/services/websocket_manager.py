"""
TrainSense WebSocket Connection Manager
Tracks active WebSocket clients and bridges Event Bus events (PREDICTION, VISION_DETECTION, ALERT, TRAIN_UPDATE)
to real-time connected clients.
"""

from datetime import datetime, timezone
import json
import logging
from typing import Any, Dict, List
from fastapi import WebSocket, WebSocketDisconnect

from app.event_bus import Event, EventBus, EventType, event_bus

logger = logging.getLogger("TrainSense.WebSocketManager")


class ConnectionManager:
    """
    WebSocket Connection Manager for TrainSense.
    Maintains list of active client sockets and broadcasts event bus telemetry in real time.
    """

    def __init__(self, bus: EventBus = event_bus):
        self.active_connections: List[WebSocket] = []
        self.bus = bus
        self._subscribe_to_event_bus()

    def _subscribe_to_event_bus(self):
        """Subscribes handler to Event Bus channels for real-time WebSocket broadcasting."""
        self.bus.subscribe(EventType.PREDICTION, self.handle_bus_event)
        self.bus.subscribe(EventType.VISION_DETECTION, self.handle_bus_event)
        self.bus.subscribe(EventType.ALERT, self.handle_bus_event)
        self.bus.subscribe(EventType.TRAIN_UPDATE, self.handle_bus_event)

    async def connect(self, websocket: WebSocket):
        """Accepts a new WebSocket connection and adds it to active pool."""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WebSocketManager] Client connected. Total active clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Removes a disconnected WebSocket client from active pool."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"[WebSocketManager] Client disconnected. Remaining active clients: {len(self.active_connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON payload to all active WebSocket clients."""
        if not self.active_connections:
            return

        disconnected_clients = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"[WebSocketManager] Send error to client: {e}")
                disconnected_clients.append(connection)

        for client in disconnected_clients:
            self.disconnect(client)

    async def handle_bus_event(self, event: Event):
        """Event Bus handler that forwards published events to connected WebSocket clients."""
        event_type_str = str(event.event_type.value if hasattr(event.event_type, "value") else event.event_type)
        payload = {
            "event_id": event.event_id,
            "event_type": event_type_str,
            "timestamp": event.timestamp,
            "data": event.data
        }
        await self.broadcast(payload)


# Global singleton instance
ws_manager = ConnectionManager()
