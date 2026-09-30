import os
import math
import logging
import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field
import httpx
import rasterio
from rasterio.warp import transform

# Configure GDAL environment for optimized Cloud-Optimized GeoTIFF (COG) range reads
os.environ["GDAL_DISABLE_READDIR_ON_OPEN"] = "EMPTY_DIR"
os.environ["AWS_NO_SIGN_REQUEST"] = "YES"
os.environ["CPL_VSIL_CURL_ALLOWED_EXTENSIONS"] = ".tif"
os.environ["VSI_CACHE"] = "TRUE"
os.environ["GDAL_HTTP_TIMEOUT"] = "20"

logger = logging.getLogger("satellite_service")

class SatelliteServiceError(Exception):
    """Raised when Sentinel-2 satellite data cannot be retrieved, processed, or is cloud covered."""
    pass

class SatelliteObservation(BaseModel):
    ndvi: float = Field(..., description="Normalized Difference Vegetation Index (B8, B4)")
    ndre: float = Field(..., description="Normalized Difference Red Edge Index (B8A, B5)")
    ndwi: float = Field(..., description="Normalized Difference Water Index (B8, B11)")
    ndvi_change_7d: float = Field(..., description="7-day change in NDVI")
    ndvi_change_14d: float = Field(..., description="14-day change in NDVI")
    acquisition_date: str = Field(..., description="Acquisition date (YYYY-MM-DD)")
    cloud_cover: Optional[float] = Field(default=None, description="Cloud cover percentage")
    source: str = Field(default="Copernicus Sentinel-2 L2A (Earth Search STAC)", description="Source provider")
    historical_7d_date: Optional[str] = Field(default=None, description="Actual date of 7-day comparison observation")
    historical_14d_date: Optional[str] = Field(default=None, description="Actual date of 14-day comparison observation")

def safe_normalized_difference(b1: float, b2: float) -> float:
    """
    Calculates (b1 - b2) / (b1 + b2) safely guarding against division by zero,
    NaN, and non-finite values. Constrains result to [-1.0, 1.0].
    """
    if math.isnan(b1) or math.isnan(b2) or math.isinf(b1) or math.isinf(b2):
        return 0.0
    denom = b1 + b2
    if abs(denom) < 1e-7:
        return 0.0
    val = (b1 - b2) / denom
    if math.isnan(val) or math.isinf(val):
        return 0.0
    return max(-1.0, min(1.0, float(val)))

BAND_ASSET_KEYS = {
    "B4": ["red", "b04", "B04", "B4"],
    "B5": ["rededge1", "b05", "B05", "B5"],
    "B8": ["nir", "b08", "B08", "B8"],
    "B8A": ["nir08", "b8a", "B8A", "b08a", "B08A"],
    "B11": ["swir16", "b11", "B11"],
}

def _get_band_url(assets: Dict[str, Any], band_name: str) -> Optional[str]:
    candidate_keys = BAND_ASSET_KEYS.get(band_name, [])
    for k in candidate_keys:
        if k in assets:
            return assets[k].get("href")
    for k, v in assets.items():
        if band_name.lower() in k.lower():
            return v.get("href")
    return None

def _sample_pixel_from_cog(cog_url: str, lon: float, lat: float) -> Optional[float]:
    """
    Opens remote Sentinel-2 COG via windowed range read and samples the exact pixel.
    """
    try:
        with rasterio.open(cog_url) as src:
            xs, ys = transform("EPSG:4326", src.crs, [lon], [lat])
            x, y = xs[0], ys[0]
            bounds = src.bounds
            if not (bounds.left <= x <= bounds.right and bounds.bottom <= y <= bounds.top):
                return None
            row, col = src.index(x, y)
            window = rasterio.windows.Window(col, row, 1, 1)
            data = src.read(1, window=window)
            return float(data[0, 0])
    except Exception as e:
        logger.warning(f"Error sampling COG pixel from {cog_url}: {str(e)}")
        return None

