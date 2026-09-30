import os
import logging
from typing import Optional
from pydantic import BaseModel, Field
import httpx

logger = logging.getLogger("weather_service")

class WeatherServiceError(Exception):
    """Raised when weather data cannot be retrieved or parsed."""
    pass

class WeatherData(BaseModel):
    temperature: float = Field(..., description="Current temperature in °C")
    temperature_max: float = Field(..., description="Daily maximum temperature in °C")
    temperature_min: float = Field(..., description="Daily minimum temperature in °C")
    humidity: float = Field(..., description="Relative humidity in %")
    rainfall: float = Field(..., description="Precipitation in mm")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    source: str = Field(default="Open-Meteo", description="Source of meteorological observation")
    timestamp: Optional[str] = Field(default=None, description="ISO timestamp of weather observation")

class WeatherService:
    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None):
        self.api_url = api_url or os.getenv("WEATHER_API_URL", "https://api.open-meteo.com/v1/forecast")
        self.api_key = api_key or os.getenv("WEATHER_API_KEY", "")

    async def get_weather(self, latitude: float, longitude: float) -> WeatherData:
        """
        Retrieves real-time and daily weather data from Open-Meteo without authentication.
        """
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            raise WeatherServiceError(f"Invalid geographical coordinates: lat={latitude}, lon={longitude}")

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m"],
            "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "temperature_unit": "celsius",
            "wind_speed_unit": "kmh",
            "precipitation_unit": "mm",
            "timezone": "auto"
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(self.api_url, params=params)
                
                if response.status_code == 429:
                    raise WeatherServiceError("Open-Meteo weather service rate limit exceeded. Please retry later.")
                if response.status_code != 200:
                    raise WeatherServiceError(f"Open-Meteo API returned error status {response.status_code}: {response.text}")
                
                data = response.json()
        except httpx.TimeoutException:
            raise WeatherServiceError("Open-Meteo weather service timed out.")
        except httpx.RequestError as e:
            raise WeatherServiceError(f"Network error connecting to Open-Meteo weather service: {str(e)}")
        except Exception as e:
            if isinstance(e, WeatherServiceError):
                raise
            raise WeatherServiceError(f"Failed to fetch weather data: {str(e)}")

        current = data.get("current", {})
        daily = data.get("daily", {})
        
        temp = current.get("temperature_2m")
        humidity = current.get("relative_humidity_2m")
        rain = current.get("precipitation", 0.0)
        wind = current.get("wind_speed_10m")
        time_str = current.get("time")

        max_temps = daily.get("temperature_2m_max", [])
        min_temps = daily.get("temperature_2m_min", [])
        
        temp_max = max_temps[0] if max_temps else temp
        temp_min = min_temps[0] if min_temps else temp

        # Strict validation: do not use random or fallback values
        if temp is None or humidity is None or wind is None or temp_max is None or temp_min is None:
            raise WeatherServiceError("Open-Meteo response is missing one or more required meteorological fields.")

        return WeatherData(
            temperature=float(temp),
            temperature_max=float(temp_max),
            temperature_min=float(temp_min),
            humidity=float(humidity),
            rainfall=float(rain),
            wind_speed=float(wind),
            source="Open-Meteo",
            timestamp=time_str
        )
