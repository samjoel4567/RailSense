"""
TrainSense Conflict Detection Engine
Evaluates operational conflict conditions independently from ML probability predictions.
"""

from typing import Any, Dict


class ConflictDetector:
    def __init__(self, min_headway_threshold: float = 5.0):
        self.min_headway_threshold = min_headway_threshold

    def detect_conflict(
        self,
        features: Dict[str, Any],
        conflict_probability: float = 0.0,
        approaching_train_present: bool = False,
        arrival_time_overlap: bool = False
    ) -> bool:
        """
        Determines whether an operational conflict exists based on physical operational rules:
        1. Two trains approaching the same section.
        2. Predicted arrival time overlap.
        3. Minimum headway violation.
        4. Section occupancy.
        """
        section_occupancy = int(features.get("section_occupancy", 0))
        headway = float(features.get("headway", 15.0))
        distance = float(features.get("distance_to_next_station", 10.0))

        # Check operational conflict conditions:
        headway_violated = headway < self.min_headway_threshold
        section_occupied = section_occupancy == 1
        short_distance = distance < 3.0

        # Conflict condition logic
        if section_occupied and (approaching_train_present or arrival_time_overlap or headway_violated or short_distance):
            return True
        if approaching_train_present and (arrival_time_overlap or headway_violated or short_distance):
            return True
        if headway_violated and section_occupied:
            return True
        if conflict_probability > 0.50:
            return True

        return False


# Global singleton instance
conflict_detector = ConflictDetector()
