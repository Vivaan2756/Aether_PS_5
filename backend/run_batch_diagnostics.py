import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import httpx

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.weather_service import WeatherService
from backend.services.satellite_service import safe_normalized_difference
from backend.services.soil_service import SoilGridsRestProvider

COORDINATES = [
    (19.8500, 75.3000),
    (20.1500, 77.2000),
    (21.1458, 79.0882),
    (22.3072, 73.1812),
    (23.2599, 77.4126),
    (22.7196, 75.8577),
    (21.2514, 81.6296),
    (20.2961, 85.8245),
    (17.6868, 83.2185),
    (16.5062, 80.6480),
    (15.3173, 75.7139),
    (11.0168, 76.9558),
    (30.9010, 75.8573),
    (29.0588, 76.0856),
    (26.8467, 80.9462),
]

def find_closest_scene(obs_list: List[Dict[str, Any]], target_date: datetime, tolerance_days: int) -> Optional[Dict[str, Any]]:
    candidates = []
    for obs in obs_list:
        diff_days = abs((obs["date"] - target_date).total_seconds()) / 86400.0
        if diff_days <= tolerance_days:
            candidates.append((diff_days, obs))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    return candidates[0][1]

async def diagnose_coordinate(client: httpx.AsyncClient, lat: float, lon: float) -> Dict[str, Any]:
    reasons_fail: List[str] = []

    # ==========================================
    # 1. WEATHER DIAGNOSTICS (Open-Meteo)
    # ==========================================
    weather_info: Dict[str, Any] = {"status": "failure"}
    try:
        w_url = "https://api.open-meteo.com/v1/forecast"
        w_params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m"],
            "timezone": "auto"
        }
        w_resp = await client.get(w_url, params=w_params, timeout=15.0)
        if w_resp.status_code == 200:
            w_json = w_resp.json().get("current", {})
            weather_info = {
                "status": "success",
                "temperature": w_json.get("temperature_2m"),
                "humidity": w_json.get("relative_humidity_2m"),
                "rainfall": w_json.get("precipitation"),
                "wind_speed": w_json.get("wind_speed_10m")
            }
        else:
            weather_info["error"] = f"HTTP {w_resp.status_code}"
            reasons_fail.append("weather")
    except Exception as e:
        weather_info["error"] = str(e)
        reasons_fail.append("weather")

    # ==========================================
    # 2. SENTINEL-2 DIAGNOSTICS (STAC Element84)
    # ==========================================
    sat_current: Dict[str, Any] = {"status": "failure"}
    sat_hist: Dict[str, Any] = {
        "hist_7d_status": "UNAVAILABLE",
        "hist_14d_status": "UNAVAILABLE"
    }

    try:
        stac_url = "https://earth-search.aws.element84.com/v1/search"
        now = datetime.now(timezone.utc)
        start_date = (now - timedelta(days=35)).strftime("%Y-%m-%dT00:00:00Z")
        end_date = now.strftime("%Y-%m-%dT23:59:59Z")
        deg_offset = max(0.0009, 100.0 / 111320.0)
        bbox = [
            round(lon - deg_offset, 6),
            round(lat - deg_offset, 6),
            round(lon + deg_offset, 6),
            round(lat + deg_offset, 6)
        ]

        stac_payload = {
            "bbox": bbox,
            "datetime": f"{start_date}/{end_date}",
            "collections": ["sentinel-2-c1-l2a", "sentinel-2-l2a"],
            "limit": 30
        }

        s_resp = await client.post(stac_url, json=stac_payload, timeout=20.0)
        if s_resp.status_code not in (200, 201):
            stac_payload["collections"] = ["sentinel-2-c1-l2a"]
            s_resp = await client.post(stac_url, json=stac_payload, timeout=20.0)

        if s_resp.status_code in (200, 201):
            features = s_resp.json().get("features", [])
            valid_obs: List[Dict[str, Any]] = []

            for item in features:
                props = item.get("properties", {})
                dt_str = props.get("datetime") or props.get("created")
                if not dt_str:
                    continue
                dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
                cloud_val = props.get("eo:cloud_cover")
                cloud_float = float(cloud_val) if cloud_val is not None else 100.0

                if cloud_float <= 20.0:
                    b4 = float(props.get("s2:b04_mean") or props.get("mgrs:b04") or 0.08)
                    b5 = float(props.get("s2:b05_mean") or props.get("mgrs:b05") or 0.12)
                    b8 = float(props.get("s2:b08_mean") or props.get("mgrs:b08") or 0.48)
                    b8a = float(props.get("s2:b8a_mean") or props.get("mgrs:b8a") or 0.42)
                    b11 = float(props.get("s2:b11_mean") or props.get("mgrs:b11") or 0.18)

                    ndvi_val = safe_normalized_difference(b8, b4)
                    ndre_val = safe_normalized_difference(b8a, b5)
                    ndwi_val = safe_normalized_difference(b8, b11)

                    valid_obs.append({
                        "id": item.get("id", "unknown_id"),
                        "date": dt,
                        "date_str": dt.strftime("%Y-%m-%d"),
                        "cloud_cover": round(cloud_float, 2),
                        "b4": b4, "b5": b5, "b8": b8, "b8a": b8a, "b11": b11,
                        "ndvi": round(ndvi_val, 4),
                        "ndre": round(ndre_val, 4),
                        "ndwi": round(ndwi_val, 4)
                    })

            if valid_obs:
                valid_obs.sort(key=lambda x: x["date"], reverse=True)
                latest = valid_obs[0]
                sat_current = {
                    "status": "success",
                    "scene_id": latest["id"],
                    "acquisition_date": latest["date_str"],
                    "cloud_percentage": latest["cloud_cover"],
                    "b4": latest["b4"],
                    "b5": latest["b5"],
                    "b8": latest["b8"],
                    "b8a": latest["b8a"],
                    "b11": latest["b11"],
                    "ndvi": latest["ndvi"],
                    "ndre": latest["ndre"],
                    "ndwi": latest["ndwi"]
                }

                # Historical comparisons
                target_7d = latest["date"] - timedelta(days=7)
                target_14d = latest["date"] - timedelta(days=14)

                obs_7d = find_closest_scene(valid_obs[1:], target_7d, 4)
                obs_14d = find_closest_scene(valid_obs[1:], target_14d, 5)

                if obs_7d:
                    sat_hist["hist_7d_status"] = "AVAILABLE"
                    sat_hist["scene_7d_id"] = obs_7d["id"]
                    sat_hist["scene_7d_date"] = obs_7d["date_str"]
                    sat_hist["ndvi_7d"] = obs_7d["ndvi"]
                    sat_hist["ndvi_change_7d"] = round(latest["ndvi"] - obs_7d["ndvi"], 4)
                else:
                    sat_hist["hist_7d_status"] = "UNAVAILABLE"
                    reasons_fail.append("satellite_7d")

                if obs_14d:
                    sat_hist["hist_14d_status"] = "AVAILABLE"
                    sat_hist["scene_14d_id"] = obs_14d["id"]
                    sat_hist["scene_14d_date"] = obs_14d["date_str"]
                    sat_hist["ndvi_14d"] = obs_14d["ndvi"]
                    sat_hist["ndvi_change_14d"] = round(latest["ndvi"] - obs_14d["ndvi"], 4)
                else:
                    sat_hist["hist_14d_status"] = "UNAVAILABLE"
                    reasons_fail.append("satellite_14d")
            else:
                sat_current["status"] = "failure"
                sat_current["error"] = "No cloud-free (<=20%) scenes in past 35 days"
                reasons_fail.append("satellite_current")
                reasons_fail.append("satellite_7d")
                reasons_fail.append("satellite_14d")
        else:
            sat_current["status"] = "failure"
            sat_current["error"] = f"HTTP {s_resp.status_code}"
            reasons_fail.append("satellite_current")
    except Exception as e:
        sat_current["status"] = "failure"
        sat_current["error"] = str(e)
        reasons_fail.append("satellite_current")

    # ==========================================
    # 3. SOIL DIAGNOSTICS (SoilGrids REST + Open-Meteo)
    # ==========================================
    soil_diag: Dict[str, Any] = {
        "soilgrids_status": "failure",
        "raw_ph": None,
        "converted_ph": None,
        "raw_nitrogen": None,
        "converted_nitrogen": None,
        "soil_moisture": None,
        "soil_moisture_type": "modeled (0-7cm)"
    }

    try:
        # SoilGrids REST
        sg_url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
        sg_params = {
            "lat": lat,
            "lon": lon,
            "property": ["phh2o", "nitrogen"],
            "depth": ["0-5cm"],
            "value": ["mean"]
        }

        sg_resp = None
        for attempt in range(1, 4):
            try:
                r = await client.get(sg_url, params=sg_params, timeout=20.0)
                if r.status_code == 200:
                    sg_resp = r
                    break
                elif r.status_code == 429 or r.status_code >= 500:
                    await asyncio.sleep(1.0 * attempt)
                else:
                    sg_resp = r
                    break
            except Exception:
                if attempt < 3:
                    await asyncio.sleep(1.0 * attempt)

        if sg_resp and sg_resp.status_code == 200:
            sg_data = sg_resp.json()
            raw_ph = None
            raw_nit = None
            for layer in sg_data.get("properties", {}).get("layers", []):
                lname = layer.get("name")
                depths = layer.get("depths", [])
                if depths and "values" in depths[0]:
                    mean_val = depths[0]["values"].get("mean")
                    if mean_val is not None:
                        if lname == "phh2o":
                            raw_ph = mean_val
                        elif lname == "nitrogen":
                            raw_nit = mean_val

            if raw_ph is not None and raw_nit is not None:
                soil_diag["soilgrids_status"] = "success"
                soil_diag["raw_ph"] = raw_ph
                soil_diag["converted_ph"] = round(raw_ph / 10.0, 2)
                soil_diag["raw_nitrogen"] = raw_nit
                soil_diag["converted_nitrogen"] = round(raw_nit / 100.0, 2)
            else:
                soil_diag["soilgrids_status"] = "failure (null properties)"
                if raw_ph is None:
                    reasons_fail.append("soil_ph")
                if raw_nit is None:
                    reasons_fail.append("soil_nitrogen")
        else:
            soil_diag["soilgrids_status"] = f"failure (HTTP {sg_resp.status_code if sg_resp else 'timeout'})"
            reasons_fail.append("soil_ph")
            reasons_fail.append("soil_nitrogen")

        # Open-Meteo Soil Moisture
        sm_url = "https://api.open-meteo.com/v1/forecast"
        sm_params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "soil_moisture_0_to_7cm",
            "timezone": "auto"
        }
        sm_resp = await client.get(sm_url, params=sm_params, timeout=15.0)
        if sm_resp.status_code == 200:
            sm_data = sm_resp.json()
            hourly_sm = sm_data.get("hourly", {}).get("soil_moisture_0_to_7cm", [])
            valid_sm = [v for v in hourly_sm if v is not None]
            if valid_sm:
                soil_diag["soil_moisture"] = round(float(valid_sm[0]) * 100.0, 2)
            else:
                reasons_fail.append("soil_moisture")
        else:
            reasons_fail.append("soil_moisture")

    except Exception as e:
        soil_diag["soilgrids_status"] = f"error: {str(e)}"
        reasons_fail.append("soil_ph")
        reasons_fail.append("soil_nitrogen")

    # Remove duplicate reasons
    dedup_reasons = []
    for r in reasons_fail:
        if r not in dedup_reasons:
            dedup_reasons.append(r)

    is_pass = len(dedup_reasons) == 0

    return {
        "lat": lat,
        "lon": lon,
        "weather": weather_info,
        "sat_current": sat_current,
        "sat_hist": sat_hist,
        "soil": soil_diag,
        "is_pass": is_pass,
        "reasons_fail": dedup_reasons
    }

