from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import router as api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Railway Operations and Safety Platform Backend API",
    version="0.1.0",
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
