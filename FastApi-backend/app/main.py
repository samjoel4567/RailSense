from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Railway Operations and Safety Platform Backend",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {"message": "TrainSense Backend API is running", "status": "ok"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
