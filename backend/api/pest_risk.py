import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.models.pest_model_loader import get_pest_model, FEATURES, FEATURE_LABELS
from backend.services.environmental_data_service import (
    EnvironmentalDataService, EnvironmentalDataUnavailable, validate_environmental_data
)
from backend.services.pest_feature_builder import PestFeatureBuilder, FeatureBuilderError
from backend.services.recommendation_service import RecommendationService
from backend.services.weather_service import WeatherServiceError
from backend.services.satellite_service import SatelliteServiceError
from backend.services.soil_service import SoilServiceError

logger = logging.getLogger("pest_risk_api")

router = APIRouter(prefix="/api/pest-risk", tags=["Pest Risk Prediction"])

class FarmerPredictRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Farm Latitude (-90 to 90)")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Farm Longitude (-180 to 180)")
    crop: str = Field(..., description="Crop Name (e.g., Rice, Wheat, Cotton, Soybean, Maize)")
    crop_stage: str = Field(..., description="Growth Stage (e.g., Tillering/Branching, Vegetative, Flowering, Maturity, Harvest)")
    previous_pest_incidence: int = Field(..., ge=0, le=1, description="Observed pests recently? 0=No, 1=Yes")

    model_config = {
        "extra": "forbid"
    }

class TopFactor(BaseModel):
    feature: str
    label: str
    value: Any
    shap_value: float
    direction: str

class LocationInfo(BaseModel):
    latitude: float
    longitude: float

