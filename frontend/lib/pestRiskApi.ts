export interface FarmerPredictRequest {
  latitude: number;
  longitude: number;
  crop: string;
  crop_stage: string;
  previous_pest_incidence: number;
}

export interface TopFactor {
  feature: string;
  label: string;
  value: string | number;
  shap_value: number;
  direction: 'increases_risk' | 'decreases_risk';
}

export interface EnvironmentalData {
  temperature: number;
  temperature_max?: number;
  temperature_min?: number;
  humidity: number;
  rainfall: number;
  wind_speed?: number;
  ndvi: number;
  ndre: number;
  ndwi: number;
  ndvi_change_7d?: number;
  ndvi_change_14d?: number;
  soil_ph: number;
  soil_nitrogen: number;
  soil_moisture: number;
}

export interface DataSourceItem {
  provider?: string;
  provider_api?: string;
  source?: string;
  status: string;
  depth?: string;
  timestamp?: string;
  acquisition_date?: string;
  cloud_cover?: number;
  historical_7d_date?: string;
  historical_14d_date?: string;
}

export interface PestRiskResponse {
  success: boolean;
  crop: string;
  crop_stage: string;
  location: {
    latitude: number;
    longitude: number;
  };
  outbreak_probability: number;
  risk_percentage: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  alert: boolean;
  top_factors: TopFactor[];
  recommendations: string[];
  environmental_data: EnvironmentalData;
  data_sources: {
    weather?: DataSourceItem;
    satellite?: DataSourceItem;
    soil_ph?: DataSourceItem;
    soil_nitrogen?: DataSourceItem;
    soil_moisture?: DataSourceItem;
    [key: string]: DataSourceItem | undefined;
  };
  disclaimer: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function predictPestRisk(request: FarmerPredictRequest): Promise<PestRiskResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/pest-risk/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to process pest risk prediction.';
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = errorJson.detail;
        } else if (errorJson.error) {
          errorMsg = `${errorJson.error}: ${errorJson.detail || ''}`;
        }
      } catch {
        errorMsg = `Server error (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const data: PestRiskResponse = await response.json();
    return data;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('An unexpected network or service error occurred. Please check your backend connection.');
  }
}
