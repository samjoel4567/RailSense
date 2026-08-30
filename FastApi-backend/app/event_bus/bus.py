import asyncio
import logging
from typing import Any, Callable, Coroutine, Dict, Set
from app.event_bus.events import Event, EventType

logger = logging.getLogger("TrainSense.EventBus")

EventHandler = Callable[[Event], Coroutine[Any, Any, None]]


class EventBus:
    """
    In-Memory Asynchronous Event Bus for TrainSense operations.
    Allows decoupling of telemetry ingest, ML predictions, vision analysis,
    and alert generation.
    """

    def __init__(self) -> None:
        self._subscribers: Dict[EventType, Set[EventHandler]] = {}

    def subscribe(self, event_type: EventType, handler: EventHandler) -> None:
        """Subscribe an async handler function to a specific EventType."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = set()
        self._subscribers[event_type].add(handler)
        logger.debug(f"Subscribed {handler.__name__} to {event_type}")

    def unsubscribe(self, event_type: EventType, handler: EventHandler) -> None:
        """Unsubscribe a handler function from an EventType."""
        if event_type in self._subscribers:
            self._subscribers[event_type].discard(handler)
            logger.debug(f"Unsubscribed {handler.__name__} from {event_type}")

    async def publish(self, event: Event) -> None:
        """Publish an event asynchronously to all subscribed handlers."""
        handlers = list(self._subscribers.get(event.event_type, []))
        if not handlers:
            return

        tasks = []
        for handler in handlers:
            if asyncio.iscoroutinefunction(handler):
                tasks.append(asyncio.create_task(handler(event)))
            else:
                loop = asyncio.get_running_loop()
                tasks.append(loop.run_in_executor(None, handler, event))

        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, Exception):
                    logger.error(f"Error handling event {event.event_id}: {res}", exc_info=res)

    def clear(self) -> None:
        """Clear all registered subscribers (useful for testing)."""
        self._subscribers.clear()


# Default singleton instance for application-wide event dispatch
event_bus = EventBus()
