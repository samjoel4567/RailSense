"""
TrainSense Decision Engine (Steps 9 & 10)
Provides transparent hybrid operational recommendations (PROCEED / HOLD),
operational time-saved estimates, and explainable decision reasoning.
"""

from typing import Any, Dict, Optional


class DecisionEngine:
    def __init__(self):
        pass

    def evaluate_decision(
        self,
        raw_features: Dict[str, Any],
        conflict_probability: float,
        expected_delay_min: float = 0.0
    ) -> Dict[str, Any]:
        """
        Evaluates operational action (PROCEED / HOLD), computes estimated time saved,
        and provides structured explainable operational reasoning.
        """
        # 1. Extract operational safety indicators
        signal = str(raw_features.get("current_signal", raw_features.get("signal_status", "GREEN"))).upper()
        route_status = str(raw_features.get("route_status", "NORMAL")).upper()
        junction_status = str(raw_features.get("junction_status", "CLEAR")).upper()
        platform_avail = str(raw_features.get("platform_availability", "AVAILABLE")).upper()
        
        headway = float(raw_features.get("current_headway_min", raw_features.get("headway", 10.0)))
        safe_headway = float(raw_features.get("safe_required_headway_min", 3.0))
        headway_margin = headway - safe_headway

        speed = float(raw_features.get("current_speed_kmh", raw_features.get("train_speed", raw_features.get("speed", 60.0))))
        ahead_speed = float(raw_features.get("ahead_train_speed_kmh", 0.0))
        has_train_ahead = bool(raw_features.get("has_train_ahead", raw_features.get("approaching_train_present", False)))
        relative_speed = round(speed - ahead_speed, 1) if has_train_ahead else 0.0
        dist_to_station = float(raw_features.get("distance_to_next_station_km", raw_features.get("distance_to_next_station", 10.0)))

        # 2. Safety Constraints (Rule-Based Interlocking Overrides)
        safety_override_triggered = False
        primary_reason = ""

        if signal == "RED":
            safety_override_triggered = True
            primary_reason = "RED signal aspect requires mandatory stop"
        elif route_status == "BLOCKED":
            safety_override_triggered = True
            primary_reason = "Downstream track route is BLOCKED"
        elif junction_status == "CONFLICT":
            safety_override_triggered = True
            primary_reason = "Junction interlocking reports active cross-traffic CONFLICT"
        elif headway_margin < -0.5:
            safety_override_triggered = True
            primary_reason = f"Current headway ({headway:.1f}m) violates safe headway ({safe_headway:.1f}m)"
        elif platform_avail == "OCCUPIED" and dist_to_station < 2.0:
            safety_override_triggered = True
            primary_reason = f"Station platform OCCUPIED ({dist_to_station:.1f}km away)"

        # 3. Hybrid Decision: ML Probability + Hard Safety Constraints
        if safety_override_triggered or conflict_probability >= 0.50:
            recommended_action = "HOLD"
            # Time saved estimate: cascading gridlock delay avoided
            estimated_time_saved = round(max(1.5, 8.0 + expected_delay_min * 0.35), 1)
            if not primary_reason:
                primary_reason = f"ML conflict probability ({conflict_probability:.2%}) exceeds safety threshold (50.0%)"
        else:
            recommended_action = "PROCEED"
            # Time saved estimate: unnecessary deceleration/holding stop avoided
            estimated_time_saved = round(max(1.0, 4.5 - expected_delay_min * 0.1), 1)
            primary_reason = "All signaling, headway, and conflict thresholds permit safe passage"

        reasoning = {
            "signal": signal,
            "headway_margin_min": round(headway_margin, 1),
            "relative_speed_kmh": relative_speed,
            "junction_status": junction_status,
            "route_status": route_status,
            "platform_availability": platform_avail,
            "primary_reason": primary_reason,
            "safety_override": safety_override_triggered
        }

        return {
            "recommended_action": recommended_action,
            "estimated_time_saved_min": estimated_time_saved,
            "reasoning": reasoning,
            # Backward compatibility alias
            "recommendation": f"HOLD LOCAL TRAIN" if recommended_action == "HOLD" and str(raw_features.get("train_priority", "PASSENGER")).upper() in ["LOCAL", "PASSENGER"] else recommended_action
        }

    # Backward compatibility helper
    def evaluate_recommendation(
        self,
        potential_conflict: bool,
        train_priority: str = "PASSENGER",
        approaching_train_priority: Optional[str] = None
    ) -> str:
        if not potential_conflict:
            return "PROCEED"
        return "HOLD LOCAL TRAIN"


# Global singleton instance
decision_engine = DecisionEngine()
