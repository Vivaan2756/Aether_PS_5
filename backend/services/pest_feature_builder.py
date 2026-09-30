import math
import logging
from typing import Dict, Any, Tuple, List
import pandas as pd
import numpy as np

from backend.models.pest_model_loader import PestRiskModel, FEATURES
from backend.services.environmental_data_service import EnvironmentalDataResult

logger = logging.getLogger("pest_feature_builder")

class FeatureBuilderError(Exception):
    def __init__(self, message: str, missing_features: List[str] = None):
        super().__init__(message)
        self.missing_features = missing_features or []

class PestFeatureBuilder:
    def __init__(self, model_loader: PestRiskModel):
        self.model_loader = model_loader

    def build_features(
        self,
        latitude: float,
        longitude: float,
        crop: str,
        crop_stage: str,
        previous_pest_incidence: int,
        env_data: EnvironmentalDataResult
    ) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Constructs and strictly validates the 1-row, 19-feature vector pandas DataFrame.
        """
        logger.info(f"Building exact 19-feature vector for ({crop}, {crop_stage})...")

        missing_features: List[str] = []

        # Encode categorical variables
        try:
            crop_encoded = self.model_loader.encode_crop(crop)
        except Exception as e:
            missing_features.append("crop")
            raise FeatureBuilderError(f"Invalid crop '{crop}': {str(e)}", ["crop"])

        try:
            stage_encoded = self.model_loader.encode_stage(crop_stage)
        except Exception as e:
            missing_features.append("crop_stage")
            raise FeatureBuilderError(f"Invalid crop stage '{crop_stage}': {str(e)}", ["crop_stage"])

        if previous_pest_incidence not in (0, 1):
            raise FeatureBuilderError("previous_pest_incidence must be 0 (No) or 1 (Yes)", ["previous_pest_incidence"])

        # Construct candidate dictionary
        raw_map = {
            "latitude": latitude,
            "longitude": longitude,
            "crop": float(crop_encoded),
            "crop_stage": float(stage_encoded),
            "temperature": env_data.temperature,
            "temperature_max": env_data.temperature_max,
            "temperature_min": env_data.temperature_min,
            "humidity": env_data.humidity,
            "rainfall": env_data.rainfall,
            "wind_speed": env_data.wind_speed,
            "ndvi": env_data.ndvi,
            "ndre": env_data.ndre,
            "ndwi": env_data.ndwi,
            "ndvi_change_7d": env_data.ndvi_change_7d,
            "ndvi_change_14d": env_data.ndvi_change_14d,
            "soil_ph": env_data.soil_ph,
            "soil_nitrogen": env_data.soil_nitrogen,
            "soil_moisture": env_data.soil_moisture,
            "previous_pest_incidence": float(previous_pest_incidence)
        }

        # Check for missing/invalid features
        for feat in FEATURES:
            if feat not in raw_map or raw_map[feat] is None:
                missing_features.append(feat)
            elif isinstance(raw_map[feat], float) and (math.isnan(raw_map[feat]) or math.isinf(raw_map[feat])):
                missing_features.append(feat)

        if missing_features:
            raise FeatureBuilderError(
                f"Validation failed: missing or invalid features: {missing_features}",
                missing_features
            )

        # Build DataFrame with exact 19 features in exact order
        features_df = pd.DataFrame([{f: float(raw_map[f]) for f in FEATURES}])[FEATURES]

        # Strict validation assertions
        assert len(FEATURES) == 19, f"Expected 19 features, found {len(FEATURES)}"
        assert list(features_df.columns) == FEATURES, f"Column order mismatch: {list(features_df.columns)}"
        assert features_df.shape == (1, 19), f"Expected shape (1, 19), got {features_df.shape}"
        assert not features_df.isnull().values.any(), "Feature vector contains null/NaN values"

        # Dictionary of human-readable values for farmer UI and SHAP display
        raw_display_dict = {
            "latitude": latitude,
            "longitude": longitude,
            "crop": crop,
            "crop_stage": crop_stage,
            "temperature": env_data.temperature,
            "temperature_max": env_data.temperature_max,
            "temperature_min": env_data.temperature_min,
            "humidity": env_data.humidity,
            "rainfall": env_data.rainfall,
            "wind_speed": env_data.wind_speed,
            "ndvi": env_data.ndvi,
            "ndre": env_data.ndre,
            "ndwi": env_data.ndwi,
            "ndvi_change_7d": env_data.ndvi_change_7d,
            "ndvi_change_14d": env_data.ndvi_change_14d,
            "soil_ph": env_data.soil_ph,
            "soil_nitrogen": env_data.soil_nitrogen,
            "soil_moisture": env_data.soil_moisture,
            "previous_pest_incidence": "Yes" if previous_pest_incidence == 1 else "No"
        }

        return features_df, raw_display_dict
