import os
import sys
import asyncio
from datetime import datetime, timedelta, timezone
import httpx
import rasterio
from rasterio.warp import transform

# Configure GDAL environment variables for fast COG range reads
os.environ["GDAL_DISABLE_READDIR_ON_OPEN"] = "EMPTY_DIR"
os.environ["AWS_NO_SIGN_REQUEST"] = "YES"
os.environ["CPL_VSIL_CURL_ALLOWED_EXTENSIONS"] = ".tif"
os.environ["VSI_CACHE"] = "TRUE"
os.environ["GDAL_HTTP_TIMEOUT"] = "20"

TEST_COORDS = [
    (29.0588, 76.0856, "Haryana Agri Belt"),
    (19.8500, 75.3000, "Maharashtra Agri Belt"),
    (22.3072, 73.1812, "Gujarat Agri Belt"),
]

BAND_ASSET_KEYS = {
    "B4": ["red", "b04", "B04", "B4"],
    "B5": ["rededge1", "b05", "B05", "B5"],
    "B8": ["nir", "b08", "B08", "B8"],
    "B8A": ["nir08", "b8a", "B8A", "b08a", "B08A"],
    "B11": ["swir16", "b11", "B11"],
}

def get_asset_url(assets, band_name):
    candidate_keys = BAND_ASSET_KEYS.get(band_name, [])
    for k in candidate_keys:
        if k in assets:
            return k, assets[k].get("href")
    for k, v in assets.items():
        if band_name.lower() in k.lower():
            return k, v.get("href")
    return None, None

def extract_pixel_value(cog_url, lon, lat):
    try:
        with rasterio.open(cog_url) as src:
            crs_str = str(src.crs)
            bounds = src.bounds
            
            # Transform lon/lat (EPSG:4326) to Raster CRS (e.g. UTM)
            xs, ys = transform("EPSG:4326", src.crs, [lon], [lat])
            x, y = xs[0], ys[0]
            
            in_bounds = (bounds.left <= x <= bounds.right and bounds.bottom <= y <= bounds.top)
            if not in_bounds:
                return {
                    "error": f"Coordinates ({lon}, {lat}) -> ({x:.2f}, {y:.2f}) outside raster bounds",
                    "crs": crs_str,
                    "bounds": f"left={bounds.left:.2f}, bottom={bounds.bottom:.2f}, right={bounds.right:.2f}, top={bounds.top:.2f}",
                    "row": None, "col": None,
                    "raw_pixel": None
                }
            
            row, col = src.index(x, y)
            
            # Read single pixel window
            window = rasterio.windows.Window(col, row, 1, 1)
            data = src.read(1, window=window)
            raw_val = float(data[0, 0])
            
            return {
                "crs": crs_str,
                "bounds": f"left={bounds.left:.2f}, bottom={bounds.bottom:.2f}, right={bounds.right:.2f}, top={bounds.top:.2f}",
                "row": int(row),
                "col": int(col),
                "raw_pixel": raw_val,
                "error": None
            }
    except Exception as e:
        return {
            "error": str(e),
            "crs": None,
            "bounds": None,
            "row": None,
            "col": None,
            "raw_pixel": None
        }

