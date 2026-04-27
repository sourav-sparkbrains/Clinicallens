from fastapi import FastAPI

from app.core.config import settings
from app.api.routes.health import health_router
from app.api.routes.triage import triage_router

app = FastAPI(
    title="ClinicalLens",
    version=settings.APP_VERSION,
)

app.include_router(health_router)
app.include_router(triage_router)
