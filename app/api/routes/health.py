from fastapi import APIRouter

from app.core.config import settings

health_router = APIRouter(
    prefix="/health",
    tags=["health"],
)

@health_router.get("/")
def health() -> dict:
    """
        Route that returns the health of MedGemma
    """
    return {"APP_VERSION": settings.APP_VERSION,"status": "ok"}