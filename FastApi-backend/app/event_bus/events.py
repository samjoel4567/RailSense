from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict
import uuid


class EventType(str, Enum):
    TRAIN_UPDATE = "TRAIN_UPDATE"
    PREDICTION = "PREDICTION"
    VISION_DETECTION = "VISION_DETECTION"
    ALERT = "ALERT"


@dataclass
class Event:
    event_type: EventType
    data: Dict[str, Any]
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
