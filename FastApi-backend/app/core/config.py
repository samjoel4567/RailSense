import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "TrainSense"
    API_V1_STR: str = "/api/v1"
    ENV: str = os.getenv("ENV", "development")

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
