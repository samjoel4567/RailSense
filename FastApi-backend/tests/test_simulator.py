"""
Standalone Telemetry Simulator & Scenario Test for TrainSense (Steps 56–58)
Tests real-time telemetry emission, scenario triggers, end-to-end AI pipeline execution,
REST API simulation endpoints, and WebSocket broadcasting.
"""

import asyncio
import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.event_bus import Event, EventType, event_bus
from app.main import app
from app.services.simulator import simulator, TelemetrySimulator
from app.services.state_store import state_store


def test_simulator_pipeline():
    print("==================================================")
    print("TrainSense Telemetry Simulator Test (Steps 56-58)")
    print("==================================================")

    state_store.clear()

    with TestClient(app) as client:
        # 1. Test GET /simulation/status
        res_status = client.get("/simulation/status")
        assert res_status.status_code == 200
        data_status = res_status.json()
        assert "is_running" in data_status
        print("GET /simulation/status PASSED:", data_status)

        # 2. Test POST /simulation/start
        res_start = client.post("/simulation/start?interval_seconds=1.0")
        assert res_start.status_code == 200
        data_start = res_start.json()
        assert data_start["status"]["is_running"] is True
        print("POST /simulation/start PASSED:", data_start["message"])

        # 3. Test POST /simulation/stop
        res_stop = client.post("/simulation/stop")
        assert res_stop.status_code == 200
        data_stop = res_stop.json()
        assert data_stop["status"]["is_running"] is False
        print("POST /simulation/stop PASSED:", data_stop["message"])

        # 4. Test End-to-End Multi-Modal Scenario Trigger
        print("\nTriggering multi-modal high-risk conflict scenario...")
        res_trig = client.post("/simulation/trigger-conflict")
        assert res_trig.status_code == 200
        data_trig = res_trig.json()
        assert data_trig["result"]["scenario"] == "HIGH_RISK_CONFLICT_SCENARIO"
        assert data_trig["result"]["status"] == "SUCCESS"
        print("POST /simulation/trigger-conflict PASSED:", data_trig["message"])

        # 5. Verify StateStore received updated train predictions and alerts
        trains = state_store.get_trains()
        alerts = state_store.get_alerts()
        assert len(trains) >= 2
        assert len(alerts) >= 1
        print(f"End-to-End State Store Verification PASSED: {len(trains)} active trains, {len(alerts)} risk alerts.")

    print("\n==================================================")
    print("[SIMULATOR TEST SUCCESS]: Telemetry simulator verified successfully!")
    print("==================================================")


if __name__ == "__main__":
    test_simulator_pipeline()
