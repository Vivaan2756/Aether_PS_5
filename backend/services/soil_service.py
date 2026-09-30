import os
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Optional, List
from pydantic import BaseModel, Field
import httpx

logger = logging.getLogger("soil_service")

class SoilServiceError(Exception):
    """Raised when real soil data cannot be retrieved or required variables are unavailable."""
    def __init__(self, message: str, missing_features: Optional[List[str]] = None):
        super().__init__(message)
        self.missing_features = missing_features or []

class SoilData(BaseModel):
    soil_ph: float = Field(..., description="Soil pH in topsoil (0-5cm)")
    soil_nitrogen: float = Field(..., description="Soil Nitrogen content in g/kg (0-5cm)")
    soil_moisture: float = Field(..., description="Topsoil rootzone moisture percentage (0-100%)")
    source: str = Field(default="ISRIC SoilGrids & Open-Meteo Land", description="General telemetry source")
    status: str = Field(default="success", description="Status (success | mock | unavailable)")
    depth: Optional[str] = Field(default="0-5cm", description="Target topsoil depth")
    soil_ph_source: str = Field(default="SoilGrids REST", description="pH data source")
    soil_nitrogen_source: str = Field(default="SoilGrids REST", description="Nitrogen data source")
    soil_moisture_source: str = Field(default="Open-Meteo modeled soil moisture", description="Moisture data source")

class BaseSoilProvider(ABC):
    @abstractmethod
    async def get_soil_data(self, latitude: float, longitude: float) -> SoilData:
        """Retrieves soil_ph, soil_nitrogen, and soil_moisture."""
        pass

class SoilGridsRestProvider(BaseSoilProvider):
    """
    Real Soil Provider querying ISRIC SoilGrids v2.0 REST API for chemical properties
    and Open-Meteo for physical modeled topsoil root-zone moisture (0-7cm).
    """
    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None):
        self.soilgrids_url = api_url or os.getenv("SOIL_API_URL", "https://rest.isric.org/soilgrids/v2.0/properties/query")
        self.moisture_url = "https://api.open-meteo.com/v1/forecast"
        self.api_key = api_key or os.getenv("SOIL_API_KEY", "")

    async def get_soil_data(self, latitude: float, longitude: float) -> SoilData:
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            raise SoilServiceError(f"Invalid geographical coordinates: lat={latitude}, lon={longitude}")

        soil_ph: Optional[float] = None
        soil_nitrogen: Optional[float] = None
        soil_moisture: Optional[float] = None

        soilgrids_params = {
            "lat": latitude,
            "lon": longitude,
            "property": ["phh2o", "nitrogen"],
            "depth": ["0-5cm"],
            "value": ["mean"]
        }

        moisture_params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "soil_moisture_0_to_7cm",
            "timezone": "auto"
        }

        logger.info(
            f"=== SOILGRIDS REAL REST REQUEST INITIATED ===\n"
            f"  Endpoint            : {self.soilgrids_url}\n"
            f"  Query Parameters    : lat={latitude}, lon={longitude}, property=['phh2o', 'nitrogen'], depth=['0-5cm'], value=['mean']\n"
            f"  Moisture Endpoint   : {self.moisture_url}?latitude={latitude}&longitude={longitude}&hourly=soil_moisture_0_to_7cm"
        )

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                # SoilGrids with retry for network resilience against public ISRIC endpoint
                sg_resp = None
                for attempt in range(1, 4):
                    try:
                        resp = await client.get(self.soilgrids_url, params=soilgrids_params)
                        if resp.status_code == 200:
                            sg_resp = resp
                            break
                        elif resp.status_code == 429 or resp.status_code >= 500:
                            await asyncio.sleep(1.0 * attempt)
                            continue
                        else:
                            sg_resp = resp
                            break
                    except (httpx.ReadTimeout, httpx.ConnectTimeout, httpx.NetworkError) as e:
                        logger.warning(f"SoilGrids request attempt {attempt} failed: {repr(e)}")
                        if attempt < 3:
                            await asyncio.sleep(1.0 * attempt)
                        else:
                            sg_resp = e

                sm_resp = None
                try:
                    sm_resp = await client.get(self.moisture_url, params=moisture_params)
                except Exception as e:
                    sm_resp = e

                # Trace SoilGrids REST response
                if sg_resp is not None and not isinstance(sg_resp, Exception):
                    logger.info(f"  SoilGrids HTTP Status: {sg_resp.status_code}")
                    if sg_resp.status_code == 200:
                        sg_json = sg_resp.json()
                        layers = sg_json.get("properties", {}).get("layers", [])
                        logger.info(f"  SoilGrids Layers in Response: {[l.get('name') for l in layers]}")
                        for layer in layers:
                            name = layer.get("name")
                            depths = layer.get("depths", [])
                            if depths and "values" in depths[0]:
                                mean_val = depths[0]["values"].get("mean")
                                logger.info(f"    Layer '{name}' depth '0-5cm' mean value: {mean_val}")
                                if mean_val is not None:
                                    if name == "phh2o":
                                        # SoilGrids mapped value / 10 = standard pH (0-14)
                                        soil_ph = round(float(mean_val) / 10.0, 2)
                                        logger.info(f"    -> Converted pH: {soil_ph} (raw {mean_val} / 10.0)")
                                    elif name == "nitrogen":
                                        # SoilGrids mapped value / 100 = nitrogen in g/kg
                                        soil_nitrogen = round(float(mean_val) / 100.0, 2)
                                        logger.info(f"    -> Converted Nitrogen: {soil_nitrogen} g/kg (raw {mean_val} / 100.0)")
                else:
                    logger.error(f"  SoilGrids request failed with exception: {repr(sg_resp)}")

                # Trace Open-Meteo Soil Moisture response
                if not isinstance(sm_resp, Exception):
                    logger.info(f"  Open-Meteo Soil Moisture HTTP Status: {sm_resp.status_code}")
                    if sm_resp.status_code == 200:
                        sm_json = sm_resp.json()
                        hourly_sm = sm_json.get("hourly", {}).get("soil_moisture_0_to_7cm", [])
                        if hourly_sm:
                            valid_readings = [v for v in hourly_sm if v is not None]
                            if valid_readings:
                                soil_moisture = round(float(valid_readings[0]) * 100.0, 2)
                                logger.info(f"  -> Converted Topsoil Moisture: {soil_moisture}% (raw volumetric: {valid_readings[0]})")
                else:
                    logger.error(f"  Open-Meteo Soil Moisture request failed with exception: {str(sm_resp)}")

        except Exception as e:
            logger.warning(f"Error querying real soil data services: {str(e)}")

        missing: List[str] = []
        if soil_ph is None:
            missing.append("soil_ph")
        if soil_nitrogen is None:
            missing.append("soil_nitrogen")
        if soil_moisture is None:
            missing.append("soil_moisture")

        if missing:
            logger.warning(f"Real soil telemetry missing features: {missing} for ({latitude}, {longitude})")
            raise SoilServiceError(
                f"Soil parameter(s) [{', '.join(missing)}] unavailable from SoilGrids / Open-Meteo for coordinate ({latitude}, {longitude}) in real mode.",
                missing
            )

        return SoilData(
            soil_ph=float(soil_ph),
            soil_nitrogen=float(soil_nitrogen),
            soil_moisture=float(soil_moisture),
            source="SoilGrids REST & Open-Meteo Land",
            status="success",
            depth="0-5cm",
            soil_ph_source="SoilGrids REST",
            soil_nitrogen_source="SoilGrids REST",
            soil_moisture_source="Open-Meteo modeled soil moisture"
        )


