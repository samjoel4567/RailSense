# TrainSense - Railway Operations and Safety Platform

TrainSense is a real-time railway operations and safety platform built for 48-hour hackathon MVP.

## Backend Architecture

The backend is built with Python and FastAPI, designed to integrate:
- **In-Memory Asynchronous Event Bus**: High-throughput event routing for sensor signals and telemetry.
- **XGBoost Prediction Service**: Telemetry-based predictive maintenance and failure risk modeling.
- **YOLOv8n Vision Service**: Real-time obstacle, track defect, and signal detection.
- **Correlation Engine**: Multi-modal data fusion linking telemetry, vision, and operational logs.
- **Risk Engine**: Continuous hazard scoring and dynamic safety alert generation.
- **FastAPI REST & WebSockets**: Low-latency streaming and API endpoints for live dashboards.

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI entry point
│   ├── api/             # API routes & WebSocket endpoints
│   ├── core/            # Config, security, database settings
│   ├── models/          # ORM / DB models
│   ├── schemas/         # Pydantic data schemas
│   ├── services/        # Business logic services
│   ├── event_bus/       # Async event pub/sub system
│   ├── ml/              # XGBoost predictive models & inference
│   ├── vision/          # YOLOv8 object detection service
│   ├── correlation/     # Event correlation & fusion engine
│   └── risk/            # Risk scoring & safety alerts
├── tests/               # Unit and integration tests
├── data/                # Sample datasets & test streams
├── models/              # Pre-trained ML & Vision model weights
├── requirements.txt
├── .env.example
└── README.md
```

## Quickstart

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
