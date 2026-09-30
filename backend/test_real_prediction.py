import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.environmental_data_service import EnvironmentalDataService
from backend.services.pest_feature_builder import PestFeatureBuilder
from backend.models.pest_model_loader import PestRiskModel

async def test_full_pipeline():
    lat = 29.0588
    lon = 76.0856
    crop = "Wheat"
    crop_stage = "Vegetative"
    previous_pest_incidence = 1

    print(f"Testing Full 19-Feature Real Pipeline for ({lat}, {lon})...")
    
    env_service = EnvironmentalDataService()
    env_data = await env_service.fetch_all_environmental_data(lat, lon)
    
    print("\nEnvironmental Telemetry Aggregated Successfully:")
    print(f"  Weather: Temp={env_data.temperature}°C, Rain={env_data.rainfall}mm, Hum={env_data.humidity}%")
    print(f"  Soil: pH={env_data.soil_ph}, N={env_data.soil_nitrogen} g/kg, Moisture={env_data.soil_moisture}%")
    print(f"  Satellite: NDVI={env_data.ndvi}, NDRE={env_data.ndre}, NDWI={env_data.ndwi}, 7d_change={env_data.ndvi_change_7d}, 14d_change={env_data.ndvi_change_14d}")
    print(f"  Sources: {env_data.data_sources}")

    model = PestRiskModel()
    builder = PestFeatureBuilder(model)
    df, raw_dict = builder.build_features(
        latitude=lat,
        longitude=lon,
        crop=crop,
        crop_stage=crop_stage,
        previous_pest_incidence=previous_pest_incidence,
        env_data=env_data
    )
    print("\n19 Features DataFrame Constructed:")
    print(df.to_dict(orient="records")[0])

    probability, risk_level, alert = model.predict(df)
    factors = model.explain(df, raw_dict)
    print("\nPrediction Inference Result:")
    print(f"  Risk Level:          {risk_level}")
    print(f"  Outbreak Prob:       {probability:.4f}")
    print(f"  Alert:               {alert}")
    print(f"  Top Contributing:    {factors[:3]}")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
