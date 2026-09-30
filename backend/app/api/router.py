from fastapi import APIRouter
from app.api.endpoints import fields, inference, analytics

api_router = APIRouter()

api_router.include_router(fields.router, prefix="/fields", tags=["fields"])
api_router.include_router(inference.router, prefix="/inference", tags=["inference"])
api_router.include_router(inference.router, prefix="/predict", tags=["inference"])
api_router.include_router(inference.router, prefix="", tags=["inference"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