def _extract_scene_indices_sync(item: Dict[str, Any], lon: float, lat: float) -> Optional[Dict[str, Any]]:
    """
    Extracts all 5 bands from a Sentinel-2 STAC item and computes genuine NDVI, NDRE, NDWI.
    """
    assets = item.get("assets", {})
    band_urls = {
        band: _get_band_url(assets, band)
        for band in ["B4", "B5", "B8", "B8A", "B11"]
    }
    
    if any(url is None for url in band_urls.values()):
        return None

    raw_vals = {}
    for band, url in band_urls.items():
        val = _sample_pixel_from_cog(url, lon, lat)
        if val is None or math.isnan(val) or val <= 0:
            return None
        raw_vals[band] = val

    # Sentinel-2 L2A BOA scale factor: DN / 10000.0 = Surface Reflectance
    b4 = raw_vals["B4"] / 10000.0
    b5 = raw_vals["B5"] / 10000.0
    b8 = raw_vals["B8"] / 10000.0
    b8a = raw_vals["B8A"] / 10000.0
    b11 = raw_vals["B11"] / 10000.0

    ndvi = safe_normalized_difference(b8, b4)
    ndre = safe_normalized_difference(b8a, b5)
    ndwi = safe_normalized_difference(b8, b11)

    return {
        "b4": round(b4, 4),
        "b5": round(b5, 4),
        "b8": round(b8, 4),
        "b8a": round(b8a, 4),
        "b11": round(b11, 4),
        "ndvi": round(ndvi, 4),
        "ndre": round(ndre, 4),
        "ndwi": round(ndwi, 4)
    }

class BaseSatelliteProvider(ABC):
    @abstractmethod
    async def get_vegetation_indices(
        self, latitude: float, longitude: float
    ) -> SatelliteObservation:
        """Retrieves Sentinel-2 vegetation indices and historical changes."""
        pass

