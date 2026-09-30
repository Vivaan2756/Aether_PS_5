import asyncio
import httpx
from datetime import datetime, timedelta, timezone

# Candidate regions across India (Telangana/Andhra, Gujarat, Karnataka, Tamil Nadu, Rajasthan, MP, UP, Maharashtra)
REGIONS = [
    # Maharashtra
    {"name": "Maharashtra - Aurangabad Rural", "lat": 19.85, "lon": 75.30},
    {"name": "Maharashtra - Ahmednagar Rural", "lat": 19.10, "lon": 74.70},
    {"name": "Maharashtra - Solapur Agri", "lat": 17.65, "lon": 75.90},
    {"name": "Maharashtra - Akola Agri Belt", "lat": 20.70, "lon": 77.00},
    {"name": "Maharashtra - Amravati Agri Belt", "lat": 20.93, "lon": 77.75},
    {"name": "Maharashtra - Yavatmal Agri Belt", "lat": 20.40, "lon": 78.13},
    {"name": "Maharashtra - Jalgaon Banana Belt", "lat": 21.00, "lon": 75.56},
    {"name": "Maharashtra - Dhule Agri", "lat": 20.90, "lon": 74.78},
    # Gujarat
    {"name": "Gujarat - Anand Agri University / Charotar Belt", "lat": 22.55, "lon": 72.95},
    {"name": "Gujarat - Mehsana Agri Belt", "lat": 23.60, "lon": 72.40},
    {"name": "Gujarat - Rajkot Farmlands", "lat": 22.30, "lon": 70.80},
    {"name": "Gujarat - Junagadh Agri Belt", "lat": 21.52, "lon": 70.45},
    {"name": "Gujarat - Vadodara Rural Farmlands", "lat": 22.30, "lon": 73.20},
    # Rajasthan
    {"name": "Rajasthan - Kota Wheat/Soybean Belt", "lat": 25.18, "lon": 75.83},
    {"name": "Rajasthan - Sri Ganganagar Agri Belt", "lat": 29.92, "lon": 73.88},
    {"name": "Rajasthan - Alwar Farmlands", "lat": 27.56, "lon": 76.61},
    {"name": "Rajasthan - Jaipur Rural Agri", "lat": 26.90, "lon": 75.80},
    # Madhya Pradesh
    {"name": "Madhya Pradesh - Ujjain Farmlands", "lat": 23.18, "lon": 75.77},
    {"name": "Madhya Pradesh - Dewas Agri Belt", "lat": 22.96, "lon": 76.05},
    {"name": "Madhya Pradesh - Indore Rural", "lat": 22.70, "lon": 75.85},
    {"name": "Madhya Pradesh - Khargone Cotton Belt", "lat": 21.82, "lon": 75.61},
    {"name": "Madhya Pradesh - Vidisha Agri Belt", "lat": 23.53, "lon": 77.81},
    # Telangana / Andhra
    {"name": "Telangana - Warangal Cotton Belt", "lat": 17.97, "lon": 79.59},
    {"name": "Telangana - Nizamabad Farmlands", "lat": 18.67, "lon": 78.10},
    {"name": "Telangana - Karimnagar Agri Belt", "lat": 18.43, "lon": 79.13},
    {"name": "Andhra Pradesh - Guntur Chilli/Cotton Belt", "lat": 16.30, "lon": 80.45},
    {"name": "Andhra Pradesh - Kurnool Farmlands", "lat": 15.83, "lon": 78.03},
    # Karnataka
    {"name": "Karnataka - Belgaum Agri Belt", "lat": 15.85, "lon": 74.50},
    {"name": "Karnataka - Dharwad Agri Belt", "lat": 15.45, "lon": 75.00},
    {"name": "Karnataka - Raichur Paddy Belt", "lat": 16.20, "lon": 77.35},
    {"name": "Karnataka - Bellary Farmlands", "lat": 15.15, "lon": 76.92},
    # Punjab / Haryana rural points with different lat/lons
    {"name": "Punjab - Fazilka Farmlands", "lat": 30.40, "lon": 74.02},
    {"name": "Punjab - Firozpur Rural", "lat": 30.92, "lon": 74.61},
    {"name": "Haryana - Sirsa Farmlands", "lat": 29.53, "lon": 75.02},
    {"name": "Haryana - Hisar Farmlands", "lat": 29.15, "lon": 75.72},
]

