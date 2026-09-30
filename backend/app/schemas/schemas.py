from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

class FieldBase(BaseModel):
    name: str
    crop_type: str
    area_hectares: float

class FieldCreate(FieldBase):
    boundary: str  # WKT or GeoJSON depending on processing

class FieldResponse(FieldBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class PredictionResponse(BaseModel):
    yield_forecast: float
    confidence_lower: float
    confidence_upper: float
    advisories: List[Dict[str, Any]]

class YieldPredictionDetails(BaseModel):
    yield_val: float = Field(..., alias="yield")
    unit: str = "t/ha"
    uncertainty_std: float
    range_80: List[float]
    confidence: str
    n_models: Optional[int] = None
    model_version: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)

class Recommendation(BaseModel):
    type: str
    priority: int
    message: str
    level: Optional[str] = None

class InferenceResponse(BaseModel):
    field_id: str
    prediction: YieldPredictionDetails
    recommendations: List[Recommendation]
    yield_forecast: Optional[float] = None
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None
    advisories: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(populate_by_name=True)

class InferenceRequest(BaseModel):
    field_id: Optional[str] = "1"
    tabular: Optional[Dict[str, float]] = None
    image: Optional[List[Any]] = None
    ndwi: Optional[float] = None
    pest_probability: Optional[float] = None
    district_avg_yield: Optional[float] = None

class PredictYieldMultiModalRequest(BaseModel):
    field_id: Optional[str] = "custom"
    geojson: Optional[Dict[str, Any]] = None
    coordinates: Optional[Any] = None
    crop_type: Optional[str] = "cotton"
    ndwi: Optional[float] = None
    pest_probability: Optional[float] = None
    district_avg_yield: Optional[float] = None

class MultiModalPredictionDetails(BaseModel):
    yield_val: float = Field(..., alias="yield")
    unit: str = "t/ha"
    prithvi_yield: float
    catboost_yield: float
    uncertainty_std: float
    range_80: List[float]
    confidence: str
    ensemble_weights: str = "Prithvi (60%) + CatBoost (40%)"

    model_config = ConfigDict(populate_by_name=True)

class MultiModalInferenceResponse(BaseModel):
    field_id: str
    centroid: Dict[str, float]
    area_hectares: float
    prediction: MultiModalPredictionDetails
    covariates: Dict[str, Any]
    recommendations: List[Recommendation]

    # Backward compatibility fields
    yield_forecast: float
    confidence_lower: float
    confidence_upper: float
    advisories: List[Dict[str, Any]]

    model_config = ConfigDict(populate_by_name=True)

