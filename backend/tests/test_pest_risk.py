import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.pest_model_loader import get_pest_model, FEATURES
from backend.services.weather_service import WeatherService, WeatherData
from backend.services.satellite_service import (
    SatelliteService, MockSatelliteProvider, Sentinel2Provider, safe_normalized_difference
)
from backend.services.soil_service import SoilService, MockSoilProvider, SoilGridsRestProvider, SoilGridsWCSProvider
from backend.services.environmental_data_service import (
    EnvironmentalDataResult, validate_environmental_data, EnvironmentalDataUnavailable
)
from backend.services.pest_feature_builder import PestFeatureBuilder, FeatureBuilderError
from backend.services.recommendation_service import RecommendationService

client = TestClient(app)

def test_feature_spec_and_ordering():
    """Verify that FEATURES is exactly length 19 with exact ordered columns."""
    assert len(FEATURES) == 19
    expected = [
        "latitude", "longitude", "crop", "crop_stage", "temperature",
        "temperature_max", "temperature_min", "humidity", "rainfall",
        "wind_speed", "ndvi", "ndre", "ndwi", "ndvi_change_7d",
        "ndvi_change_14d", "soil_ph", "soil_nitrogen", "soil_moisture",
        "previous_pest_incidence"
    ]
    assert FEATURES == expected

def test_satellite_band_formulas():
    """Test safe normalized difference formula."""
    b4, b8 = 0.08, 0.48
    ndvi = safe_normalized_difference(b8, b4)
    assert round(ndvi, 4) == round((0.48 - 0.08) / (0.48 + 0.08), 4)

    b5, b8a = 0.12, 0.42
    ndre = safe_normalized_difference(b8a, b5)
    assert round(ndre, 4) == round((0.42 - 0.12) / (0.42 + 0.12), 4)

    b11 = 0.18
    ndwi = safe_normalized_difference(b8, b11)
    assert round(ndwi, 4) == round((0.48 - 0.18) / (0.48 + 0.18), 4)

    assert safe_normalized_difference(0.0, 0.0) == 0.0
    assert safe_normalized_difference(float("nan"), 0.5) == 0.0

@pytest.mark.asyncio
async def test_weather_service_open_meteo():
    """Test live Open-Meteo weather querying."""
    service = WeatherService()
    weather = await service.get_weather(19.0760, 72.8777)
    assert isinstance(weather, WeatherData)
    assert weather.source == "Open-Meteo"
    assert weather.humidity >= 0.0
    assert weather.temperature_max >= weather.temperature_min

@pytest.mark.asyncio
async def test_soil_providers_mock_and_real():
    """Test Mock and Real soil provider metadata."""
    mock_prov = MockSoilProvider()
    data = await mock_prov.get_soil_data(19.0760, 72.8777)
    assert data.status == "mock"
    assert "Mock" in data.soil_ph_source
    assert "Mock" in data.soil_nitrogen_source
    assert "Mock" in data.soil_moisture_source

    rest_prov = SoilGridsRestProvider()
    assert rest_prov.soilgrids_url is not None

def test_environmental_data_validation():
    """Test strict validate_environmental_data validator."""
    valid_data = EnvironmentalDataResult(
        temperature=28.3,
        temperature_max=32.1,
        temperature_min=24.5,
        humidity=95.1,
        rainfall=12.4,
        wind_speed=10.5,
        ndvi=0.51,
        ndre=0.35,
        ndwi=0.38,
        ndvi_change_7d=-0.015,
        ndvi_change_14d=-0.028,
        soil_ph=6.8,
        soil_nitrogen=1.2,
        soil_moisture=39.8,
        data_sources={}
    )
    assert validate_environmental_data(valid_data) is True

    # Test missing feature raises EnvironmentalDataUnavailable
    with pytest.raises(EnvironmentalDataUnavailable):
        invalid_dict = {"temperature": 25.0} # missing remaining 13 features
        validate_environmental_data(invalid_dict)

def test_feature_builder_validation():
    """Test strict 19-feature builder assertions."""
    model = get_pest_model()
    builder = PestFeatureBuilder(model)

    env = EnvironmentalDataResult(
        temperature=28.3,
        temperature_max=32.1,
        temperature_min=24.5,
        humidity=95.1,
        rainfall=12.4,
        wind_speed=10.5,
        ndvi=0.51,
        ndre=0.35,
        ndwi=0.38,
        ndvi_change_7d=-0.015,
        ndvi_change_14d=-0.028,
        soil_ph=6.8,
        soil_nitrogen=1.2,
        soil_moisture=39.8,
        data_sources={}
    )

    df, raw_dict = builder.build_features(
        latitude=19.0760,
        longitude=72.8777,
        crop="Wheat",
        crop_stage="Vegetative",
        previous_pest_incidence=1,
        env_data=env
    )

    assert df.shape == (1, 19)
    assert list(df.columns) == FEATURES

def test_diagnostics_endpoint():
    """Test development diagnostics endpoint."""
    resp = client.get("/api/pest-risk/diagnostics")
    assert resp.status_code == 200
    data = resp.json()
    assert data["features_count"] == 19
    assert len(data["feature_order"]) == 19

def test_full_predict_mock_mode(monkeypatch):
    """Test full endpoint prediction in explicit mock mode."""
    monkeypatch.setenv("SATELLITE_MODE", "mock")
    monkeypatch.setenv("SOIL_MODE", "mock")

    payload = {
        "latitude": 19.0760,
        "longitude": 72.8777,
        "crop": "Wheat",
        "crop_stage": "Vegetative",
        "previous_pest_incidence": 1
    }

    resp = client.post("/api/pest-risk/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert 0.0 <= data["outbreak_probability"] <= 1.0
    assert len(data["top_factors"]) <= 5
    assert len(data["recommendations"]) > 0
    assert "data_sources" in data
    # Verify mock metadata is explicitly reported as mock
    assert data["data_sources"]["soil_ph"]["status"] == "mock"
    assert data["data_sources"]["satellite"]["status"] == "mock"
