import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Setup structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aether_pest_risk_api")

from backend.models.pest_model_loader import get_pest_model
from backend.api.pest_risk import router as pest_risk_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Pest Risk Prediction Backend...")
    # Pre-load ML model and encoders at startup
    try:
        model = get_pest_model()
        logger.info(f"Pest Risk Model ready. Model classes: {model.crop_encoder.classes_}")
    except Exception as e:
        logger.error(f"Failed to load model during startup: {str(e)}")
        raise e
    yield
    logger.info("Shutting down Pest Risk Prediction Backend...")

app = FastAPI(
    title="Aether Pest Risk Prediction API",
    description="AI-Based Pest Outbreak Risk Classifier with automated Weather, Sentinel-2, and Soil feature aggregation.",
    version="1.0.0",
    lifespan=lifespan
)

# Allow Cross-Origin Requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(pest_risk_router)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "service": "Pest Risk Prediction Service",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
