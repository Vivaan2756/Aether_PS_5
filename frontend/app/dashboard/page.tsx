"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import YieldCard from '@/components/dashboard/YieldCard';
import AdvisoryList, { AdvisoryItem } from '@/components/dashboard/AdvisoryList';
import { ParcelSelectPayload } from '@/components/map/ParcelMap';
import {
  Sprout,
  Droplets,
  Bug,
  Thermometer,
  CloudRain,
  MapPin,
  RefreshCw,
  Sparkles,
  Compass,
  Cpu,
  Satellite,
  Sun,
  Search,
  Target
} from 'lucide-react';

const ParcelMap = dynamic(() => import('@/components/map/ParcelMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] rounded-2xl bg-gray-900/10 animate-pulse flex flex-col items-center justify-center border border-gray-200 text-gray-500 gap-2">
      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
      <span className="text-sm font-medium">Loading MapLibre Satellite Engine...</span>
    </div>
  )
});

interface TelemetryData {
  ndvi: number;
  ndwi: number;
  pestRisk: number;
  soilMoisture: number;
  soilPh: number;
  soilOrganicCarbon: number;
  nitrogen: number;
  phosphorous: number;
  potassium: number;
  temperature: number;
  precip: number;
  solar: number;
  soilSource: string;
  weatherSource: string;
  source?: string;
  districtAvg: number;
  seasonalRainfall: number;
}