async def check_point(client, pt):
    lat = pt["lat"]
    lon = pt["lon"]
    name = pt["name"]
    
    # 1. SoilGrids check
    sg_url = "https://rest.isric.org/soilgrids/v2.0/properties/query"
    sg_params = {
        "lat": lat,
        "lon": lon,
        "property": ["phh2o", "nitrogen"],
        "depth": ["0-5cm"],
        "value": ["mean"]
    }
    
    ph_val = None
    nit_val = None
    try:
        resp = await client.get(sg_url, params=sg_params, timeout=10.0)
        if resp.status_code == 200:
            data = resp.json()
            for layer in data.get("properties", {}).get("layers", []):
                lname = layer.get("name")
                depths = layer.get("depths", [])
                if depths and "values" in depths[0]:
                    mean = depths[0]["values"].get("mean")
                    if mean is not None:
                        if lname == "phh2o":
                            ph_val = round(mean / 10.0, 2)
                        elif lname == "nitrogen":
                            nit_val = round(mean / 100.0, 2)
    except Exception:
        pass

    # 2. STAC check
    stac_url = "https://earth-search.aws.element84.com/v1/search"
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=35)).strftime("%Y-%m-%dT00:00:00Z")
    end_date = now.strftime("%Y-%m-%dT23:59:59Z")
    deg_offset = 0.0009
    bbox = [round(lon - deg_offset, 6), round(lat - deg_offset, 6), round(lon + deg_offset, 6), round(lat + deg_offset, 6)]
    
    stac_payload = {
        "collections": ["sentinel-2-c1-l2a", "sentinel-2-l2a"],
        "bbox": bbox,
        "datetime": f"{start_date}/{end_date}",
        "limit": 10
    }
    
    clear_scenes = 0
    best_scene_date = None
    best_scene_cloud = None
    
    try:
        sresp = await client.post(stac_url, json=stac_payload, timeout=10.0)
        if sresp.status_code == 200:
            sdata = sresp.json()
            features = sdata.get("features", [])
            for f in features:
                props = f.get("properties", {})
                cc = props.get("eo:cloud_cover") or props.get("cloud_cover") or 0.0
                if cc <= 20.0:
                    clear_scenes += 1
                    if best_scene_date is None:
                        best_scene_date = props.get("datetime", "")[:10]
                        best_scene_cloud = round(cc, 2)
    except Exception:
        pass

    return {
        "name": name,
        "lat": lat,
        "lon": lon,
        "soil_ph": ph_val,
        "soil_nitrogen": nit_val,
        "clear_scenes": clear_scenes,
        "best_scene_date": best_scene_date,
        "best_scene_cloud": best_scene_cloud,
        "candidate_match": (ph_val is not None and nit_val is not None and clear_scenes >= 2)
    }

async def main():
    async with httpx.AsyncClient() as client:
        tasks = [check_point(client, pt) for pt in REGIONS]
        results = await asyncio.gather(*tasks)
        
        print("=== SCAN RESULTS ===")
        matches = []
        for r in results:
            status = "MATCH" if r["candidate_match"] else "NO"
            print(f"[{status}] {r['name']} ({r['lat']}, {r['lon']}) -> pH: {r['soil_ph']}, N: {r['soil_nitrogen']}, Clear S2 scenes: {r['clear_scenes']}, Best: {r['best_scene_date']} ({r['best_scene_cloud']}%)")
            if r["candidate_match"]:
                matches.append(r)
                
        print("\n=== SUCCESSFUL MATCHES (Both Soil & Clear Sentinel-2 available) ===")
        for m in matches:
            print(f"-> {m['name']} ({m['lat']}, {m['lon']})")

if __name__ == "__main__":
    asyncio.run(main())
