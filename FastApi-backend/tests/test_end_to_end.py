"""
TrainSense Full End-to-End System Integration Test (Steps 59–60)
Verifies subsystem readiness matrix and end-to-end multi-modal demo scenario execution across all 8 layers.
"""

import os
import sys
from fastapi.testclient import TestClient

# Ensure backend root is in Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services.demo_orchestrator import demo_orchestrator

client = TestClient(app)


def test_end_to_end_system_integration():
    print("==================================================")
    print("TrainSense End-to-End System Integration Test (Steps 59-60)")
    print("==================================================")

    # 1. Test GET /demo/status (Subsystem readiness matrix)
    res_status = client.get("/demo/status")
    assert res_status.status_code == 200
    status_data = res_status.json()

    print("\n--------------------------------------------------")
    print("Subsystem Readiness Matrix (8 Core Layers):")
    print("--------------------------------------------------")
    print(f"Platform Name      : {status_data['platform_name']}")
    print(f"Readiness Status   : {status_data['readiness_status']}")
    for sub, info in status_data["subsystems"].items():
        print(f"  [{sub:<25}] Status: {info['status']}")

    assert status_data["readiness_status"] == "READY"
    assert len(status_data["subsystems"]) == 8

    # 2. Test POST /demo/run-scenario (Full end-to-end scenario trace)
    print("\n--------------------------------------------------")
    print("Executing Full Multi-Modal Demo Scenario Trace:")
    print("--------------------------------------------------")
    res_demo = client.post("/demo/run-scenario")
    assert res_demo.status_code == 200
    demo_data = res_demo.json()

    assert demo_data["status"] == "COMPLETED_SUCCESSFULLY"
    print(f"Demo Trace Status  : {demo_data['status']}")
    print("Execution Timeline Trace:")
    for step in demo_data["execution_steps"]:
        print(f"  - {step}")

    dash = demo_data["dashboard_summary"]
    print(f"\nFinal Dashboard Summary:")
    print(f"  System Status       : {dash['system_status']}")
    print(f"  Active Trains Count : {dash['active_trains_count']}")
    print(f"  Active Alerts Count : {dash['active_alerts_count']}")
    print(f"  Critical Alerts     : {dash['critical_alerts_count']}")

    assert dash["active_trains_count"] >= 2
    assert dash["total_alerts_count"] >= 1

    print("\n==================================================")
    print("[END-TO-END VERIFICATION SUCCESS]: All 8 subsystems verified successfully!")
    print("==================================================")


if __name__ == "__main__":
    test_end_to_end_system_integration()