export default function DashboardPage() {
  const [coords, setCoords] = useState<{ lng: number; lat: number; areaHa: number }>({
    lng: 78.9629,
    lat: 20.5937,
    areaHa: 5.8
  });

  const [latInput, setLatInput] = useState<string>("20.5937");
  const [lngInput, setLngInput] = useState<string>("78.9629");

  const [selectedCrop, setSelectedCrop] = useState<string>('Cotton');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // We use this key to force ParcelMap to completely re-mount and re-center when the user manually types in a new coordinate from the sidebar
  const [mapKey, setMapKey] = useState<string>("20.5937-78.9629");

  const [prediction, setPrediction] = useState({
    yield: 3.809,
    unit: 't/ha',
    prithvi_yield: 3.872,
    catboost_yield: 3.714,
    uncertainty_std: 0.438,
    range_80: [3.248, 4.370] as [number, number],
    confidence: 'high' as 'high' | 'medium' | 'low',
    ensemble_weights: 'Prithvi (60%) + CatBoost (40%)'
  });

  const [recommendations, setRecommendations] = useState<AdvisoryItem[]>([
    {
      type: 'irrigation',
      priority: 1,
      level: 'high',
      message: 'Water stress detected (NDWI 0.13 < 0.15). Irrigate within 48 hours.'
    },
    {
      type: 'nutrient_management',
      priority: 2,
      level: 'medium',
      message: 'SoilGrids topsoil nitrogen is 148 kg/ha. Top-dress 25 kg/ha urea at flowering stage.'
    }
  ]);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    ndvi: 0.67,
    ndwi: 0.13,
    pestRisk: 62,
    soilMoisture: 29,
    soilPh: 7.11,
    soilOrganicCarbon: 0.71,
    nitrogen: 148.1,
    phosphorous: 47.8,
    potassium: 50.2,
    temperature: 27.1,
    precip: 2.87,
    solar: 18.87,
    soilSource: 'ISRIC SoilGrids v2.0',
    weatherSource: 'NASA POWER AgClimatology',
    source: 'SoilGrids + NASA POWER Live Ingestion',
    districtAvg: 3.10,
    seasonalRainfall: 720.0
  });

  // Fetch using the GET endpoint with direct lat/long
  const runModelInference = useCallback(async (lat: number, lng: number, crop: string = selectedCrop) => {
    setIsLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/inference/analyze-location?lat=${lat}&lng=${lng}&crop_type=${crop}`, {
        method: 'GET'
      });

      if (res.ok) {
        const data = await res.json();

        if (data.centroid) {
          setCoords({
            lat: data.centroid.lat,
            lng: data.centroid.lng,
            areaHa: data.area_hectares || 5.8
          });
        }

        if (data.prediction) {
          setPrediction({
            yield: data.prediction.yield,
            unit: data.prediction.unit || 't/ha',
            prithvi_yield: data.prediction.prithvi_yield,
            catboost_yield: data.prediction.catboost_yield,
            uncertainty_std: data.prediction.uncertainty_std || 0.40,
            range_80: data.prediction.range_80 || [data.prediction.yield * 0.85, data.prediction.yield * 1.15],
            confidence: data.prediction.confidence || 'medium',
            ensemble_weights: data.prediction.ensemble_weights || 'Prithvi (60%) + CatBoost (40%)'
          });
        }

        if (data.covariates) {
          const c = data.covariates;
          setTelemetry({
            ndvi: c.ndvi ?? 0.67,
            ndwi: c.ndwi ?? 0.13,
            pestRisk: Math.round((c.pest_probability ?? 0.62) * 100),
            soilMoisture: Math.round((c.soil_moisture ?? 0.28) * 100),
            soilPh: c.soil_ph ?? 7.1,
            soilOrganicCarbon: c.soil_organic_carbon ?? 0.70,
            nitrogen: c.nitrogen ?? 145,
            phosphorous: c.phosphorous ?? 45,
            potassium: c.potassium ?? 50,
            temperature: c.temperature ?? 27.1,
            precip: c.precipitation ?? 2.87,
            solar: c.solar_radiation ?? 18.87,
            soilSource: c.soil_source?.includes('soilgrids') ? 'ISRIC SoilGrids v2.0 (Live)' : 'SoilGrids Regional Baseline',
            weatherSource: c.weather_source?.includes('nasa') ? 'NASA POWER API (Live)' : 'NASA POWER Climatology',
            source: c.source,
            districtAvg: c.district_avg_yield ?? 3.10,
            seasonalRainfall: c.seasonal_rainfall ?? 720.0
          });
        }

        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.warn("Backend inference call failed, using model card fallbacks", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrop]);

  // Handle map parcel selection (drawn or clicked on map)
  const handleParcelSelect = useCallback((payload: ParcelSelectPayload) => {
    setCoords({
      lng: payload.centroid.lng,
      lat: payload.centroid.lat,
      areaHa: payload.areaHa
    });
    setLatInput(payload.centroid.lat.toFixed(4));
    setLngInput(payload.centroid.lng.toFixed(4));
    runModelInference(payload.centroid.lat, payload.centroid.lng, selectedCrop);
  }, [runModelInference, selectedCrop]);

  const handleClearPreviousState = useCallback(() => {}, []);

  useEffect(() => {
    runModelInference(coords.lat, coords.lng, selectedCrop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presets = [
    { name: 'Vidarbha (Cotton/Soybean)', lat: 20.5937, lng: 78.9629, crop: 'Cotton' },
    { name: 'Nashik (Grapes/Onion)', lat: 19.9975, lng: 73.7898, crop: 'Cotton' },
    { name: 'Punjab (Wheat/Paddy)', lat: 30.9010, lng: 75.8573, crop: 'Wheat' },
    { name: 'Kolhapur (Sugarcane)', lat: 16.7050, lng: 74.2433, crop: 'Sugarcane' }
  ];

  const cropOptions = ['Cotton', 'Wheat', 'Rice', 'Sugarcane', 'Soyabean'];

  const handleManualCoordinateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCoords({ lat, lng, areaHa: 5.8 });
      setMapKey(`${lat}-${lng}`); // Force Map to re-mount at new location
      runModelInference(lat, lng, selectedCrop);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8faf9] flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Header */}
      <header className="bg-white border-b border-emerald-100/60 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Precision Agriculture
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Satellite className="w-3.5 h-3.5 text-emerald-500" /> Prithvi-EO
            </span>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" /> CatBoost
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-600" />
            Kisan Vikas
          </h1>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar: Controls & Coordinates */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_12px_-4px_rgba(16,185,129,0.1)] border border-emerald-50 space-y-6 relative overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

            <div>
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-emerald-600" />
                Target Coordinates
              </h2>
              <form onSubmit={handleManualCoordinateSearch} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Latitude</label>
                    <input
                      type="text"
                      value={latInput}
                      onChange={(e) => setLatInput(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm font-mono text-emerald-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                      placeholder="20.5937"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Longitude</label>
                    <input
                      type="text"
                      value={lngInput}
                      onChange={(e) => setLngInput(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm font-mono text-emerald-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                      placeholder="78.9629"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Analyze Location
                </button>
              </form>
            </div>

            <div className="pt-5 border-t border-emerald-50">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Sprout className="w-4 h-4 text-emerald-600" />
                Crop Profile
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {cropOptions.map((crop) => (
                  <button
                    key={crop}
                    onClick={() => {
                      setSelectedCrop(crop);
                      runModelInference(coords.lat, coords.lng, crop);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all font-semibold border ${selectedCrop === crop
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50'
                      }`}
                  >
                    {crop}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-emerald-50">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-emerald-600" />
                Regional Presets
              </h2>
              <div className="flex flex-col gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setLatInput(p.lat.toString());
                      setLngInput(p.lng.toString());
                      setCoords({ lng: p.lng, lat: p.lat, areaHa: 5.8 });
                      setSelectedCrop(p.crop);
                      setMapKey(`${p.lat}-${p.lng}`);
                      runModelInference(p.lat, p.lng, p.crop);
                    }}
                    className="text-left text-xs font-semibold px-3 py-2.5 rounded-lg border border-gray-100 text-gray-700 hover:border-emerald-200 hover:text-emerald-700 bg-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-white transition-all cursor-pointer truncate shadow-sm group flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-5 border-t border-emerald-50">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                <CloudRain className="w-4 h-4 text-emerald-600" />
                Live API Telemetry
              </h2>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center p-2 rounded-md bg-emerald-50/50 border border-emerald-100/50">
                  <span className="text-gray-600 font-medium">Nitrogen (Soil)</span>
                  <span className="font-bold text-emerald-900">{telemetry.nitrogen} kg/ha</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-emerald-50/50 border border-emerald-100/50">
                  <span className="text-gray-600 font-medium">Phosphorous</span>
                  <span className="font-bold text-emerald-900">{telemetry.phosphorous} kg/ha</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-emerald-50/50 border border-emerald-100/50">
                  <span className="text-gray-600 font-medium">Potassium</span>
                  <span className="font-bold text-emerald-900">{telemetry.potassium} kg/ha</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-emerald-50/50 border border-emerald-100/50">
                  <span className="text-gray-600 font-medium">Soil pH</span>
                  <span className="font-bold text-emerald-900">{telemetry.soilPh}</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-md bg-amber-50/50 border border-amber-100/50">
                  <span className="text-gray-600 font-medium">Temp (Air)</span>
                  <span className="font-bold text-amber-900">{telemetry.temperature}°C</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Map & Telemetry Dashboard */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Live Telemetry Ingestion Source Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-teal-950 text-white p-3.5 rounded-xl shadow-sm border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-gray-300">Live Telemetry:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30">
                {telemetry.soilSource}
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-medium border border-blue-500/30">
                {telemetry.weatherSource}
              </span>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
            <ParcelMap
              key={mapKey}
              initialCenter={[coords.lng, coords.lat]}
              onParcelSelect={handleParcelSelect}
              onClearPreviousState={handleClearPreviousState}
              fieldName={`Field Parcel (${coords.lat.toFixed(3)}N, ${coords.lng.toFixed(3)}E)`}
              ndwiLevel={telemetry.ndwi}
              ndviLevel={telemetry.ndvi}
            />
          </div>

          {/* 4 Multi-Spectral Telemetry & Agro-Climatic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium">NDVI Vigor</span>
                <Sprout className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{telemetry.ndvi}</div>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(telemetry.ndvi * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium">NDWI Water</span>
                <Droplets className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{telemetry.ndwi}</div>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${telemetry.ndwi < 0.15 ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(telemetry.ndwi * 400, 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-red-300 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium">Pest Risk</span>
                <Bug className={`w-4 h-4 ${telemetry.pestRisk > 70 ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{telemetry.pestRisk}%</div>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${telemetry.pestRisk > 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${telemetry.pestRisk}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span className="font-medium">Soil Moisture</span>
                <Thermometer className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{telemetry.soilMoisture}%</div>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(telemetry.soilMoisture * 2.5, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: AI Forecast & Actions */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
          <YieldCard
            forecast={prediction.yield}
            lower={prediction.range_80[0]}
            upper={prediction.range_80[1]}
            uncertaintyStd={prediction.uncertainty_std}
            confidence={prediction.confidence}
            prithviYield={prediction.prithvi_yield}
            catboostYield={prediction.catboost_yield}
            ensembleWeights={prediction.ensemble_weights}
            districtAvg={telemetry.districtAvg}
            isLoading={isLoading}
          />

          <AdvisoryList advisories={recommendations} />
        </aside>
      </div>
    </main>
  );
}