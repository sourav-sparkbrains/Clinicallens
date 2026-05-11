from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    HF_TOKEN: str
    HF_API_URL: str = "https://api-inference.huggingface.co/v1/chat/completions"
    KAGGLE_INFERENCE_URL: str ="https://tarantula-ream-buckle.ngrok-free.dev"
    REQUEST_TIMEOUT: int = 300
    MAX_IMAGE_SIZE_MB: int = 5
    APP_VERSION: str = "0.1.0"
    GROQ_API_KEY: str
    BASE_URL: str ="http://localhost:8000"
    GOLDENS_PATH: str = "evals/data/triage_goldens.json"
    IMAGE_PATH: str =  "sample_images/"

    class Config:
        env_file = ".env"


settings = Settings()