from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    HF_TOKEN: str
    HF_API_URL: str = "https://api-inference.huggingface.co/v1/chat/completions"
    KAGGLE_INFERENCE_URL: str = ""
    REQUEST_TIMEOUT: int = 300 #200
    MAX_IMAGE_SIZE_MB: int = 5
    APP_VERSION: str = "0.1.0"

    class Config:
        env_file = ".env"


settings = Settings()