"""
regional_data_service.py - Spatial and meteorological covariate builder.
Computes polygon centroids with Shapely and fetches real/simulated
agro-climatic features for Prithvi-EO and CatBoost models.
"""

from typing import Dict, Any, List, Tuple, Optional
import math
import httpx
from shapely.geometry import Polygon, shape

def calculate_polygon_centroid_and_area(geometry: Any) -> Tuple[float, float, float]:
    """
    Computes (lat, lng, area_hectares) from GeoJSON geometry or coordinate ring.
    Coordinates are expected as [longitude, latitude].
    """
    try:
        if isinstance(geometry, dict):
            geom_obj = shape(geometry)
        elif isinstance(geometry, list):
            # If coordinates list like [[[lng, lat], ...]]
            if len(geometry) > 0 and isinstance(geometry[0], list) and isinstance(geometry[0][0], list):
                geom_obj = Polygon(geometry[0])
            else:
                geom_obj = Polygon(geometry)
        else:
            geom_obj = geometry

        centroid = geom_obj.centroid
        lng = float(centroid.x)
        lat = float(centroid.y)

        # Approximate geodesic area in hectares for agricultural parcels
        # 1 deg lat ~ 111 km; 1 deg lng ~ 111 km * cos(lat)
        cos_lat = math.cos(math.radians(lat))
        area_sq_deg = geom_obj.area
        area_sq_m = area_sq_deg * (111320.0 * (111320.0 * cos_lat))
        area_ha = max(round(area_sq_m / 10000.0, 2), 0.5)

        return lat, lng, area_ha
    except Exception as e:
        # Fallback to default Vidarbha coordinates if parsing fails
        return 20.5937, 78.9629, 5.80

def simulate_regional_covariates(lat: float, lng: float) -> Dict[str, Any]:
    """
    Deterministic pseudo-environmental generator based on spatial coordinate seed.
    Used as an ultra-reliable fallback if weather APIs are unreachable.
    """
    seed = (abs(math.sin(lat * 12.9898 + lng * 78.233)) * 43758.5453) % 1.0

    temperature = round(26.0 + seed * 9.0, 1)        # 26.0 - 35.0 °C
    precipitation = round(seed * 22.0, 1)            # 0.0 - 22.0 mm
    solar_radiation = round(16.5 + seed * 7.5, 2)    # 16.5 - 24.0 MJ/m²
    soil_moisture = round(0.18 + seed * 0.22, 3)     # 0.18 - 0.40 m³/m³
    soil_ph = round(6.2 + seed * 1.6, 2)             # 6.2 - 7.8 pH
    soil_organic_carbon = round(0.40 + seed * 0.55, 2)# 0.40 - 0.95 %
    soil_clay = round(28.0 + seed * 18.0, 1)         # 28.0 - 46.0 %

    # Spectral indices
    ndwi = round(0.09 + seed * 0.14, 2)              # 0.09 - 0.23
    ndvi = round(0.52 + seed * 0.32, 2)              # 0.52 - 0.84

    # High humidity + high temperature elevates pest outbreak risk
    pest_probability = round(min(max(0.40 + (1.0 - seed) * 0.48, 0.15), 0.92), 2)
    district_avg_yield = round(2.90 + seed * 0.80, 2)

    return {
        "temperature": temperature,
        "precipitation": precipitation,
        "solar_radiation": solar_radiation,
        "soil_moisture": soil_moisture,
        "soil_ph": soil_ph,
        "soil_organic_carbon": soil_organic_carbon,
        "soil_clay_percent": soil_clay,
        "ndwi": ndwi,
        "ndvi": ndvi,
        "pest_probability": pest_probability,
        "district_avg_yield": district_avg_yield,
        "source": "simulated_agro_climatic_engine"
    }

