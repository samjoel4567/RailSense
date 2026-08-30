import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings
    except ImportError:
        from pydantic import BaseModel
        class BaseSettings(BaseModel):
            pass


class Settings(BaseSettings):
    PROJECT_NAME: str = "TrainSense"
    API_V1_STR: str = "/api/v1"
    ENV: str = os.getenv("ENV", "development")


settings = Settings()
