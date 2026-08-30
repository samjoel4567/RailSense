"""
Multi-Train Prediction & Network Impact Integration Test Suite
Verifies:
1. Dynamic Prediction endpoint supports any requested train ID (LOCAL-101, LOCAL-102, LOCAL-103, LOCAL-104, EXPRESS-202, etc.).
2. Each train receives tailored predictions based on its individual operational state.
3. Network Impact Logic: when one train changes speed/delay/position, surrounding/following trains automatically have their ETAs, headways, and conflict recommendations recalculated.
"""

import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.state_store import state_store


def test_multi_train_and_network_impact():
    print("==================================================")
    print("MULTI-TRAIN PREDICTIONS & NETWORK IMPACT TEST")
    print("==================================================")

    state_store.clear()

    with TestClient(app) as client:
        # ----------------------------------------------------
        # 1. TEST PREDICTION SWITCHING BETWEEN DIFFERENT LOCAL TRAINS
        # ----------------------------------------------------
        print("\n--- [TEST GROUP 1: MULTI-TRAIN PREDICTION RESOLUTION] ---")
        
        train_ids = ["LOCAL-101", "LOCAL-102", "LOCAL-103", "LOCAL-104", "EXPRESS-202"]
        predictions = {}

        for tid in train_ids:
            res = client.get(f"/predictions/{tid}")
            assert res.status_code == 200, f"Failed to get prediction for {tid}: {res.text}"
            data = res.json()
            predictions[tid] = data
            print(f"Train '{tid}': Section = {data['section']}, ETA = {data['predicted_eta']}, Delay = {data['expected_delay_min']}m, Action = {data['recommended_action']}, Confidence = {data['prediction_confidence']}")
            assert data["train_id"] == tid
            assert "predicted_eta" in data
            assert "expected_delay_min" in data
            assert "conflict_probability" in data
            assert "recommended_action" in data
            assert "prediction_confidence" in data

        # Verify that different trains receive their own individual states
        assert predictions["LOCAL-101"]["train_id"] == "LOCAL-101"
        assert predictions["LOCAL-103"]["train_id"] == "LOCAL-103"
        assert predictions["LOCAL-103"]["section"] == "SEC-B2-CLEAR"
        assert predictions["EXPRESS-202"]["train_id"] == "EXPRESS-202"
        print("Individual Train Switching & Prediction Verification PASSED!")

        # ----------------------------------------------------
        # 2. TEST IMPACT LOGIC: LEADER TRAIN SLOWS DOWN / GETS DELAYED
        # ----------------------------------------------------
        print("\n--- [TEST GROUP 2: NETWORK IMPACT & CASCADING RECALCULATION] ---")
        
        # Check follower train LOCAL-102 initial prediction before leader change
        pred_follower_before = client.get("/predictions/LOCAL-102").json()
        print("Follower Train LOCAL-102 (Before Leader Delay):", {
            "action": pred_follower_before["recommended_action"],
            "conflict_prob": pred_follower_before["conflict_probability"],
            "expected_delay": pred_follower_before["expected_delay_min"]
        })

        # Leader train LOCAL-101 slows down drastically and develops 20-minute delay
        update_payload = {
            "current_speed_kmh": 10.0,
            "train_speed": 10.0,
            "speed": 10.0,
            "current_delay_min": 25.0,
            "current_delay": 25.0,
            "current_position_km": 43.0,
            "section": "SEC-A1-TRACK"
        }
        res_update = client.post("/trains/LOCAL-101/telemetry", json=update_payload)
        assert res_update.status_code == 200
        impact_result = res_update.json()
        print(f"\nUpdated Leader LOCAL-101: Speed -> 10.0 km/h, Delay -> 25.0 min")
        print(f"Affected Trains Recalculated: {len(impact_result['affected_trains_predictions'])}")

        # Query follower train LOCAL-102 after leader change
        pred_follower_after = client.get("/predictions/LOCAL-102").json()
        print("Follower Train LOCAL-102 (After Leader Delay):", {
            "action": pred_follower_after["recommended_action"],
            "conflict_prob": pred_follower_after["conflict_probability"],
            "expected_delay": pred_follower_after["expected_delay_min"],
            "time_saved": pred_follower_after["estimated_time_saved_min"],
            "reasoning": pred_follower_after["reasoning"]
        })

        # Assertions for cascading impact:
        # Follower LOCAL-102 should have increased expected delay and higher conflict risk or HOLD recommendation
        assert pred_follower_after["expected_delay_min"] >= pred_follower_before["expected_delay_min"], "Follower expected delay must increase when leader train slows down"
        assert pred_follower_after["conflict_probability"] >= pred_follower_before["conflict_probability"], "Follower conflict probability must increase due to close trailing distance"
        assert pred_follower_after["recommended_action"] == "HOLD", "Follower should receive HOLD instruction to avoid collision/congestion"
        print("Network Impact Cascading Recalculation PASSED!")

        # ----------------------------------------------------
        # 3. VERIFY ALL ACTIVE PREDICTIONS LIST
        # ----------------------------------------------------
        res_all = client.get("/predictions")
        assert res_all.status_code == 200
        all_preds = res_all.json()
        assert len(all_preds) >= 4
        print(f"\nGET /predictions returned {len(all_preds)} active train predictions across the network.")

    print("\n==================================================")
    print("ALL MULTI-TRAIN & NETWORK IMPACT TESTS PASSED!")
    print("==================================================")


if __name__ == "__main__":
    test_multi_train_and_network_impact()
