import os
import json
import logging
from typing import Dict, Any, List, Tuple
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
import shap

logger = logging.getLogger("pest_model_loader")

FEATURES = [
    "latitude",
    "longitude",
    "crop",
    "crop_stage",
    "temperature",
    "temperature_max",
    "temperature_min",
    "humidity",
    "rainfall",
    "wind_speed",
    "ndvi",
    "ndre",
    "ndwi",
    "ndvi_change_7d",
    "ndvi_change_14d",
    "soil_ph",
    "soil_nitrogen",
    "soil_moisture",
    "previous_pest_incidence"
]

FEATURE_LABELS = {
    "temperature": "Temperature",
    "temperature_max": "Maximum Temperature",
    "temperature_min": "Minimum Temperature",
    "humidity": "Humidity",
    "rainfall": "Rainfall",
    "wind_speed": "Wind Speed",
    "previous_pest_incidence": "Previous Pest Incidence",
    "crop_stage": "Crop Growth Stage",
    "soil_moisture": "Soil Moisture",
    "soil_ph": "Soil pH",
    "soil_nitrogen": "Soil Nitrogen",
    "ndvi": "Vegetation Health (NDVI)",
    "ndre": "Vegetation Stress (NDRE)",
    "ndwi": "Water/Veg Moisture Index (NDWI)",
    "ndvi_change_7d": "7-Day Vegetation Change",
    "ndvi_change_14d": "14-Day Vegetation Change",
    "crop": "Crop Type",
    "latitude": "Latitude",
    "longitude": "Longitude"
}

ALERT_THRESHOLD = 0.75

class PestRiskModel:
    def __init__(
        self,
        model_path: str = "./pest_model/pest_outbreak_model.json",
        crop_encoder_path: str = "./pest_model/crop_encoder.pkl",
        stage_encoder_path: str = "./pest_model/stage_encoder.pkl",
        config_path: str = "./pest_model/config.json"
    ):
        self.model_path = os.getenv("MODEL_PATH", model_path)
        self.crop_encoder_path = os.getenv("CROP_ENCODER_PATH", crop_encoder_path)
        self.stage_encoder_path = os.getenv("STAGE_ENCODER_PATH", stage_encoder_path)
        self.config_path = os.getenv("MODEL_CONFIG_PATH", config_path)
        
        self.model = None
        self.crop_encoder = None
        self.stage_encoder = None
        self.config = None
        self.explainer = None
        
        self.load()

    def load(self):
        logger.info("Loading XGBoost Pest Risk Model and encoders...")
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Model file not found at: {self.model_path}")
        if not os.path.exists(self.crop_encoder_path):
            raise FileNotFoundError(f"Crop encoder not found at: {self.crop_encoder_path}")
        if not os.path.exists(self.stage_encoder_path):
            raise FileNotFoundError(f"Stage encoder not found at: {self.stage_encoder_path}")
            
        self.model = xgb.XGBClassifier()
        self.model.load_model(self.model_path)
        
        self.crop_encoder = joblib.load(self.crop_encoder_path)
        self.stage_encoder = joblib.load(self.stage_encoder_path)
        
        if os.path.exists(self.config_path):
            with open(self.config_path, "r") as f:
                self.config = json.load(f)
                
        # Initialize SHAP explainer for XGBoost model
        self.explainer = shap.TreeExplainer(self.model)
        logger.info("Pest Risk Model loaded successfully.")

    def encode_crop(self, crop: str) -> int:
        try:
            return int(self.crop_encoder.transform([crop])[0])
        except Exception as e:
            valid_crops = list(self.crop_encoder.classes_) if hasattr(self.crop_encoder, "classes_") else []
            raise ValueError(f"Invalid crop '{crop}'. Supported crops: {valid_crops}") from e

    def encode_stage(self, stage: str) -> int:
        try:
            return int(self.stage_encoder.transform([stage])[0])
        except Exception as e:
            valid_stages = list(self.stage_encoder.classes_) if hasattr(self.stage_encoder, "classes_") else []
            raise ValueError(f"Invalid crop stage '{stage}'. Supported stages: {valid_stages}") from e

    def build_features_df(self, feature_dict: Dict[str, Any]) -> pd.DataFrame:
        """
        Validates and constructs a 1-row pandas DataFrame with exactly 19 features in exact order.
        """
        for feature in FEATURES:
            if feature not in feature_dict:
                raise ValueError(f"Missing required feature: {feature}")
            if feature_dict[feature] is None or (isinstance(feature_dict[feature], float) and np.isnan(feature_dict[feature])):
                raise ValueError(f"Feature '{feature}' cannot be null or NaN")
        
        ordered_data = {f: [float(feature_dict[f])] for f in FEATURES}
        df = pd.DataFrame(ordered_data, columns=FEATURES)
        return df

    def predict(self, features_df: pd.DataFrame) -> Tuple[float, str, bool]:
        """
        Calculates outbreak probability and returns (probability, risk_level, alert).
        """
        prob_array = self.model.predict_proba(features_df)
        probability = float(prob_array[0, 1])
        
        if probability < 0.40:
            risk_level = "LOW"
        elif probability < 0.75:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
            
        alert = probability >= ALERT_THRESHOLD
        return probability, risk_level, alert

    def explain(
        self,
        features_df: pd.DataFrame,
        raw_values: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Calculates SHAP values and returns top 5 contributing factors sorted by absolute SHAP value.
        """
        shap_values = self.explainer.shap_values(features_df)
        
        # Handle SHAP shape for binary classification
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        elif len(shap_values.shape) == 2:
            sv = shap_values[0]
        elif len(shap_values.shape) == 3:
            sv = shap_values[0, :, 1]
        else:
            sv = shap_values[0]

        factors = []
        for idx, col in enumerate(FEATURES):
            val = sv[idx]
            shap_val = float(val)
            direction = "increases_risk" if shap_val > 0 else "decreases_risk"
            
            # Use raw human-readable value for farmer display
            display_val = raw_values.get(col, round(float(features_df.iloc[0][col]), 2))
            
            factors.append({
                "feature": col,
                "label": FEATURE_LABELS.get(col, col.replace("_", " ").title()),
                "value": display_val,
                "shap_value": round(shap_val, 4),
                "direction": direction,
                "abs_shap": abs(shap_val)
            })
            
        # Sort by absolute impact descending and take top 5
        factors.sort(key=lambda x: x["abs_shap"], reverse=True)
        top_factors = factors[:5]
        
        # Remove helper key
        for f in top_factors:
            f.pop("abs_shap", None)
            
        return top_factors

# Global singleton
pest_model_instance = None

def get_pest_model() -> PestRiskModel:
    global pest_model_instance
    if pest_model_instance is None:
        pest_model_instance = PestRiskModel()
    return pest_model_instance
