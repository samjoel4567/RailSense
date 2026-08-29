"""
FastAPI REST API Integration Tests for TrainSense (RailSense repository)
Tests /health, /trains, /alerts, /dashboard, and /alerts/{id}/acknowledge endpoints.
"""

import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app

client = TestClient(app)


def test_get_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    print("GET /health PASSED:", data)


def test_get_trains():
    response = client.get("/trains")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "train_id" in data[0]
    print(f"GET /trains PASSED: Retrived {len(data)} active trains.")


def test_get_alerts():
    response = client.get("/alerts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "alert_id" in data[0]
    print(f"GET /alerts PASSED: Retrived {len(data)} risk alerts.")


def test_get_dashboard():
    response = client.get("/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "system_status" in data
    assert "active_trains_count" in data
    assert "active_alerts" in data
    print("GET /dashboard PASSED:", data["system_status"], f"({data['active_trains_count']} trains, {data['active_alerts_count']} alerts)")


def test_acknowledge_alert():
    # 1. Fetch active alerts
    alerts_res = client.get("/alerts")
    alerts = alerts_res.json()
    alert_id = alerts[0]["alert_id"]

    # 2. Acknowledge the alert
    ack_res = client.post(f"/alerts/{alert_id}/acknowledge")
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["alert"]["status"] == "ACKNOWLEDGED"
    print(f"POST /alerts/{alert_id}/acknowledge PASSED:", ack_data["message"])

    # 3. Test invalid alert ID 404
    invalid_res = client.post("/alerts/non-existent-alert-id/acknowledge")
    assert invalid_res.status_code == 404
    print("POST /alerts/invalid-id/acknowledge 404 PASSED.")


if __name__ == "__main__":
    print("==================================================")
    print("Running TrainSense REST API Integration Tests")
    print("==================================================")
    test_get_health()
    test_get_trains()
    test_get_alerts()
    test_get_dashboard()
    test_acknowledge_alert()
    print("\n==================================================")
    print("[API INTEGRATION SUCCESS]: All API endpoints verified!")
    print("==================================================")