async def inspect_coordinate(client, lat, lon, label):
    print(f"\n==================================================")
    print(f"DIAGNOSTIC RASTER AUDIT FOR: {lat:.4f}, {lon:.4f} ({label})")
    print(f"==================================================")

    # 1. Query STAC
    stac_url = "https://earth-search.aws.element84.com/v1/search"
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=35)).strftime("%Y-%m-%dT00:00:00Z")
    end_date = now.strftime("%Y-%m-%dT23:59:59Z")
    deg_offset = 0.0009
    bbox = [round(lon - deg_offset, 6), round(lat - deg_offset, 6), round(lon + deg_offset, 6), round(lat + deg_offset, 6)]

    payload = {
        "bbox": bbox,
        "datetime": f"{start_date}/{end_date}",
        "collections": ["sentinel-2-c1-l2a", "sentinel-2-l2a"],
        "limit": 10
    }

    resp = await client.post(stac_url, json=payload, timeout=20.0)
    if resp.status_code not in (200, 201):
        payload["collections"] = ["sentinel-2-c1-l2a"]
        resp = await client.post(stac_url, json=payload, timeout=20.0)

    if resp.status_code not in (200, 201):
        print(f"STAC search failed with HTTP {resp.status_code}")
        return

    features = resp.json().get("features", [])
    valid_features = []
    for f in features:
        props = f.get("properties", {})
        cc = props.get("eo:cloud_cover") or props.get("cloud_cover") or 0.0
        if cc <= 20.0:
            valid_features.append(f)

    if not valid_features:
        print("No cloud-free Sentinel-2 features (<=20% clouds) found.")
        return

    # Select latest scene
    latest_feature = valid_features[0]
    scene_id = latest_feature.get("id")
    props = latest_feature.get("properties", {})
    acq_dt = props.get("datetime")
    assets = latest_feature.get("assets", {})

    print(f"1. STAC Scene ID:              {scene_id}")
    print(f"2. Scene Acquisition Datetime: {acq_dt}")
    
    asset_urls = {}
    for band in ["B4", "B5", "B8", "B8A", "B11"]:
        k, url = get_asset_url(assets, band)
        asset_urls[band] = (k, url)
        print(f"   Asset URL/key for {band:4s}: Key='{k}' -> {url}")

    print(f"\n8. Requested Longitude/Latitude: lon={lon}, lat={lat}")

    # Extract pixel from each band
    raw_pixels = {}
    converted_reflectances = {}
    band_details = {}

    for band in ["B4", "B5", "B8", "B8A", "B11"]:
        k, url = asset_urls[band]
        if not url:
            print(f"Error: No asset URL found for band {band}")
            continue
        
        info = extract_pixel_value(url, lon, lat)
        band_details[band] = info
        raw_val = info.get("raw_pixel")
        raw_pixels[band] = raw_val
        
        # Sentinel-2 L2A BOA surface reflectance scale factor: DN / 10000.0 = Surface Reflectance (0.0 to 1.0)
        if raw_val is not None:
            converted_reflectances[band] = round(raw_val / 10000.0, 4)
        else:
            converted_reflectances[band] = None

    ref_info = band_details.get("B4") or list(band_details.values())[0]
    print(f"9.  Raster CRS:                {ref_info.get('crs')}")
    print(f"10. Raster Bounds:             {ref_info.get('bounds')}")
    print(f"11. Pixel Row/Column Selected: row={ref_info.get('row')}, col={ref_info.get('col')}")

    print(f"\n12. Raw B4  Pixel Value:       {raw_pixels.get('B4')}")
    print(f"13. Raw B5  Pixel Value:       {raw_pixels.get('B5')}")
    print(f"14. Raw B8  Pixel Value:       {raw_pixels.get('B8')}")
    print(f"15. Raw B8A Pixel Value:       {raw_pixels.get('B8A')}")
    print(f"16. Raw B11 Pixel Value:       {raw_pixels.get('B11')}")

    print(f"\n17. Converted Reflectance Values (DN / 10000.0):")
    for b in ["B4", "B5", "B8", "B8A", "B11"]:
        print(f"    {b:4s}: {converted_reflectances.get(b)}")

    # Calculate actual indices
    b4 = converted_reflectances.get("B4")
    b5 = converted_reflectances.get("B5")
    b8 = converted_reflectances.get("B8")
    b8a = converted_reflectances.get("B8A")
    b11 = converted_reflectances.get("B11")

    if all(v is not None for v in [b4, b5, b8, b8a, b11]):
        ndvi = (b8 - b4) / (b8 + b4) if (b8 + b4) != 0 else 0.0
        ndre = (b8a - b5) / (b8a + b5) if (b8a + b5) != 0 else 0.0
        ndwi = (b8 - b11) / (b8 + b11) if (b8 + b11) != 0 else 0.0

        print(f"\nCALCULATED VEGETATION INDICES FROM REAL PIXELS:")
        print(f"NDVI = (B8 - B4) / (B8 + B4)   = ({b8} - {b4}) / ({b8} + {b4}) = {ndvi:.4f}")
        print(f"NDRE = (B8A - B5) / (B8A + B5) = ({b8a} - {b5}) / ({b8a} + {b5}) = {ndre:.4f}")
        print(f"NDWI = (B8 - B11) / (B8 + B11) = ({b8} - {b11}) / ({b8} + {b11}) = {ndwi:.4f}")
    else:
        print("\nCould not calculate indices due to missing band pixel(s).")

async def main():
    async with httpx.AsyncClient() as client:
        for lat, lon, label in TEST_COORDS:
            await inspect_coordinate(client, lat, lon, label)

if __name__ == "__main__":
    asyncio.run(main())
