import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.router import router
from app.core.config import settings
from app.correlation.engine import correlation_engine
from app.ml.predict import attach_prediction_service_to_bus


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Attach EventBus subscribers
    attach_prediction_service_to_bus()
    correlation_engine.start_listening()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Railway Operations and Safety Platform Backend",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend (e.g. Vite on localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

# Mount evaluation artifacts directory for visual asset serving
eval_assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/evaluation"))
os.makedirs(eval_assets_dir, exist_ok=True)
app.mount("/evaluation-assets", StaticFiles(directory=eval_assets_dir), name="evaluation-assets")


@app.get("/")
async def root():
    return {"message": "TrainSense Backend API is running", "status": "ok"}

