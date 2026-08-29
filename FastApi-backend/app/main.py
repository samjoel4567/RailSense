from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import router as api_router
from app.core.config import settings
from app.correlation.engine import correlation_engine
from app.event_bus import event_bus, EventType
from app.ml.predict import prediction_service

logger = logging.getLogger("TrainSense.Main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Context Manager.
    Wires live production event pipeline subscribers during application startup.
    """
    # 1. Attach ML Prediction Service to EventBus for TRAIN_UPDATE telemetry events
    event_bus.subscribe(EventType.TRAIN_UPDATE, prediction_service.handle_train_update_event)
    logger.info("[Startup] ML Prediction Service attached to EventBus")
    print("[Startup] ML Prediction Service attached to EventBus")

    # 2. Attach Correlation Engine to EventBus for PREDICTION and VISION_DETECTION events
    correlation_engine.start_listening()
    logger.info("[Startup] Correlation Engine listening for prediction and vision events")
    print("[Startup] Correlation Engine listening for prediction and vision events")

    logger.info("[Startup] Live event pipeline READY")
    print("[Startup] Live event pipeline READY")

    yield

    logger.info("[Shutdown] FastAPI application shutting down")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Railway Operations and Safety Platform Backend API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API router under both root prefix (for /health, /trains, /alerts, /dashboard) and /api/v1
app.include_router(api_router)
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "TrainSense Backend API is running",
        "status": "ok",
        "endpoints": ["/health", "/trains", "/alerts", "/dashboard", "/alerts/{id}/acknowledge"]
    }