class Sentinel2Provider(BaseSatelliteProvider):
    """
    Real Sentinel-2 L2A STAC Provider querying Element84 Earth Search STAC API.
    Constructs a farm Area of Interest (AOI), searches intersecting observations,
    applies cloud masking, extracts genuine COG pixel reflectances, and calculates
    NDVI, NDRE, NDWI and distinct 7d/14d historical changes.
    """
    def __init__(
        self,
        api_url: Optional[str] = None,
        api_key: Optional[str] = None,
        aoi_radius_meters: Optional[float] = None,
        max_cloud_cover: Optional[float] = None,
        history_tolerance_days: Optional[int] = None
    ):
        self.api_url = api_url or os.getenv("SATELLITE_API_URL", "https://earth-search.aws.element84.com/v1")
        self.api_key = api_key or os.getenv("SATELLITE_API_KEY", "")
        self.aoi_radius_meters = float(aoi_radius_meters or os.getenv("SATELLITE_AOI_RADIUS_METERS", 100))
        self.max_cloud_cover = float(max_cloud_cover or os.getenv("SATELLITE_MAX_CLOUD_COVER", 20))
        self.history_tolerance_days = int(history_tolerance_days or os.getenv("SATELLITE_HISTORY_TOLERANCE_DAYS", 4))

    async def get_vegetation_indices(
        self, latitude: float, longitude: float
    ) -> SatelliteObservation:
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            raise SatelliteServiceError(f"Invalid geographical coordinates: lat={latitude}, lon={longitude}")

        deg_offset = max(0.0009, self.aoi_radius_meters / 111320.0)
        bbox = [
            round(longitude - deg_offset, 6),
            round(latitude - deg_offset, 6),
            round(longitude + deg_offset, 6),
            round(latitude + deg_offset, 6)
        ]

        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=35)).strftime("%Y-%m-%dT00:00:00Z")
        end_date = now.strftime("%Y-%m-%dT23:59:59Z")
        collections = ["sentinel-2-c1-l2a", "sentinel-2-l2a"]

        logger.info(
            f"=== STAC SENTINEL-2 REAL SEARCH INITIATED ===\n"
            f"  Target Farm Lat/Lon : ({latitude}, {longitude})\n"
            f"  Search Bbox         : {bbox}\n"
            f"  Datetime Range      : {start_date} to {end_date}\n"
            f"  Collections Queried : {collections}\n"
            f"  Max Cloud Threshold : {self.max_cloud_cover}%"
        )

        search_payload = {
            "bbox": bbox,
            "datetime": f"{start_date}/{end_date}",
            "collections": collections,
            "limit": 30
        }

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["x-api-key"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    f"{self.api_url}/search",
                    json=search_payload,
                    headers=headers
                )
                
                if resp.status_code == 429:
                    raise SatelliteServiceError("Earth Search STAC rate limit reached. Please try again later.")
                
                if resp.status_code not in (200, 201):
                    search_payload["collections"] = ["sentinel-2-c1-l2a"]
                    resp = await client.post(f"{self.api_url}/search", json=search_payload, headers=headers)
                    if resp.status_code not in (200, 201):
                        raise SatelliteServiceError(
                            f"Sentinel-2 STAC search failed with HTTP status {resp.status_code}: {resp.text}"
                        )

                data = resp.json()
                features = data.get("features", [])
                total_before_filter = len(features)
                logger.info(f"STAC Items Returned BEFORE Cloud Filter: {total_before_filter}")

                if not features:
                    raise SatelliteServiceError(
                        f"No Sentinel-2 observations found intersecting farm AOI in the past 35 days."
                    )

                # Filter scenes by cloud cover
                valid_scenes: List[Dict[str, Any]] = []
                for item in features:
                    props = item.get("properties", {})
                    dt_str = props.get("datetime") or props.get("created")
                    if not dt_str:
                        continue
                    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
                    cloud_val = props.get("eo:cloud_cover")
                    cloud_float = float(cloud_val) if cloud_val is not None else 100.0

                    if cloud_float <= self.max_cloud_cover:
                        valid_scenes.append({
                            "item": item,
                            "id": item.get("id", "unknown_id"),
                            "date": dt,
                            "date_str": dt.strftime("%Y-%m-%d"),
                            "cloud_cover": round(cloud_float, 2)
                        })

                if not valid_scenes:
                    raise SatelliteServiceError(
                        f"No cloud-free Sentinel-2 observations (<= {self.max_cloud_cover}% clouds) found for farm AOI in the past 35 days."
                    )

                # Sort scenes descending by acquisition date (newest first)
                valid_scenes.sort(key=lambda x: x["date"], reverse=True)

                # Process latest scene to extract real raster pixel reflectances
                primary_indices = None
                primary_scene = None
                for candidate in valid_scenes:
                    indices = await asyncio.to_thread(_extract_scene_indices_sync, candidate["item"], longitude, latitude)
                    if indices is not None:
                        primary_indices = indices
                        primary_scene = candidate
                        break

                if primary_scene is None or primary_indices is None:
                    raise SatelliteServiceError("Failed to extract valid raster pixels from clear Sentinel-2 scenes for farm AOI.")

                latest_date = primary_scene["date"].date()
                latest_ndvi = primary_indices["ndvi"]

                logger.info(
                    f"Selected Primary Scene: {primary_scene['id']} | Date: {primary_scene['date_str']} | Cloud%: {primary_scene['cloud_cover']}%\n"
                    f"  Extracted Indices -> NDVI: {primary_indices['ndvi']:.4f}, NDRE: {primary_indices['ndre']:.4f}, NDWI: {primary_indices['ndwi']:.4f}"
                )

                # Explicit Historical Target Dates
                target_7d = latest_date - timedelta(days=7)
                target_14d = latest_date - timedelta(days=14)

                # Filter remaining historical scenes (must be strictly earlier than primary scene date)
                hist_candidates = [s for s in valid_scenes if s["id"] != primary_scene["id"] and s["date"].date() < latest_date]

                # Rank historical candidates independently for 7d and 14d targets within tolerance
                ranked_7d = []
                ranked_14d = []
                for s in hist_candidates:
                    s_date = s["date"].date()
                    diff_7d = abs((s_date - target_7d).days)
                    diff_14d = abs((s_date - target_14d).days)
                    if diff_7d <= self.history_tolerance_days:
                        ranked_7d.append((diff_7d, s))
                    if diff_14d <= (self.history_tolerance_days + 1):
                        ranked_14d.append((diff_14d, s))

                ranked_7d.sort(key=lambda x: x[0])
                ranked_14d.sort(key=lambda x: x[0])

                # Select DISTINCT historical scenes for 7d and 14d
                best_7d = None
                best_14d = None

                if ranked_7d and ranked_14d:
                    top_7d = ranked_7d[0][1]
                    top_14d = ranked_14d[0][1]

                    if top_7d["id"] != top_14d["id"]:
                        best_7d = top_7d
                        best_14d = top_14d
                    else:
                        # Conflict: same closest scene. Assign to the target date it is closer to.
                        diff_to_7d = ranked_7d[0][0]
                        diff_to_14d = ranked_14d[0][0]

                        if diff_to_7d <= diff_to_14d:
                            best_7d = top_7d
                            # Find 2nd best candidate for 14d
                            next_14d = [s for d, s in ranked_14d if s["id"] != best_7d["id"]]
                            best_14d = next_14d[0] if next_14d else None
                        else:
                            best_14d = top_14d
                            # Find 2nd best candidate for 7d
                            next_7d = [s for d, s in ranked_7d if s["id"] != best_14d["id"]]
                            best_7d = next_7d[0] if next_7d else None
                elif ranked_7d:
                    best_7d = ranked_7d[0][1]
                elif ranked_14d:
                    best_14d = ranked_14d[0][1]

                # Extract pixel indices for selected distinct historical scenes
                indices_7d = None
                indices_14d = None
                if best_7d is not None:
                    indices_7d = await asyncio.to_thread(_extract_scene_indices_sync, best_7d["item"], longitude, latitude)
                if best_14d is not None:
                    indices_14d = await asyncio.to_thread(_extract_scene_indices_sync, best_14d["item"], longitude, latitude)

                # Compute NDVI differences
                ndvi_change_7d = round(latest_ndvi - indices_7d["ndvi"], 4) if indices_7d else 0.0
                ndvi_change_14d = round(latest_ndvi - indices_14d["ndvi"], 4) if indices_14d else 0.0

                logger.info(
                    f"Historical 7d Scene : {best_7d['date_str'] if best_7d else 'None'} -> 7d NDVI Change: {ndvi_change_7d:+.4f}\n"
                    f"Historical 14d Scene: {best_14d['date_str'] if best_14d else 'None'} -> 14d NDVI Change: {ndvi_change_14d:+.4f}"
                )

                return SatelliteObservation(
                    ndvi=primary_indices["ndvi"],
                    ndre=primary_indices["ndre"],
                    ndwi=primary_indices["ndwi"],
                    ndvi_change_7d=ndvi_change_7d,
                    ndvi_change_14d=ndvi_change_14d,
                    acquisition_date=primary_scene["date_str"],
                    cloud_cover=primary_scene["cloud_cover"],
                    source="Copernicus Sentinel-2 L2A (Earth Search STAC)",
                    historical_7d_date=best_7d["date_str"] if best_7d else None,
                    historical_14d_date=best_14d["date_str"] if best_14d else None
                )

        except httpx.TimeoutException:
            raise SatelliteServiceError("Sentinel-2 Earth Search STAC service timed out.")
        except httpx.RequestError as e:
            raise SatelliteServiceError(f"Network error querying Sentinel-2 service: {str(e)}")
        except Exception as e:
            if isinstance(e, SatelliteServiceError):
                raise
            raise SatelliteServiceError(f"Failed to retrieve Sentinel-2 data: {str(e)}")


