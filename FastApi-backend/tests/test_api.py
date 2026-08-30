"""
FastAPI REST API Integration Tests for TrainSense (RailSense repository)
Tests /health, /trains, /predictions, /predictions/{train_id}, /alerts, /dashboard, /alerts/{id}/acknowledge, and /simulation/* endpoints.
"""

import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.state_store import state_store


def test_api_suite():
    print("==================================================")
    print("Running TrainSense REST API Integration Tests")
    print("==================================================")

    state_store.clear()

    with TestClient(app) as client:
        # 1. Test GET /health
        res_health = client.get("/health")
        assert res_health.status_code == 200
        data_health = res_health.json()
        assert data_health["status"] == "healthy"
        print("GET /health PASSED:", data_health)

        # 2. Test GET /trains (Clean initial startup state)
        res_trains = client.get("/trains")
        assert res_trains.status_code == 200
        data_trains = res_trains.json()
        assert isinstance(data_trains, list)
        assert len(data_trains) >= 1
        assert data_trains[0]["is_live"] is False
        assert data_trains[0]["data_source"] == "DEMO_INITIAL"
        print(f"GET /trains (Clean Startup State) PASSED: Retrived {len(data_trains)} active trains marked DEMO_INITIAL.")

        # 3. Test GET /alerts on clean initial startup (expects 0 seeded fake alerts)
        res_alerts_clean = client.get("/alerts")
        assert res_alerts_clean.status_code == 200
        alerts_clean = res_alerts_clean.json()
        assert isinstance(alerts_clean, list)
        assert len(alerts_clean) == 0
        print("GET /alerts (Clean Startup State) PASSED: 0 fake alerts returned.")

        # 4. Test GET /dashboard on clean initial startup
        res_dash = client.get("/dashboard")
        assert res_dash.status_code == 200
        dash_data = res_dash.json()
        assert dash_data["system_status"] == "NORMAL"
        assert dash_data["active_alerts_count"] == 0
        print("GET /dashboard (Clean Startup State) PASSED: System status =", dash_data["system_status"])

        # 5. Trigger live scenario and verify genuine live alert generation
        res_trig = client.post("/simulation/trigger-conflict")
        assert res_trig.status_code == 200

        # Fetch active live alerts after scenario trigger
        res_alerts_live = client.get("/alerts")
        alerts_live = res_alerts_live.json()
        assert len(alerts_live) >= 1
        alert_id = alerts_live[0]["alert_id"]
        print(f"POST /simulation/trigger-conflict PASSED: Generated live alert ID '{alert_id}'.")

        # Verify trains updated to live telemetry
        res_trains_live = client.get("/trains")
        trains_live = res_trains_live.json()
        assert trains_live[0]["is_live"] is True
        assert trains_live[0]["data_source"] == "LIVE"
        print("GET /trains (Post-Simulation State) PASSED: Trains updated to LIVE telemetry.")

        # 6. Test GET /predictions and GET /predictions/{train_id}
        res_preds = client.get("/predictions")
        assert res_preds.status_code == 200
        preds_data = res_preds.json()
        assert isinstance(preds_data, list)
        assert len(preds_data) >= 1
        assert "conflict_probability" in preds_data[0]
        assert "recommended_action" in preds_data[0]
        assert "prediction_confidence" in preds_data[0]
        print(f"GET /predictions PASSED: Retrieved {len(preds_data)} live predictions.")

        res_single_pred = client.get("/predictions/LOCAL-101")
        assert res_single_pred.status_code == 200
        single_pred = res_single_pred.json()
        assert single_pred["train_id"] == "LOCAL-101"
        assert single_pred["recommended_action"] == "HOLD"
        print(f"GET /predictions/LOCAL-101 PASSED: Action = {single_pred['recommended_action']}, ETA = {single_pred['predicted_eta']}")

        # 7. Test POST /alerts/{id}/acknowledge on live generated alert
        res_ack = client.post(f"/alerts/{alert_id}/acknowledge")
        assert res_ack.status_code == 200
        ack_data = res_ack.json()
        assert ack_data["alert"]["status"] == "ACKNOWLEDGED"
        print(f"POST /alerts/{alert_id}/acknowledge PASSED:", ack_data["message"])

        # 8. Test invalid alert ID 404
        res_invalid = client.post("/alerts/non-existent-alert-id/acknowledge")
        assert res_invalid.status_code == 404
        print("POST /alerts/invalid-id/acknowledge 404 PASSED.")


    print("\n==================================================")
    print("[API INTEGRATION SUCCESS]: All API endpoints verified!")
    print("==================================================")


if __name__ == "__main__":
    test_api_suite()