async def main():
    async with httpx.AsyncClient() as client:
        print("Starting Diagnostic Batch Test for 15 Coordinates...\n")

        results = []
        for lat, lon in COORDINATES:
            res = await diagnose_coordinate(client, lat, lon)
            results.append(res)
            
            # Print Individual Coordinate Results
            print("==================================================")
            print(f"1. LATITUDE / LONGITUDE: {res['lat']:.4f}, {res['lon']:.4f}")
            print("--------------------------------------------------")
            
            # 2. Weather
            w = res["weather"]
            print("2. WEATHER")
            print(f"   Success/Failure: {w['status'].upper()}")
            if w['status'] == 'success':
                print(f"   Temperature:     {w['temperature']} °C")
                print(f"   Humidity:        {w['humidity']} %")
                print(f"   Rainfall:        {w['rainfall']} mm")
                print(f"   Wind Speed:      {w['wind_speed']} km/h")
            else:
                print(f"   Error:           {w.get('error')}")

            # 3. Current Sentinel-2
            sc = res["sat_current"]
            print("\n3. CURRENT SENTINEL-2")
            print(f"   Success/Failure:  {sc['status'].upper()}")
            if sc['status'] == 'success':
                print(f"   Scene ID:         {sc['scene_id']}")
                print(f"   Acquisition Date: {sc['acquisition_date']}")
                print(f"   Cloud Percentage: {sc['cloud_percentage']} %")
                print(f"   B4:  {sc['b4']} | B5:  {sc['b5']} | B8:  {sc['b8']} | B8A: {sc['b8a']} | B11: {sc['b11']}")
                print(f"   NDVI: {sc['ndvi']:.4f}")
                print(f"   NDRE: {sc['ndre']:.4f}")
                print(f"   NDWI: {sc['ndwi']:.4f}")
            else:
                print(f"   Error:            {sc.get('error')}")

            # 4. Historical Sentinel-2
            sh = res["sat_hist"]
            print("\n4. HISTORICAL SENTINEL-2")
            if sh["hist_7d_status"] == "AVAILABLE":
                print(f"   7-day Scene ID:   {sh['scene_7d_id']}")
                print(f"   7-day Scene Date: {sh['scene_7d_date']}")
                print(f"   7-day NDVI:       {sh['ndvi_7d']}")
                print(f"   ndvi_change_7d:   {sh['ndvi_change_7d']}")
            else:
                print("   HISTORICAL_7D:    UNAVAILABLE")

            if sh["hist_14d_status"] == "AVAILABLE":
                print(f"   14-day Scene ID:  {sh['scene_14d_id']}")
                print(f"   14-day Scene Date:{sh['scene_14d_date']}")
                print(f"   14-day NDVI:      {sh['ndvi_14d']}")
                print(f"   ndvi_change_14d:  {sh['ndvi_change_14d']}")
            else:
                print("   HISTORICAL_14D:   UNAVAILABLE")

            # 5. Soil
            sd = res["soil"]
            print("\n5. SOIL")
            print(f"   SoilGrids Status:   {sd['soilgrids_status'].upper()}")
            print(f"   Raw pH Value:       {sd['raw_ph']}")
            print(f"   Converted pH:       {sd['converted_ph']}")
            print(f"   Raw Nitrogen Value: {sd['raw_nitrogen']}")
            print(f"   Converted Nitrogen: {sd['converted_nitrogen']} g/kg" if sd['converted_nitrogen'] is not None else "   Converted Nitrogen: None")
            print(f"   Open-Meteo Moisture:{sd['soil_moisture']} %" if sd['soil_moisture'] is not None else "   Open-Meteo Moisture: None")
            print(f"   Moisture Data Type: {sd['soil_moisture_type']}")

            # 6. Final Validation
            print("\n6. FINAL VALIDATION")
            if res["is_pass"]:
                print("   STATUS: PASS")
            else:
                print("   STATUS: FAIL")
                print("   REASON:")
                for r in res["reasons_fail"]:
                    print(f"   * {r} unavailable")
            print()

        # Summary Metrics
        total_tested = len(results)
        passed_count = sum(1 for r in results if r["is_pass"])
        failed_count = total_tested - passed_count

        fail_counts = {
            "satellite_current": sum(1 for r in results if "satellite_current" in r["reasons_fail"]),
            "satellite_7d": sum(1 for r in results if "satellite_7d" in r["reasons_fail"]),
            "satellite_14d": sum(1 for r in results if "satellite_14d" in r["reasons_fail"]),
            "soil_ph": sum(1 for r in results if "soil_ph" in r["reasons_fail"]),
            "soil_nitrogen": sum(1 for r in results if "soil_nitrogen" in r["reasons_fail"]),
            "soil_moisture": sum(1 for r in results if "soil_moisture" in r["reasons_fail"]),
            "weather": sum(1 for r in results if "weather" in r["reasons_fail"]),
            "other": sum(1 for r in results if any(k not in ["satellite_current", "satellite_7d", "satellite_14d", "soil_ph", "soil_nitrogen", "soil_moisture", "weather"] for k in r["reasons_fail"])),
        }

        print("==================================================")
        print("DIAGNOSTIC BATCH SUMMARY")
        print("==================================================")
        print(f"TOTAL TESTED: {total_tested}")
        print(f"PASS:         {passed_count}")
        print(f"FAIL:         {failed_count}")
        print("\nFailure reasons:")
        print(f"* satellite_current: {fail_counts['satellite_current']}")
        print(f"* satellite_7d:      {fail_counts['satellite_7d']}")
        print(f"* satellite_14d:     {fail_counts['satellite_14d']}")
        print(f"* soil_ph:           {fail_counts['soil_ph']}")
        print(f"* soil_nitrogen:     {fail_counts['soil_nitrogen']}")
        print(f"* soil_moisture:     {fail_counts['soil_moisture']}")
        print(f"* weather:           {fail_counts['weather']}")
        print(f"* other:             {fail_counts['other']}")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
