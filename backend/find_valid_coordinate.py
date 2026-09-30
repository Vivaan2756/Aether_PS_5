import asyncio
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.soil_service import SoilGridsRestProvider, SoilServiceError
from backend.services.satellite_service import Sentinel2Provider, SatelliteServiceError
from backend.services.weather_service import WeatherService, WeatherServiceError

CANDIDATES = [
    {"name": "Punjab - Ludhiana (Urban / SoilGrids Null)", "lat": 30.901, "lon": 75.857},
    {"name": "Maharashtra - Known Rural Coordinate (20.0, 74.0)", "lat": 20.0, "lon": 74.0},
    {"name": "Maharashtra - Aurangabad Rural Agri Belt", "lat": 19.85, "lon": 75.30},
    {"name": "Maharashtra - Ahmednagar Rural Farmlands", "lat": 19.10, "lon": 74.70},
]

async def evaluate_candidate(candidate, soil_provider, sat_provider):
    lat = candidate["lat"]
    lon = candidate["lon"]
    name = candidate["name"]
    
    # 1. Soil Telemetry
    sg_ph = None
    sg_nit = None
    sg_status = "unavailable"
    soil_moisture = None
    
    try:
        soil_data = await soil_provider.get_soil_data(lat, lon)
        sg_ph = soil_data.soil_ph
        sg_nit = soil_data.soil_nitrogen
        soil_moisture = soil_data.soil_moisture
        sg_status = "available"
    except SoilServiceError as e:
        sg_status = f"error: {str(e)}"
    except Exception as e:
        sg_status = f"failed: {str(e)}"

    # 2. Satellite Telemetry
    sat_scene = None
    cloud_cover = None
    ndvi = None
    ndre = None
    ndwi = None
    ndvi_change_7d = None
    ndvi_change_14d = None
    sat_status = "unavailable"

    try:
        sat_data = await sat_provider.get_vegetation_indices(lat, lon)
        sat_scene = sat_data.acquisition_date
        cloud_cover = sat_data.cloud_cover
        ndvi = sat_data.ndvi
        ndre = sat_data.ndre
        ndwi = sat_data.ndwi
        ndvi_change_7d = sat_data.ndvi_change_7d
        ndvi_change_14d = sat_data.ndvi_change_14d
        sat_status = "available"
    except SatelliteServiceError as e:
        sat_status = f"error: {str(e)}"
    except Exception as e:
        sat_status = f"failed: {str(e)}"

    # Verification of completeness
    is_complete = (
        sg_ph is not None
        and sg_nit is not None
        and soil_moisture is not None
        and ndvi is not None
        and ndre is not None
        and ndwi is not None
        and ndvi_change_7d is not None
        and ndvi_change_14d is not None
    )

    print(f"Coordinate: ({lat}, {lon})")
    print(f"SoilGrids pH: {sg_ph}")
    print(f"SoilGrids nitrogen: {sg_nit}")
    print(f"SoilGrids status: {sg_status}")
    print(f"Soil moisture: {soil_moisture}%" if soil_moisture is not None else "Soil moisture: None")
    print(f"Sentinel-2 scene: {sat_scene}")
    print(f"Cloud cover: {cloud_cover}%" if cloud_cover is not None else "Cloud cover: None")
    print(f"NDVI: {ndvi}")
    print(f"NDRE: {ndre}")
    print(f"NDWI: {ndwi}")
    print(f"7-day NDVI change: {ndvi_change_7d}")
    print(f"14-day NDVI change: {ndvi_change_14d}")
    print(f"COMPLETE REAL TELEMETRY: {'YES' if is_complete else 'NO'}")
    print()

    return is_complete, candidate

async def main():
    soil_provider = SoilGridsRestProvider()
    sat_provider = Sentinel2Provider(max_cloud_cover=20.0, aoi_radius_meters=100.0)

    recommended = None

    for candidate in CANDIDATES:
        is_complete, cand = await evaluate_candidate(candidate, soil_provider, sat_provider)
        if is_complete and recommended is None:
            recommended = cand
            break

    if recommended:
        print("==================================================")
        print("FINAL RECOMMENDED TEST COORDINATE:")
        print(f"Location:  {recommended['name']}")
        print(f"Latitude:  {recommended['lat']}")
        print(f"Longitude: {recommended['lon']}")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
