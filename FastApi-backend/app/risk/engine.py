"""
TrainSense Risk Engine
Provides deterministic, multi-factor risk scoring for combined ML and Vision signals.
"""

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List, Optional


class RiskEngine:
    """
    Deterministic risk scoring engine for TrainSense hackathon prototype.
    Evaluates ML conflict probability, vision detection threat level, section alignment,
    and temporal proximity to produce unified risk scores and operational alerts.
    """

    def __init__(self):
        pass

    def calculate_risk(
        self,
        prediction: Optional[Dict[str, Any]] = None,
        vision: Optional[Dict[str, Any]] = None,
        temporal_diff_seconds: float = 0.0
    ) -> Dict[str, Any]:
        """
        Calculates unified risk score (0.0 to 100.0), risk level (LOW/MEDIUM/HIGH/CRITICAL),
        alert type, explanation, and final operational recommendation.
        """
        ml_prob = float(prediction.get("conflict_probability", 0.0)) if prediction else 0.0
        ml_conflict = bool(prediction.get("potential_conflict", False)) if prediction else False
        ml_rec = prediction.get("recommendation", "PROCEED") if prediction else "PROCEED"
        train_id = prediction.get("train_id", "UNKNOWN_TRAIN") if prediction else "UNKNOWN_TRAIN"
        section = (prediction.get("section") if prediction else None) or (vision.get("section") if vision else None) or "MAIN_LINE"

        vision_obj = str(vision.get("object_type", "NONE")).lower() if vision else "none"
        vision_conf = float(vision.get("confidence", 0.0)) if vision else 0.0
        vision_severity = str(vision.get("severity", "LOW")).upper() if vision else "LOW"

        # 1. ML Contribution (Max 45 points)
        ml_score = ml_prob * 35.0
        if ml_conflict:
            ml_score += 10.0

        # 2. Vision Contribution (Max 40 points)
        high_risk_objects = {"person", "car", "truck", "bus", "vehicle", "obstacle"}
        if vision_obj in high_risk_objects:
            vision_base = 35.0 if vision_severity == "CRITICAL" else 25.0
            vision_score = vision_conf * vision_base
        elif vision_obj != "none":
            vision_score = vision_conf * 15.0
        else:
            vision_score = 0.0

        # 3. Spatial & Temporal Correlation Synergy (Max 15 points)
        same_section = bool(prediction and vision and (prediction.get("section") == vision.get("section") or prediction.get("section") in vision.get("section", "") or vision.get("section") in prediction.get("section", "")))
        temporal_close = temporal_diff_seconds <= 60.0

        correlation_bonus = 0.0
        if prediction and vision and same_section and temporal_close:
            if ml_conflict or vision_obj in high_risk_objects:
                correlation_bonus = 15.0
            else:
                correlation_bonus = 5.0

        # Total Composite Risk Score (Bounded 0.0 to 100.0)
        raw_score = ml_score + vision_score + correlation_bonus
        risk_score = round(min(100.0, max(0.0, raw_score)), 2)

        # Risk Level Classification
        if risk_score >= 75.0:
            risk_level = "CRITICAL"
        elif risk_score >= 50.0:
            risk_level = "HIGH"
        elif risk_score >= 25.0:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Determine Alert Type & Explanation
        if prediction and vision and same_section and (ml_conflict or vision_obj in high_risk_objects):
            alert_type = "CORRELATED_TRACK_INTRUSION"
            explanation = (
                f"CORRELATED THREAT: ML model predicted conflict (prob: {ml_prob:.4f}, potential_conflict: {ml_conflict}) "
                f"AND vision service detected {vision_obj.upper()} intrusion (conf: {vision_conf:.4f}) "
                f"on section '{section}' within {temporal_diff_seconds:.1f}s window."
            )
        elif prediction and ml_conflict:
            alert_type = "ISOLATED_ML_CONFLICT"
            explanation = f"ML Operational Conflict detected on section '{section}' with probability {ml_prob:.4f}."
        elif vision and vision_obj in high_risk_objects:
            alert_type = "ISOLATED_VISION_INTRUSION"
            explanation = f"Vision Track Intrusion detected: {vision_obj.upper()} on section '{section}' with confidence {vision_conf:.4f}."
        else:
            alert_type = "NORMAL_OPERATION"
            explanation = f"Normal train operations on section '{section}'. No active threats correlated."

        # Recommendation Determination
        if risk_level in ["HIGH", "CRITICAL"]:
            recommendation = ml_rec if ml_rec != "PROCEED" else "HOLD LOCAL TRAIN"
        elif risk_level == "MEDIUM":
            recommendation = "REDUCE SPEED AND PROCEED WITH CAUTION"
        else:
            recommendation = "PROCEED"

        # Related Event IDs tracking
        related_events = []
        if prediction and "event_id" in prediction:
            related_events.append(prediction["event_id"])
        if vision and "event_id" in vision:
            related_events.append(vision["event_id"])

        return {
            "alert_id": str(uuid.uuid4()),
            "train_id": train_id,
            "section": section,
            "location": section,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "alert_type": alert_type,
            "ml_probability": round(ml_prob, 4),
            "ml_potential_conflict": ml_conflict,
            "vision_object_type": vision_obj,
            "vision_confidence": round(vision_conf, 4),
            "explanation": explanation,
            "recommendation": recommendation,
            "related_train_ids": [train_id] if train_id != "UNKNOWN_TRAIN" else [],
            "related_events": related_events,
            "status": "ACTIVE",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global singleton instance
risk_engine = RiskEngine()
