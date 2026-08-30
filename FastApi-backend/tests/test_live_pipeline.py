"""
TrainSense True Live Application Integration Test
Verifies automatic event pipeline wiring via actual FastAPI application lifespan startup,
end-to-end multi-modal scenario execution, StateStore state synchronization, WebSocket broadcasting,
and clean context isolation across multiple runs.
"""

from datetime import datetime, timezone
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.state_store import state_store


def test_true_live_fastapi_pipeline():
    print("==================================================")
    print("LIVE FASTAPI PIPELINE VERIFICATION")
    print("==================================================")

    # Clean state store before startup
    state_store.clear()

    # ----------------------------------------------------
    # RUN 1: FIRST CLEAN APPLICATION LIFESPAN RUN
    # ----------------------------------------------------
    print("\nStarting actual FastAPI application lifecycle (Run 1)...")
    
    # Notice: TestClient(app) enters FastAPI lifespan context manager in app/main.py.
    # NO MANUAL CALLS to attach_prediction_service_to_bus() or correlation_engine.start_listening()!
    with TestClient(app) as client:
        # 1. Verify Clean Startup State (0 seeded alerts, demo placeholder trains)
        res_health = client.get("/health")
        assert res_health.status_code == 200
        health = res_health.json()
        assert health["status"] == "healthy"

        res_alerts_clean = client.get("/alerts")
        assert res_alerts_clean.status_code == 200
        alerts_clean = res_alerts_clean.json()
        assert len(alerts_clean) == 0, f"Expected 0 seeded alerts on startup, got {len(alerts_clean)}"

        res_dash_clean = client.get("/dashboard")
        assert res_dash_clean.status_code == 200
        dash_clean = res_dash_clean.json()
        assert dash_clean["system_status"] == "NORMAL"
        assert dash_clean["active_alerts_count"] == 0

        res_trains_clean = client.get("/trains")
        assert res_trains_clean.status_code == 200
        trains_clean = res_trains_clean.json()
        assert len(trains_clean) >= 2
        assert trains_clean[0]["is_live"] is False
        assert trains_clean[0]["data_source"] == "DEMO_INITIAL"

        # 2. Establish WebSocket Stream on WS /ws
        with client.websocket_connect("/ws") as websocket:
            connect_frame = websocket.receive_json()
            assert connect_frame["event_type"] == "SYSTEM_CONNECT"
            assert "Connected to TrainSense" in connect_frame["message"]

            # 3. Trigger Live Multi-Modal Scenario via POST /simulation/trigger-conflict
            run1_start_time = datetime.now(timezone.utc).isoformat()
            res_trig = client.post("/simulation/trigger-conflict")
            assert res_trig.status_code == 200
            trig_data = res_trig.json()
            assert trig_data["result"]["status"] == "SUCCESS"

            # 4. Receive Real-Time Alert Frame on WebSocket Client
            ws_alert_data = None
            for _ in range(30):
                frame = websocket.receive_json()
                evt_type = str(frame.get("event_type", "")).upper()
                if "ALERT" in evt_type:
                    data = frame.get("data", {})
                    if data.get("alert_type") == "CORRELATED_TRACK_INTRUSION" or data.get("risk_level") in ["HIGH", "CRITICAL"]:
                        ws_alert_data = data
                        break

            assert ws_alert_data is not None, "Expected live correlated ALERT frame over WebSocket stream"
            assert "alert_id" in ws_alert_data
            assert ws_alert_data.get("risk_level") in ["HIGH", "CRITICAL"]

        # 5. Query REST API for Live Computed Alert State
        res_alerts_live = client.get("/alerts")
        assert res_alerts_live.status_code == 200
        alerts_live = res_alerts_live.json()
        assert len(alerts_live) >= 1
        run1_alert = alerts_live[-1]

        # 6. Verify Runtime-Generated Fields on Alert
        assert "alert_id" in run1_alert and isinstance(run1_alert["alert_id"], str) and len(run1_alert["alert_id"]) > 0
        assert "train_id" in run1_alert and ("LOCAL" in run1_alert["train_id"] or "EXPRESS" in run1_alert["train_id"])
        assert "section" in run1_alert and "SEC-A1" in run1_alert["section"]
        assert "risk_score" in run1_alert and isinstance(run1_alert["risk_score"], (int, float)) and run1_alert["risk_score"] > 0.0
        assert "risk_level" in run1_alert and run1_alert["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert "alert_type" in run1_alert and len(run1_alert["alert_type"]) > 0
        assert "recommendation" in run1_alert and len(run1_alert["recommendation"]) > 0
        assert "timestamp" in run1_alert and run1_alert["timestamp"] >= run1_start_time

        # 7. Verify StateStore & Dashboard State Synchronization
        res_dash_live = client.get("/dashboard")
        assert res_dash_live.status_code == 200
        dash_live = res_dash_live.json()
        assert dash_live["system_status"] == "CRITICAL_ALERT"
        assert dash_live["active_alerts_count"] >= 1
        assert dash_live["latest_prediction"] is not None
        assert dash_live["latest_vision_detection"] is not None

        res_trains_live = client.get("/trains")
        assert res_trains_live.status_code == 200
        trains_live = res_trains_live.json()
        assert trains_live[0]["is_live"] is True
        assert trains_live[0]["data_source"] == "LIVE"

        # 8. Verify GET /predictions REST state
        res_preds_live = client.get("/predictions")
        assert res_preds_live.status_code == 200
        preds_live = res_preds_live.json()
        assert len(preds_live) >= 1
        assert "conflict_probability" in preds_live[0]
        assert "recommended_action" in preds_live[0]
        assert "expected_delay_min" in preds_live[0]
        assert "predicted_eta" in preds_live[0]
        assert "prediction_confidence" in preds_live[0]

    # ----------------------------------------------------
    # RUN 2: SECOND CLEAN CONTEXT APPLICATION RUN
    # ----------------------------------------------------
    print("\nStarting second clean FastAPI application lifecycle (Run 2)...")
    state_store.clear()

    with TestClient(app) as client2:
        # Trigger scenario in fresh application context
        run2_start_time = datetime.now(timezone.utc).isoformat()
        res_trig2 = client2.post("/simulation/trigger-conflict")
        assert res_trig2.status_code == 200

        res_alerts2 = client2.get("/alerts")
        alerts2 = res_alerts2.json()
        assert len(alerts2) >= 1
        run2_alert = alerts2[-1]

        # Verify fresh alert_id and fresh timestamp for Run 2
        assert run2_alert["alert_id"] != run1_alert["alert_id"], f"Run 2 must generate a fresh alert_id! Got duplicate: {run2_alert['alert_id']}"
        assert run2_alert["timestamp"] >= run1_alert["timestamp"], f"Run 2 timestamp must be >= Run 1 timestamp!"
        assert run2_alert["timestamp"] >= run2_start_time

    # ----------------------------------------------------
    # PRINT REQUIRED VERIFICATION SUMMARY REPORT
    # ----------------------------------------------------
    print("\n==================================================")
    print("LIVE FASTAPI PIPELINE VERIFICATION")
    print("==================================================")
    print()
    print("FastAPI lifecycle startup: PASSED")
    print("ML live subscription: PASSED")
    print("Correlation live subscription: PASSED")
    print("Simulation triggered: PASSED")
    print("Live prediction received: PASSED")
    print("Live vision event received: PASSED")
    print("Live correlation completed: PASSED")
    print("Fresh risk alert generated: PASSED")
    print("StateStore updated: PASSED")
    print("WebSocket broadcast: PASSED")
    print()
    print("FINAL RESULT: TRUE END-TO-END LIVE PIPELINE VERIFIED")
    print("==================================================")


if __name__ == "__main__":
    test_true_live_fastapi_pipeline()