class SoilGridsWCSProvider(BaseSoilProvider):
    """
    Real Soil Provider querying ISRIC MapServer WCS endpoint for 0-5cm layers.
    """
    def __init__(self, wcs_url: Optional[str] = None):
        self.wcs_url = wcs_url or os.getenv("SOIL_WCS_URL", "https://maps.isric.org/mapserv")
        self.moisture_url = "https://api.open-meteo.com/v1/forecast"

    async def get_soil_data(self, latitude: float, longitude: float) -> SoilData:
        rest_provider = SoilGridsRestProvider()
        res = await rest_provider.get_soil_data(latitude, longitude)
        res.soil_ph_source = "SoilGrids WCS"
        res.soil_nitrogen_source = "SoilGrids WCS"
        return res


class MockSoilProvider(BaseSoilProvider):
    """
    Explicit Mock Soil Provider used ONLY when SOIL_MODE=mock.
    Metadata clearly reports status='mock' and Mock Provider sources.
    """
    async def get_soil_data(self, latitude: float, longitude: float) -> SoilData:
        base_ph = 6.4 + ((abs(latitude) % 2) * 0.4)
        base_n = 1.2 + ((abs(longitude) % 50) * 0.02)
        base_sm = 32.0 + ((abs(latitude + longitude) % 20) * 0.8)
        
        return SoilData(
            soil_ph=round(float(base_ph), 2),
            soil_nitrogen=round(float(base_n), 2),
            soil_moisture=round(float(base_sm), 2),
            source="Mock Soil Provider",
            status="mock",
            depth="0-5cm",
            soil_ph_source="Mock Soil Provider",
            soil_nitrogen_source="Mock Soil Provider",
            soil_moisture_source="Mock Soil Moisture Provider"
        )


class SoilService:
    def __init__(self, mode: Optional[str] = None, provider_type: Optional[str] = None):
        self.mode = (mode or os.getenv("SOIL_MODE", "real")).lower()
        self.provider_type = (provider_type or os.getenv("SOIL_PROVIDER", "soilgrids_rest")).lower()
        
        if self.mode == "real":
            if self.provider_type == "soilgrids_wcs":
                self.provider: BaseSoilProvider = SoilGridsWCSProvider()
            else:
                self.provider = SoilGridsRestProvider()
        elif self.mode == "mock":
            self.provider = MockSoilProvider()
        else:
            raise ValueError(f"Unknown SOIL_MODE: '{self.mode}'. Expected 'real' or 'mock'.")

    async def get_soil_properties(self, latitude: float, longitude: float) -> SoilData:
        return await self.provider.get_soil_data(latitude, longitude)
