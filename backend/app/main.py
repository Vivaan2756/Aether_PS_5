from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.core.database import engine, Base

from pathlib import Path
import logging
from app.models.kisan_model import YieldPredictor
from app.models.catboost_model import CatBoostYieldPredictor

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 1. Initialize Prithvi-EO model once on startup and store in app.state.predictor
    weights_path = Path("app/models/weights/kisan_yield_seed0.pth")
    if not weights_path.exists():
        resolved = Path(__file__).resolve().parent / "models" / "weights" / "kisan_yield_seed0.pth"
        if resolved.exists():
            weights_path = resolved

    try:
        app.state.predictor = YieldPredictor(str(weights_path))
        print(f"[Lifespan] YieldPredictor (Prithvi-EO) loaded successfully from {weights_path}")
    except Exception as e:
        print(f"[Lifespan] Warning: Failed to load YieldPredictor: {e}")
        app.state.predictor = None

    # 2. Initialize CatBoost model once on startup and store in app.state.catboost_model
    catboost_path = Path("app/models/weights/catboost_farm_yield_model.cbm")
    if not catboost_path.exists():
        resolved_cb = Path(__file__).resolve().parent / "models" / "weights" / "catboost_farm_yield_model.cbm"
        if resolved_cb.exists():
            catboost_path = resolved_cb

    try:
        app.state.catboost_model = CatBoostYieldPredictor(str(catboost_path))
        print(f"[Lifespan] CatBoostYieldPredictor initialized for {catboost_path}")
    except Exception as e:
        print(f"[Lifespan] Warning: Failed to initialize CatBoost: {e}")
        app.state.catboost_model = None

    yield
    # Teardown
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.endpoints import inference

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(inference.router, prefix="/predict", tags=["predict-root"])
app.include_router(inference.router, prefix="", tags=["predict-yield-root"])

@app.get("/")
def root():
    return {"message": "Welcome to Kisan Vikas API"}
