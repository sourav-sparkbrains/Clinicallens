import json
import pytest
import httpx
from llm import GroqLangChainModel
from app.core.config import settings


@pytest.fixture(scope="session")
def groq_model():
    return GroqLangChainModel(model_name="llama-3.3-70b-versatile")


@pytest.fixture(scope="session")
def triage_goldens():
    with open(settings.GOLDENS_PATH) as f:
        return json.load(f)


@pytest.fixture(scope="session")
def api_client():
    return httpx.Client(base_url=settings.BASE_URL, timeout=60.0)