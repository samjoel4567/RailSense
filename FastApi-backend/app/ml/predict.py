"""
TrainSense ML Prediction Service (Steps 5, 6, 7, 8, 11, 14)
Loads pre-trained XGBoost Dual Models (Conflict Classifier & Delay Regressor),
executes feature engineering via features.py, estimates ETA, evaluates hybrid Decision Engine,
and publishes structured PREDICTION events over the Event Bus.
"""

from datetime import datetime, timedelta, timezone
import json
import logging
import os
from typing import Any, Dict, List, Optional
import pandas as pd
from xgboost import XGBClassifier, XGBRegressor

from app.event_bus import Event, EventBus, EventType, event_bus
from app.ml.conflict_detector import conflict_detector
from app.ml.decision_engine import decision_engine
from app.ml.features import (
    FEATURE_COLUMNS,
    build_feature_vector,
    calculate_prediction_confidence
)
from app.schemas.events import PredictionEvent

logger = logging.getLogger("TrainSense.PredictionService")


class PredictionService:
    def __init__(
        self,
        conflict_model_path: Optional[str] = None,
        delay_model_path: Optional[str] = None,
        metadata_path: Optional[str] = None,
        bus: EventBus = event_bus
    ):
        self.conflict_model: Optional[XGBClassifier] = None
        self.delay_model: Optional[XGBRegressor] = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.encoded_feature_names: List[str] = FEATURE_COLUMNS
        self.bus = bus
        self._resolve_and_load(conflict_model_path, delay_model_path, metadata_path)

    @property
    def model(self) -> Optional[XGBClassifier]:
        """Backward compatibility alias for subsystem health checks."""
        return self.conflict_model

    def _resolve_and_load(
        self,
        conflict_model_path: Optional[str],
        delay_model_path: Optional[str],
        metadata_path: Optional[str]
    ):
        """Locates and loads the saved model artifacts and metadata."""
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))

        possible_conflict_paths = [
            conflict_model_path,
            os.path.join(base_dir, "models/conflict_model.json"),
            os.path.abspath(os.path.join(base_dir, "../models/conflict_model.json"))
        ]

        possible_delay_paths = [
            delay_model_path,
            os.path.join(base_dir, "models/delay_model.json"),
            os.path.abspath(os.path.join(base_dir, "../models/delay_model.json"))
        ]

        possible_meta_paths = [
            metadata_path,
            os.path.join(base_dir, "models/model_metadata.json"),
            os.path.abspath(os.path.join(base_dir, "../models/model_metadata.json")),
            os.path.join(base_dir, "models/feature_metadata.json"),
            os.path.abspath(os.path.join(base_dir, "../models/feature_metadata.json"))
        ]

        resolved_conf_path = next((p for p in possible_conflict_paths if p and os.path.exists(p)), None)
        resolved_del_path = next((p for p in possible_delay_paths if p and os.path.exists(p)), None)
        resolved_meta_path = next((p for p in possible_meta_paths if p and os.path.exists(p)), None)

        if not resolved_conf_path:
            raise FileNotFoundError("Saved XGBoost model artifact conflict_model.json not found.")
        if not resolved_meta_path:
            raise FileNotFoundError("Model feature metadata file model_metadata.json not found.")

        # Load Metadata
        with open(resolved_meta_path, "r") as f:
            self.metadata = json.load(f)
        self.encoded_feature_names = self.metadata.get("feature_columns", self.metadata.get("encoded_feature_names", FEATURE_COLUMNS))

        # Load Conflict Classifier
        self.conflict_model = XGBClassifier()
        self.conflict_model.load_model(resolved_conf_path)

        # Load Delay Regressor if present, else initialize XGBRegressor
        if resolved_del_path and os.path.exists(resolved_del_path):
            self.delay_model = XGBRegressor()
            self.delay_model.load_model(resolved_del_path)

        logger.info(f"[PredictionService] Loaded conflict classifier from {resolved_conf_path}")
        print(f"[PredictionService] Successfully loaded dual models from {resolved_conf_path}")
        print(f"[PredictionService] Loaded feature schema with {len(self.encoded_feature_names)} features")

    def calculate_predicted_delay(self, features: Dict[str, Any], X_vector: Optional[pd.DataFrame] = None) -> float:
        """
        Calculates predicted operational delay dynamically using the trained Delay Regressor.
        Falls back to rule-informed dynamic estimate if regressor is not initialized.
        """
        if self.delay_model is not None and X_vector is not None:
            raw_pred = float(self.delay_model.predict(X_vector)[0])
            return round(max(0.0, raw_pred), 1)

        current_delay = float(features.get("current_delay_min", features.get("current_delay", features.get("delay", 0.0))))
        speed = float(features.get("current_speed_kmh", features.get("train_speed", features.get("speed", 60.0))))
        headway = float(features.get("current_headway_min", features.get("headway", 10.0)))
        signal = str(features.get("current_signal", "GREEN")).upper()
        sig_impact = {"GREEN": 0.0, "DOUBLE_YELLOW": 1.5, "YELLOW": 4.0, "RED": 8.0}.get(signal, 0.0)

        predicted_delay = max(
            0.0,
            current_delay * 0.85 +
            (120.0 - speed) * 0.06 +
            (10.0 / (headway + 0.5)) +
            sig_impact
        )
        return round(predicted_delay, 1)

    def calculate_predicted_eta(self, features: Dict[str, Any], expected_delay_min: float) -> str:
        """Calculates predicted ETA ISO timestamp based on distance, speed, and expected delay."""
        distance = float(features.get("distance_to_next_station_km", features.get("distance_to_next_station", 10.0)))
        speed = float(features.get("current_speed_kmh", features.get("train_speed", features.get("speed", 60.0))))
        speed = max(speed, 5.0)

        travel_time_minutes = (distance / speed) * 60.0 + expected_delay_min
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
        """
        Performs full-stack operational inference:
        1. Feature Vector Construction
        2. ML Conflict Probability Classification
        3. ML Expected Delay Regression
        4. Predicted ETA Calculation
        5. Hybrid Safety Decision Engine Recommendation
        6. Operational Time-Saved Estimation
        7. Data Quality Confidence Scoring
        """
        # 1. Feature Engineering
        X_encoded = build_feature_vector(raw_features)

        # 2. Conflict Probability Inference
        conflict_prob = float(self.conflict_model.predict_proba(X_encoded)[0, 1])
        conflict_prob = round(float(conflict_prob), 4)

        # 3. Expected Delay Regression
        expected_delay = self.calculate_predicted_delay(raw_features, X_vector=X_encoded)

        # 4. Predicted ETA Calculation
        pred_eta = self.calculate_predicted_eta(raw_features, expected_delay)

        # 5. Conflict State
        potential_conflict = conflict_detector.detect_conflict(
            features=raw_features,
            conflict_probability=conflict_prob,
            approaching_train_present=approaching_train_present or bool(raw_features.get("has_train_ahead", False)),
            arrival_time_overlap=arrival_time_overlap
        )

        # 6. Hybrid Decision Engine Evaluation
        decision = decision_engine.evaluate_decision(
            raw_features=raw_features,
            conflict_probability=conflict_prob,
            expected_delay_min=expected_delay
        )

        # 7. Prediction Confidence Score
        confidence = calculate_prediction_confidence(raw_features, conflict_prob)

        return {
            "expected_delay_min": expected_delay,
            "predicted_delay": expected_delay,  # Backward compatibility
            "predicted_eta": pred_eta,
            "conflict_probability": conflict_prob,
            "potential_conflict": potential_conflict,
            "prediction_confidence": confidence,
            "recommended_action": decision["recommended_action"],
            "recommendation": decision["recommendation"],  # Backward compatibility
            "estimated_time_saved_min": decision["estimated_time_saved_min"],
            "reasoning": decision["reasoning"]
        }

    async def handle_train_update_event(self, event: Event) -> Optional[Event]:
        """Event Bus handler for TRAIN_UPDATE events (Step 14)."""
        data = event.data
        train_id = data.get("train_id", "UNKNOWN_TRAIN")
        section = data.get("section", data.get("track_id", "MAIN_LINE"))
        position_km = float(data.get("current_position_km", data.get("latitude", 0.0)))

        approaching_present = data.get("approaching_train_present", data.get("has_train_ahead", False))
        approaching_priority = data.get("approaching_train_priority", None)
        arrival_overlap = data.get("arrival_time_overlap", False)

        result = self.predict(
            raw_features=data,
            approaching_train_present=approaching_present,
            approaching_train_priority=approaching_priority,
            arrival_time_overlap=arrival_overlap
        )

        # Build structured PredictionEvent schema object
        prediction_schema = PredictionEvent(
            train_id=train_id,
            section=section,
            current_position_km=position_km,
            predicted_eta=result["predicted_eta"],
            expected_delay_min=result["expected_delay_min"],
            predicted_delay=result["expected_delay_min"],
            conflict_probability=result["conflict_probability"],
            potential_conflict=result["potential_conflict"],
            prediction_confidence=result["prediction_confidence"],
            recommended_action=result["recommended_action"],
            recommendation=result["recommendation"],
            estimated_time_saved_min=result["estimated_time_saved_min"],
            reasoning=result["reasoning"],
            timestamp=datetime.now(timezone.utc).isoformat()
        )

        prediction_event = Event(
            event_type=EventType.PREDICTION,
            data=prediction_schema.model_dump()
        )

        # Publish live prediction event to PREDICTION channel
        await self.bus.publish(prediction_event)
        logger.info(f"[PredictionService] Published PREDICTION for Train {train_id} on {section} (Prob: {result['conflict_probability']}, Action: {result['recommended_action']})")

        # Recalculate downstream / following train ETAs and headways across network
        try:
            from app.services.impact_engine import impact_engine
            impact_engine.evaluate_and_recalculate_network_impact(train_id, data, bus=self.bus)
        except Exception as e:
            logger.debug(f"[PredictionService] Network impact cascade note: {e}")

        return prediction_event


def attach_prediction_service_to_bus(bus: EventBus = event_bus) -> PredictionService:
    """Helper to attach prediction service subscriber to the Event Bus (Step 14)."""
    service = PredictionService(bus=bus)
    bus.subscribe(EventType.TRAIN_UPDATE, service.handle_train_update_event)
    return service


# Default singleton instance
prediction_service = PredictionService()