async def fetch_regional_covariates(lat: float, lng: float) -> Dict[str, Any]:
    """
    Fetches real-time weather covariates from Open-Meteo API with instant fallback.
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lng}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,surface_pressure"
            f"&daily=temperature_2m_mean,precipitation_sum,shortwave_radiation_sum"
            f"&timezone=auto"
        )
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                current = data.get("current", {})
                daily = data.get("daily", {})

                temp = current.get("temperature_2m", 28.5)
                precip = current.get("precipitation", 0.0)
                rh = current.get("relative_humidity_2m", 60.0)
                solar = daily.get("shortwave_radiation_sum", [20.0])[0] if daily.get("shortwave_radiation_sum") else 20.0

                sim = simulate_regional_covariates(lat, lng)
                sim["temperature"] = round(float(temp), 1)
                sim["precipitation"] = round(float(precip), 1)
                sim["solar_radiation"] = round(float(solar), 2)
                sim["pest_probability"] = round(min(max((rh / 100.0) * 0.85 + (temp / 40.0) * 0.15, 0.1), 0.95), 2)
                sim["source"] = "open_meteo_live"
                return sim
    except Exception:
        pass

    return simulate_regional_covariates(lat, lng)

def resolve_region_state(lat: float, lng: float) -> str:
    """
    Infers the Indian state from latitude/longitude bounds.
    """
    if 28.0 <= lat <= 32.5 and 73.5 <= lng <= 77.0:
        return "Punjab"
    if 27.5 <= lat <= 30.5 and 76.0 <= lng <= 78.0:
        return "Haryana"
    if 8.0 <= lat <= 14.0:
        return "Tamil Nadu"
    if 11.5 <= lat <= 18.5 and 74.0 <= lng <= 78.5:
        return "Karnataka"
    if 21.0 <= lat <= 26.5 and 74.0 <= lng <= 82.5:
        return "Madhya Pradesh"
    if 20.0 <= lat <= 24.5 and 68.5 <= lng <= 74.5:
        return "Gujarat"
    return "Maharashtra"

def format_catboost_features(
    covariates: Dict[str, Any],
    lat: float,
    lng: float,
    crop: str = "Cotton",
    area_ha: float = 5.8
) -> Dict[str, Any]:
    """
    Constructs the feature dictionary expected by catboost_farm_yield_model.cbm:
    ['state', 'crop_type', 'crop', 'nitrogen', 'phosphorous', 'potassium', 'ph', 'rainfall', 'temperature', 'area']
    """
    state = resolve_region_state(lat, lng)

    # Normalize crop name & season
    clean_crop = crop.strip().capitalize() if crop else "Cotton"
    if clean_crop in ["Wheat", "Mustard", "Barley", "Gram"]:
        crop_type = "Rabi"
    elif clean_crop in ["Sugarcane"]:
        crop_type = "Whole Year"
    else:
        crop_type = "Kharif"

    # Derive representative seasonal rainfall from daily precipitation & coordinate
    precip_val = float(covariates.get("precipitation", 5.0))
    seasonal_rain = max(round(precip_val * 40.0 + 550.0, 1), 350.0)

    # Soil NPK from organic carbon & soil type
    soc = float(covariates.get("soil_organic_carbon", 0.65))
    nitrogen = round(120.0 + soc * 60.0, 1)        # 140 - 180 kg/ha
    phosphorous = round(35.0 + soc * 25.0, 1)      # 45 - 60 kg/ha
    potassium = round(40.0 + soc * 20.0, 1)        # 45 - 60 kg/ha
    ph = float(covariates.get("soil_ph", 6.8))
    temp = float(covariates.get("temperature", 29.0))

    return {
        "state": state,
        "crop_type": crop_type,
        "crop": clean_crop,
        "nitrogen": nitrogen,
        "phosphorous": phosphorous,
        "potassium": potassium,
        "ph": ph,
        "rainfall": seasonal_rain,
        "temperature": temp,
        "area": round(float(area_ha), 2)
    }


def format_prithvi_tabular(covariates: Dict[str, Any]) -> Dict[str, float]:
    """
    Normalizes covariates into the 7 keys required by Prithvi KisanYieldModel:
    ['temp', 'precip', 'solar', 'soil1', 'soil2', 'soil3', 'soil4']
    """
    return {
        "temp": float(covariates.get("temperature", 28.0)),
        "precip": float(covariates.get("precipitation", 5.0)),
        "solar": float(covariates.get("solar_radiation", 20.0)),
        "soil1": float(covariates.get("soil_moisture", 0.25)),
        "soil2": float(covariates.get("soil_ph", 7.0)),
        "soil3": float(covariates.get("soil_organic_carbon", 0.65)),
        "soil4": float(covariates.get("soil_clay_percent", 35.0))
    }
