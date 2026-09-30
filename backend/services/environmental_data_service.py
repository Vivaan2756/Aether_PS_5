import math
import asyncio
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

from backend.services.weather_service import WeatherService, WeatherData, WeatherServiceError
from backend.services.satellite_service import SatelliteService, SatelliteObservation, SatelliteServiceError
from backend.services.soil_service import SoilService, SoilData, SoilServiceError

logger = logging.getLogger("environmental_data_service")

class EnvironmentalDataUnavailable(Exception):
    """Raised when any of the required 14 environmental features are unavailable."""
    def __init__(self, missing_features: List[str]):
        super().__init__(f"Required environmental feature(s) unavailable: {missing_features}")
        self.missing_features = missing_features

class EnvironmentalDataResult(BaseModel):
    # Weather parameters (6)
    temperature: float = Field(..., description="Current temperature in °C")
    temperature_max: float = Field(..., description="Daily maximum temperature in °C")
    temperature_min: float = Field(..., description="Daily minimum temperature in °C")
    humidity: float = Field(..., description="Relative humidity in %")
    rainfall: float = Field(..., description="Precipitation in mm")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    
    # Satellite vegetation indices (5)
    ndvi: float = Field(..., description="Normalized Difference Vegetation Index (B8, B4)")
    ndre: float = Field(..., description="Normalized Difference Red Edge Index (B8A, B5)")
    ndwi: float = Field(..., description="Normalized Difference Water Index (B8, B11)")
    ndvi_change_7d: float = Field(..., description="7-day change in NDVI")
    ndvi_change_14d: float = Field(..., description="14-day change in NDVI")
    
    # Soil parameters (3)
    soil_ph: float = Field(..., description="Soil pH in topsoil (0-5cm)")
    soil_nitrogen: float = Field(..., description="Soil Nitrogen content in g/kg (0-5cm)")
    soil_moisture: float = Field(..., description="Topsoil rootzone moisture percentage (0-100%)")
    
    # Metadata & Data Sources
    data_sources: Dict[str, Any] = Field(default_factory=dict)

def validate_environmental_data(data: Any) -> bool:
    """
    Strict validation ensuring all 14 environmental features exist, are numeric,
    and are not None, NaN, null, or infinite.
    """
    missing: List[str] = []
    required = [
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
    ]

    for feature in required:
        val = getattr(data, feature, None) if not isinstance(data, dict) else data.get(feature)
        if val is None:
            missing.append(feature)
        elif isinstance(val, (float, int)):
            if math.isnan(val) or math.isinf(val):
                missing.append(feature)
        else:
            missing.append(feature)

    if missing:
        raise EnvironmentalDataUnavailable(missing)

    return True

class EnvironmentalDataService:
    def __init__(
        self,
        weather_service: Optional[WeatherService] = None,
        satellite_service: Optional[SatelliteService] = None,
        soil_service: Optional[SoilService] = None
    ):
        self.weather_service = weather_service or WeatherService()
        self.satellite_service = satellite_service or SatelliteService()
        self.soil_service = soil_service or SoilService()

    async def fetch_all_environmental_data(
        self, latitude: float, longitude: float
    ) -> EnvironmentalDataResult:
        """
        Concurrently queries Open-Meteo Weather, Sentinel-2 STAC, and Soil services.
        """
        logger.info(f"Concurrently fetching live environmental features for ({latitude}, {longitude})...")

        results = await asyncio.gather(
            self.weather_service.get_weather(latitude, longitude),
            self.satellite_service.get_indices(latitude, longitude),
            self.soil_service.get_soil_properties(latitude, longitude),
            return_exceptions=True
        )

        weather_res, satellite_res, soil_res = results

        # Check for service errors
        if isinstance(weather_res, Exception):
            logger.error(f"Weather retrieval failed: {str(weather_res)}")
            raise WeatherServiceError(f"Weather Data Error: {str(weather_res)}")

        if isinstance(satellite_res, Exception):
            logger.error(f"Satellite retrieval failed: {str(satellite_res)}")
            raise SatelliteServiceError(f"Satellite Data Error: {str(satellite_res)}")

        if isinstance(soil_res, Exception):
            logger.error(f"Soil retrieval failed: {str(soil_res)}")
            missing = getattr(soil_res, "missing_features", [])
            raise SoilServiceError(f"Soil Data Error: {str(soil_res)}", missing)

        weather_data: WeatherData = weather_res
        sat_data: SatelliteObservation = satellite_res
        soil_data: SoilData = soil_res

        # Validate values before packaging
        raw_result = EnvironmentalDataResult(
            temperature=weather_data.temperature,
            temperature_max=weather_data.temperature_max,
            temperature_min=weather_data.temperature_min,
            humidity=weather_data.humidity,
            rainfall=weather_data.rainfall,
            wind_speed=weather_data.wind_speed,
            ndvi=sat_data.ndvi,
            ndre=sat_data.ndre,
            ndwi=sat_data.ndwi,
            ndvi_change_7d=sat_data.ndvi_change_7d,
            ndvi_change_14d=sat_data.ndvi_change_14d,
            soil_ph=soil_data.soil_ph,
            soil_nitrogen=soil_data.soil_nitrogen,
            soil_moisture=soil_data.soil_moisture,
            data_sources={}
        )

        # Execute strict validation
        validate_environmental_data(raw_result)

        # Precise data source metadata reflecting real vs mock sources
        is_sat_mock = "mock" in sat_data.source.lower()
        is_soil_mock = soil_data.status == "mock" or "mock" in soil_data.source.lower()

        data_sources = {
            "weather": {
                "provider": "Open-Meteo",
                "status": "success",
                "timestamp": weather_data.timestamp
            },
            "satellite": {
                "provider": "Sentinel-2" if not is_sat_mock else "Mock Satellite Provider",
                "provider_api": "Earth Search STAC" if not is_sat_mock else "Mock STAC API",
                "status": "mock" if is_sat_mock else "success",
                "acquisition_date": sat_data.acquisition_date,
                "cloud_cover": sat_data.cloud_cover,
                "historical_7d_date": sat_data.historical_7d_date,
                "historical_14d_date": sat_data.historical_14d_date
            },
            "soil_ph": {
                "provider": "SoilGrids" if not is_soil_mock else "Mock Soil Provider",
                "source": soil_data.soil_ph_source,
                "depth": soil_data.depth,
                "status": soil_data.status
            },
            "soil_nitrogen": {
                "provider": "SoilGrids" if not is_soil_mock else "Mock Soil Provider",
                "source": soil_data.soil_nitrogen_source,
                "depth": soil_data.depth,
                "status": soil_data.status
            },
            "soil_moisture": {
                "provider": "Open-Meteo" if not is_soil_mock else "Mock Soil Moisture Provider",
                "source": soil_data.soil_moisture_source,
                "status": soil_data.status,
                "depth": "0-7cm",
                "data_type": "modeled" if not is_soil_mock else "mock"
            }
        }

        raw_result.data_sources = data_sources
        return raw_result
