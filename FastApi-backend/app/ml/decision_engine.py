"""
TrainSense Decision Engine
Provides operational recommendations for train dispatching decision support.
"""

class DecisionEngine:
    def __init__(self):
        pass

    def evaluate_recommendation(
        self,
        potential_conflict: bool,
        train_priority: str = "PASSENGER",
        approaching_train_priority: str = None
    ) -> str:
        """
        Determines operational recommendations based on conflict state and train priorities.
        
        Primary Scripted Scenario:
        - LOCAL/PASSENGER train + EXPRESS train approaching same section + conflict detected -> HOLD LOCAL TRAIN
        - No conflict -> PROCEED
        """
        if not potential_conflict:
            return "PROCEED"

        train_prio = str(train_priority).upper()
        app_prio = str(approaching_train_priority).upper() if approaching_train_priority else ""

        # Scripted scenario: LOCAL/PASSENGER/FREIGHT vs EXPRESS or general conflict on local line
        if (train_prio in ["LOCAL", "PASSENGER", "FREIGHT"] and app_prio == "EXPRESS") or \
           (app_prio in ["LOCAL", "PASSENGER", "FREIGHT"] and train_prio == "EXPRESS") or \
           (train_prio in ["LOCAL", "PASSENGER", "FREIGHT"]):
            return "HOLD LOCAL TRAIN"

        return "HOLD LOCAL TRAIN"


# Global singleton instance
decision_engine = DecisionEngine()