class EnvironmentalDataSummary(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    ndvi: float
    ndre: float
    ndwi: float
    soil_ph: float
    soil_nitrogen: float
    soil_moisture: float
    temperature_max: Optional[float] = None
    temperature_min: Optional[float] = None
    wind_speed: Optional[float] = None
    ndvi_change_7d: Optional[float] = None
    ndvi_change_14d: Optional[float] = None

class PestRiskResponse(BaseModel):
    success: bool
    crop: str
    crop_stage: str
    location: LocationInfo
    outbreak_probability: float
    risk_percentage: float
    risk_level: str
    alert: bool
    top_factors: List[TopFactor]
    recommendations: List[str]
    environmental_data: EnvironmentalDataSummary
    data_sources: Dict[str, Any]
    disclaimer: str

@router.get("/diagnostics", summary="Diagnostics on 19 Features & Telemetry Providers")
async def get_diagnostics():
    """
    Development endpoint listing all 19 feature definitions and current telemetry modes.
    """
    model = get_pest_model()
    return {
        "features_count": len(FEATURES),
        "feature_order": [
            {"index": idx + 1, "feature": feat, "label": FEATURE_LABELS.get(feat, feat)}
            for idx, feat in enumerate(FEATURES)
        ],
        "supported_crops": list(model.crop_encoder.classes_),
        "supported_stages": list(model.stage_encoder.classes_),
        "alert_threshold": 0.75,
        "disclaimer": "Prototype environmental integration. Model has not been validated against real-world pest outbreak observations."
    }

@router.post(
    "/predict",
    response_model=PestRiskResponse,
    summary="Predict Pest Outbreak Risk",
    description="Accepts farmer basic inputs, retrieves live weather, satellite, and soil data, and predicts outbreak probability using XGBoost."
)
async def predict_pest_risk(request: FarmerPredictRequest):
    logger.info(
        f"Incoming prediction request: lat={request.latitude}, lon={request.longitude}, "
        f"crop={request.crop}, stage={request.crop_stage}, prev_pest={request.previous_pest_incidence}"
    )

    # 1. Fetch live environmental data (Weather, Sentinel-2 STAC, Soil) concurrently
    env_service = EnvironmentalDataService()
    try:
        env_data = await env_service.fetch_all_environmental_data(
            latitude=request.latitude,
            longitude=request.longitude
        )
    except SoilServiceError as e:
        logger.error(f"Soil telemetry error: {str(e)}")
        missing = getattr(e, "missing_features", []) or ["soil_data"]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Required environmental data unavailable",
                "detail": str(e),
                "missing_features": missing
            }
        )
    except SatelliteServiceError as e:
        logger.error(f"Satellite telemetry error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Required environmental data unavailable",
                "detail": str(e),
                "missing_features": ["satellite_indices (ndvi/ndre/ndwi)"]
            }
        )
    except WeatherServiceError as e:
        logger.error(f"Weather telemetry error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Required environmental data unavailable",
                "detail": str(e),
                "missing_features": ["meteorological_data"]
            }
        )
    except EnvironmentalDataUnavailable as e:
        logger.error(f"Validation error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Required environmental data unavailable",
                "detail": str(e),
                "missing_features": e.missing_features
            }
        )
    except Exception as e:
        logger.exception("Unexpected error fetching environmental data")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while gathering environmental observations."
        )

    # 2. Build and strictly validate the 19 features
    model = get_pest_model()
    feature_builder = PestFeatureBuilder(model)
    try:
        features_df, raw_display_dict = feature_builder.build_features(
            latitude=request.latitude,
            longitude=request.longitude,
            crop=request.crop,
            crop_stage=request.crop_stage,
            previous_pest_incidence=request.previous_pest_incidence,
            env_data=env_data
        )
    except FeatureBuilderError as e:
        logger.error(f"Feature validation error: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": "Required environmental data unavailable",
                "detail": str(e),
                "missing_features": e.missing_features
            }
        )

    # Diagnostic logging of all 19 features
    logger.info("=== 19/19 FEATURES CONSTRUCTED FOR INFERENCE ===")
    for idx, col in enumerate(FEATURES):
        logger.info(f"FEATURE {idx + 1:02d} {col:25s} = {features_df.iloc[0][col]} (raw: {raw_display_dict.get(col)})")

    # 3. XGBoost Model Inference
    try:
        probability, risk_level, alert = model.predict(features_df)
    except Exception as e:
        logger.exception("Model inference execution failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference execution failed."
        )

    # 4. TreeSHAP Explanation
    try:
        top_factors_raw = model.explain(features_df, raw_display_dict)
        top_factors = [TopFactor(**tf) for tf in top_factors_raw]
    except Exception as e:
        logger.exception("SHAP explanation failed")
        top_factors = []

    # 5. Recommendation Generation
    rec_service = RecommendationService()
    recommendations = rec_service.generate_recommendations(
        risk_level=risk_level,
        crop=request.crop,
        crop_stage=request.crop_stage,
        top_factors=[tf.model_dump() for tf in top_factors]
    )

    risk_percentage = round(probability * 100.0, 2)

    logger.info(
        f"Prediction complete for ({request.crop}, {request.crop_stage}): "
        f"Probability={probability:.4f} ({risk_percentage}%), Risk={risk_level}, Alert={alert}"
    )

    return PestRiskResponse(
        success=True,
        crop=request.crop,
        crop_stage=request.crop_stage,
        location=LocationInfo(latitude=request.latitude, longitude=request.longitude),
        outbreak_probability=round(probability, 4),
        risk_percentage=risk_percentage,
        risk_level=risk_level,
        alert=alert,
        top_factors=top_factors,
        recommendations=recommendations,
        environmental_data=EnvironmentalDataSummary(
            temperature=env_data.temperature,
            temperature_max=env_data.temperature_max,
            temperature_min=env_data.temperature_min,
            humidity=env_data.humidity,
            rainfall=env_data.rainfall,
            wind_speed=env_data.wind_speed,
            ndvi=env_data.ndvi,
            ndre=env_data.ndre,
            ndwi=env_data.ndwi,
            ndvi_change_7d=env_data.ndvi_change_7d,
            ndvi_change_14d=env_data.ndvi_change_14d,
            soil_ph=env_data.soil_ph,
            soil_nitrogen=env_data.soil_nitrogen,
            soil_moisture=env_data.soil_moisture
        ),
        data_sources=env_data.data_sources,
        disclaimer=(
            "Note: Prototype environmental integration. This model was trained on a synthetic development dataset. "
            "Environmental inputs represent live meteorological, satellite, and soil data. "
            "Alert threshold (75%) is a decision-support indicator, not a definitive certainty."
        )
    )
