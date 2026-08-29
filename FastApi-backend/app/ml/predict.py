"""
TrainSense ML Prediction Service
Loads pre-trained XGBoost model and feature metadata to produce real-time conflict probability,
predicted delay, and predicted ETA, integrated with Event Bus and Decision Engine.
"""

from datetime import datetime, timedelta, timezone
import json
import os
from typing import Any, Dict, Optional
import pandas as pd
from xgboost import XGBClassifier

from app.event_bus import Event, EventBus, EventType, event_bus
from app.ml.conflict_detector import conflict_detector
from app.ml.decision_engine import decision_engine
from app.schemas.events import PredictionEvent


class PredictionService:
    def __init__(self, model_path: Optional[str] = None, metadata_path: Optional[str] = None, bus: EventBus = event_bus):
        self.model: Optional[XGBClassifier] = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.encoded_feature_names = []
        self.bus = bus
        self._resolve_and_load(model_path, metadata_path)

    def _resolve_and_load(self, model_path: Optional[str], metadata_path: Optional[str]):
        """Locates and loads the saved model artifact and metadata without retraining."""
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
        
        possible_model_paths = [
            model_path,
            os.path.join(base_dir, "models/conflict_model.json"),
            os.path.abspath(os.path.join(base_dir, "../models/conflict_model.json"))
        ]
        
        possible_meta_paths = [
            metadata_path,
            os.path.join(base_dir, "models/model_metadata.json"),
            os.path.abspath(os.path.join(base_dir, "../models/model_metadata.json")),
            os.path.join(base_dir, "models/feature_metadata.json"),
            os.path.abspath(os.path.join(base_dir, "../models/feature_metadata.json"))
        ]

        resolved_model_path = next((p for p in possible_model_paths if p and os.path.exists(p)), None)
        resolved_meta_path = next((p for p in possible_meta_paths if p and os.path.exists(p)), None)

        if not resolved_model_path:
            raise FileNotFoundError("Saved XGBoost model artifact conflict_model.json not found.")
        if not resolved_meta_path:
            raise FileNotFoundError("Model feature metadata file model_metadata.json not found.")

        # Load Metadata
        with open(resolved_meta_path, "r") as f:
            self.metadata = json.load(f)
        self.encoded_feature_names = self.metadata["encoded_feature_names"]

        # Load Model (No retraining)
        self.model = XGBClassifier()
        self.model.load_model(resolved_model_path)
        print(f"[PredictionService] Successfully loaded model from {resolved_model_path}")
        print(f"[PredictionService] Loaded metadata with {len(self.encoded_feature_names)} features")

    def _preprocess_input(self, raw_features: Dict[str, Any]) -> pd.DataFrame:
        """Preprocesses raw operational telemetry into exact 1-row feature vector matching training."""
        train_priority = str(raw_features.get("train_priority", "PASSENGER")).upper()
        if train_priority == "LOCAL":
            train_priority = "PASSENGER"
        weather_condition = str(raw_features.get("weather_condition", "CLEAR")).upper()

        feature_dict = {col: 0.0 for col in self.encoded_feature_names}

        # Numeric features
        feature_dict["train_speed"] = float(raw_features.get("train_speed", raw_features.get("speed", 80.0)))
        feature_dict["current_delay"] = float(raw_features.get("current_delay", raw_features.get("delay", 0.0)))
        feature_dict["previous_delay"] = float(raw_features.get("previous_delay", 0.0))
        feature_dict["section_occupancy"] = float(raw_features.get("section_occupancy", 0))
        feature_dict["headway"] = float(raw_features.get("headway", 15.0))
        feature_dict["distance_to_next_station"] = float(raw_features.get("distance_to_next_station", 10.0))
        feature_dict["time_of_day"] = float(raw_features.get("time_of_day", 12.0))

        # Categorical one-hot features
        prio_col = f"train_priority_{train_priority}"
        if prio_col in feature_dict:
            feature_dict[prio_col] = 1.0

        weather_col = f"weather_condition_{weather_condition}"
        if weather_col in feature_dict:
            feature_dict[weather_col] = 1.0

        return pd.DataFrame([feature_dict])[self.encoded_feature_names]

    def calculate_predicted_delay(self, features: Dict[str, Any]) -> float:
        """Calculates predicted operational delay based on telemetry features."""
        current_delay = float(features.get("current_delay", features.get("delay", 0.0)))
        previous_delay = float(features.get("previous_delay", 0.0))
        speed = float(features.get("train_speed", features.get("speed", 80.0)))
        section_occupancy = int(features.get("section_occupancy", 0))
        headway = float(features.get("headway", 15.0))
        weather = str(features.get("weather_condition", "CLEAR")).upper()

        weather_impact_map = {"CLEAR": 0.0, "RAIN": 1.5, "FOG": 3.0, "STORM": 5.5}
        weather_impact = weather_impact_map.get(weather, 0.0)

        predicted_delay = max(
            0.0,
            current_delay * 0.85 +
            previous_delay * 0.20 +
            (120.0 - speed) * 0.08 +
            section_occupancy * 4.5 +
            (10.0 / (headway + 0.5)) +
            weather_impact
        )
        return round(predicted_delay, 1)

    def calculate_predicted_eta(self, features: Dict[str, Any], predicted_delay: float) -> str:
        """Calculates predicted ETA ISO timestamp based on distance, speed, and predicted delay."""
        distance = float(features.get("distance_to_next_station", 10.0))
        speed = float(features.get("train_speed", features.get("speed", 80.0)))
        speed = max(speed, 5.0)

        travel_time_minutes = (distance / speed) * 60.0 + predicted_delay
        now = datetime.now(timezone.utc)
        eta_time = now + timedelta(minutes=travel_time_minutes)
        return eta_time.isoformat()

    def predict(
        self,
        raw_features: Dict[str, Any],
        approaching_train_present: bool = False,
        approaching_train_priority: Optional[str] = None,
        arrival_time_overlap: bool = False
    ) -> Dict[str, Any]:
        """Performs real-time ML conflict inference and decision engine evaluation."""
        X_encoded = self._preprocess_input(raw_features)

        # 1. Model inference: Probability output
        conflict_prob = float(self.model.predict_proba(X_encoded)[0, 1])

        # 2. Delay & ETA estimation
        pred_delay = self.calculate_predicted_delay(raw_features)
        pred_eta = self.calculate_predicted_eta(raw_features, pred_delay)

        # 3. Separate Conflict Detection Decision Layer
        potential_conflict = conflict_detector.detect_conflict(
            features=raw_features,
            conflict_probability=conflict_prob,
            approaching_train_present=approaching_train_present,
            arrival_time_overlap=arrival_time_overlap
        )

        # 4. Decision Engine Recommendation
        train_priority = raw_features.get("train_priority", raw_features.get("priority", "PASSENGER"))
        rec = decision_engine.evaluate_recommendation(
            potential_conflict=potential_conflict,
            train_priority=train_priority,
            approaching_train_priority=approaching_train_priority
        )

        return {
            "predicted_delay": pred_delay,
            "conflict_probability": round(conflict_prob, 4),
            "predicted_eta": pred_eta,
            "potential_conflict": potential_conflict,
            "recommendation": rec
        }

    async def handle_train_update_event(self, event: Event) -> Optional[Event]:
        """Event Bus handler for TRAIN_UPDATE events (Step 32)."""
        data = event.data
        train_id = data.get("train_id", "UNKNOWN_TRAIN")
        section = data.get("section", data.get("track_id", "MAIN_LINE"))

        # Extra operational indicators from event payload if provided
        approaching_present = data.get("approaching_train_present", False)
        approaching_priority = data.get("approaching_train_priority", None)
        arrival_overlap = data.get("arrival_time_overlap", False)

        result = self.predict(
            raw_features=data,
            approaching_train_present=approaching_present,
            approaching_train_priority=approaching_priority,
            arrival_time_overlap=arrival_overlap
        )

        prediction_payload = {
            "train_id": train_id,
            "predicted_delay": result["predicted_delay"],
            "predicted_eta": result["predicted_eta"],
            "conflict_probability": result["conflict_probability"],
            "potential_conflict": result["potential_conflict"],
            "recommendation": result["recommendation"],
            "section": section,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        # Create structured PredictionEvent
        prediction_schema = PredictionEvent(
            train_id=train_id,
            predicted_delay=result["predicted_delay"],
            predicted_eta=result["predicted_eta"],
            conflict_probability=result["conflict_probability"],
            potential_conflict=result["potential_conflict"],
            recommendation=result["recommendation"],
            section=section
        )

        prediction_event = Event(
            event_type=EventType.PREDICTION,
            data=prediction_schema.model_dump()
        )

        # Publish result event to prediction-events
        await self.bus.publish(prediction_event)
        return prediction_event


def attach_prediction_service_to_bus(bus: EventBus = event_bus) -> PredictionService:
    """Helper to attach prediction service subscriber to the Event Bus (Step 32)."""
    service = PredictionService(bus=bus)
    bus.subscribe(EventType.TRAIN_UPDATE, service.handle_train_update_event)
    return service


# Default instance
prediction_service = PredictionService()