class MockSatelliteProvider(BaseSatelliteProvider):
    """
    Mock Satellite Provider for isolated testing and development environments.
    """
    async def get_vegetation_indices(
        self, latitude: float, longitude: float
    ) -> SatelliteObservation:
        b4, b8, b5, b8a, b11 = 0.072, 0.518, 0.125, 0.476, 0.162
        ndvi_val = round(0.51 + ((abs(latitude + longitude) % 5) * 0.05), 3)
        ndre_val = round(0.35 + ((abs(latitude) % 4) * 0.04), 3)
        ndwi_val = round(0.32 + ((abs(longitude) % 3) * 0.04), 3)
        
        now = datetime.now(timezone.utc)
        acq_date = (now - timedelta(days=2)).strftime("%Y-%m-%d")
        
        return SatelliteObservation(
            ndvi=float(ndvi_val),
            ndre=float(ndre_val),
            ndwi=float(ndwi_val),
            ndvi_change_7d=-0.015,
            ndvi_change_14d=-0.028,
            acquisition_date=acq_date,
            cloud_cover=4.2,
            source="Mock Satellite Provider (Development Mode)",
            historical_7d_date=(now - timedelta(days=9)).strftime("%Y-%m-%d"),
            historical_14d_date=(now - timedelta(days=16)).strftime("%Y-%m-%d")
        )


class SatelliteService:
    def __init__(self, mode: Optional[str] = None):
        self.mode = mode or os.getenv("SATELLITE_MODE", "real").lower()
        if self.mode == "real":
            self.provider: BaseSatelliteProvider = Sentinel2Provider()
        elif self.mode == "mock":
            self.provider = MockSatelliteProvider()
        else:
            raise ValueError(f"Unknown SATELLITE_MODE: '{self.mode}'. Expected 'real' or 'mock'.")

    async def get_indices(self, latitude: float, longitude: float) -> SatelliteObservation:
        return await self.provider.get_vegetation_indices(latitude, longitude)
