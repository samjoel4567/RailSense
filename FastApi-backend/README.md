# TrainSense Backend

FastAPI service powering TrainSense railway operations and safety platform.

## Getting Started

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Copy environment configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Run development server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## Run the Full Live Demo

With the server running in one terminal, use this command in a second terminal to drive live telemetry, ML prediction, vision detection, correlation, risk scoring, alert creation, and WebSocket broadcasting:

```bash
curl -X POST http://localhost:8000/simulation/trigger-conflict
```

Confirm the newly computed operational state:

```bash
curl http://localhost:8000/alerts
curl http://localhost:8000/dashboard
```

To run the full automated verification suite after installing dependencies:

```bash
pytest
```
