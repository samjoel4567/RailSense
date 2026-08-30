"""
TrainSense Network Impact Engine
Recalculates downstream and upstream train ETAs, headways, signals,
and ML predictions whenever any train updates its speed, position, or delay.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional

from app.event_bus import Event, EventBus, EventType
from app.schemas.events import PredictionEvent

logger = logging.getLogger("TrainSense.ImpactEngine")


class NetworkImpactEngine:
    def __init__(self):
        pass

    def evaluate_and_recalculate_network_impact(
        self,
        updated_train_id: str,
        updated_train_data: Dict[str, Any],
        bus: Optional[EventBus] = None
    ) -> List[Dict[str, Any]]:
        """
        Identifies trains on the same railway section/corridor,
        recalculates spatial gap, train-ahead metrics, headways, and signals,
        and triggers ML prediction re-evaluation for all affected trains.
        """
        from app.ml.predict import prediction_service
        from app.services.state_store import state_store

        recalculated_predictions: List[Dict[str, Any]] = []
        section = updated_train_data.get("section", "SEC-A1-TRACK")
        pos_updated = float(updated_train_data.get("current_position_km", updated_train_data.get("latitude", 42.0)))
        speed_updated = float(updated_train_data.get("current_speed_kmh", updated_train_data.get("train_speed", updated_train_data.get("speed", 45.0))))
        delay_updated = float(updated_train_data.get("current_delay_min", updated_train_data.get("current_delay", updated_train_data.get("delay", 0.0))))

        all_trains = state_store.get_trains()

        for other_train in all_trains:
            other_id = other_train.get("train_id")
            if not other_id or other_id == updated_train_id:
                continue

            other_sec = other_train.get("section", "SEC-A1-TRACK")
            # If on the same section or corridor
            if other_sec == section or (section and other_sec and section[:6] == other_sec[:6]):
                pos_other = float(other_train.get("current_position_km", other_train.get("latitude", 40.0)))
                speed_other = float(other_train.get("current_speed_kmh", other_train.get("train_speed", other_train.get("speed", 60.0))))

                # Calculate spatial gap between trains
                dist_gap = abs(pos_updated - pos_other)
                if dist_gap < 0.1:
                    dist_gap = 1.0  # Safe minimum

                # Case A: Updated train is ahead of other_train (other_train is following)
                if pos_updated >= pos_other:
                    closing_speed = max(0.0, speed_other - speed_updated)
                    other_train["has_train_ahead"] = True
                    other_train["ahead_train_id"] = updated_train_id
                    other_train["distance_to_ahead_train_km"] = round(dist_gap, 2)
                    other_train["ahead_train_speed_kmh"] = round(speed_updated, 1)

                    # Dynamic headway calculation based on distance gap and follower speed
                    computed_headway = (dist_gap / max(speed_other, 15.0)) * 60.0
                    other_train["current_headway_min"] = round(max(0.5, computed_headway), 1)

                    # Signal aspect cascading update:
                    # Slow/stopped leader with high closing speed escalates signal
                    time_to_close = (dist_gap / max(closing_speed, 1.0)) * 60.0 if closing_speed > 0 else 999.0
                    if dist_gap < 1.5 or time_to_close < 3.0 or (speed_updated < 15.0 and dist_gap < 3.5):
                        other_train["current_signal"] = "RED"
                    elif dist_gap < 4.0 or closing_speed > 25.0 or delay_updated > 15.0:
                        other_train["current_signal"] = "YELLOW"
                    else:
                        other_train["current_signal"] = "GREEN"

                    # Operational delay cascade
                    if delay_updated > 10.0:
                        inherited_delay = delay_updated * 0.45 * (1.0 / max(dist_gap, 0.5))
                        current_other_delay = float(other_train.get("current_delay_min", other_train.get("current_delay", 0.0)))
                        other_train["current_delay_min"] = round(max(current_other_delay, inherited_delay), 1)

                # Case B: Other train is ahead of updated train
                else:
                    updated_train_data["has_train_ahead"] = True
                    updated_train_data["ahead_train_id"] = other_id
                    updated_train_data["distance_to_ahead_train_km"] = round(dist_gap, 2)
                    updated_train_data["ahead_train_speed_kmh"] = round(speed_other, 1)

                    effective_leader_speed = max(speed_other, 15.0)
                    computed_headway = (dist_gap / effective_leader_speed) * 60.0
                    updated_train_data["current_headway_min"] = round(max(0.5, computed_headway), 1)

                    if dist_gap < 1.5:
                        updated_train_data["current_signal"] = "RED" if dist_gap < 0.8 else "YELLOW"
                    elif dist_gap < 4.0:
                        updated_train_data["current_signal"] = "DOUBLE_YELLOW"

                # Re-run ML model prediction for affected other_train
                pred_result = prediction_service.predict(other_train)
                pred_payload = {
                    "train_id": other_id,
                    "section": other_sec,
                    "current_position_km": pos_other,
                    "predicted_eta": pred_result["predicted_eta"],
                    "expected_delay_min": pred_result["expected_delay_min"],
                    "predicted_delay": pred_result["expected_delay_min"],
                    "conflict_probability": pred_result["conflict_probability"],
                    "potential_conflict": pred_result["potential_conflict"],
                    "prediction_confidence": pred_result["prediction_confidence"],
                    "recommended_action": pred_result["recommended_action"],
                    "recommendation": pred_result["recommendation"],
                    "estimated_time_saved_min": pred_result["estimated_time_saved_min"],
                    "reasoning": pred_result["reasoning"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }

                # Update state store
                state_store.predictions[other_id] = pred_payload
                state_store.trains[other_id].update({
                    "predicted_delay": pred_result["expected_delay_min"],
                    "expected_delay_min": pred_result["expected_delay_min"],
                    "predicted_eta": pred_result["predicted_eta"],
                    "conflict_probability": pred_result["conflict_probability"],
                    "potential_conflict": pred_result["potential_conflict"],
                    "prediction_confidence": pred_result["prediction_confidence"],
                    "recommended_action": pred_result["recommended_action"],
                    "recommendation": pred_result["recommendation"],
                    "estimated_time_saved_min": pred_result["estimated_time_saved_min"],
                    "reasoning": pred_result["reasoning"],
                    "has_train_ahead": other_train.get("has_train_ahead", False),
                    "current_headway_min": other_train.get("current_headway_min", 10.0),
                    "current_signal": other_train.get("current_signal", "GREEN"),
                    "last_updated": datetime.now(timezone.utc).isoformat()
                })

                recalculated_predictions.append(pred_payload)

                # Optionally publish updated prediction to EventBus asynchronously if bus is available
                if bus:
                    try:
                        import asyncio
                        event = Event(event_type=EventType.PREDICTION, data=pred_payload)
                        # If inside active event loop, create task
                        loop = asyncio.get_event_loop()
                        if loop.is_running():
                            loop.create_task(bus.publish(event))
                    except Exception as e:
                        logger.debug(f"[ImpactEngine] Async event publish bypassed: {e}")

        return recalculated_predictions


# Global singleton instance
impact_engine = NetworkImpactEngine()
