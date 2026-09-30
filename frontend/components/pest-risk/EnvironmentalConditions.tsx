'use client';

import React from 'react';
import { CloudRain, Satellite, Layers, CheckCircle2, Thermometer, Droplets, Wind, Calendar, Eye, Activity } from 'lucide-react';
import { EnvironmentalData, DataSourceItem } from '@/lib/pestRiskApi';

interface EnvironmentalConditionsProps {
  data: EnvironmentalData;
  dataSources: {
    weather?: DataSourceItem;
    satellite?: DataSourceItem;
    soil_ph?: DataSourceItem;
    soil_nitrogen?: DataSourceItem;
    soil_moisture?: DataSourceItem;
    [key: string]: DataSourceItem | undefined;
  };
}

function getBadge(sourceName?: string, isModeled: boolean = false) {
  if (!sourceName) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
        UNAVAILABLE
      </span>
    );
  }
  if (sourceName.toLowerCase().includes('mock')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
        MOCK DATA
      </span>
    );
  }
  if (isModeled || sourceName.toLowerCase().includes('modeled')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        ✓ MODELED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
      ✓ REAL DATA
    </span>
  );
}

export default function EnvironmentalConditions({ data, dataSources }: EnvironmentalConditionsProps) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Environmental Observations</h3>
          <p className="text-sm text-slate-400">
            Real telemetry automatically gathered from Open-Meteo, Sentinel-2 STAC, and SoilGrids APIs.
          </p>
        </div>

        {/* Global provider status badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-[11px] text-slate-400">Weather:</span>
            {getBadge(dataSources.weather?.provider || dataSources.weather?.source)}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-[11px] text-slate-400">Sentinel-2:</span>
            {getBadge(dataSources.satellite?.provider || dataSources.satellite?.source)}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-[11px] text-slate-400">Soil:</span>
            {getBadge(dataSources.soil_ph?.provider || dataSources.soil_ph?.source)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Weather Conditions Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
              <CloudRain className="w-4 h-4" /> Open-Meteo Weather
            </div>
            {getBadge(dataSources.weather?.provider || 'Open-Meteo')}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-slate-500" /> Temperature:
              </span>
              <span className="font-semibold text-white">{data.temperature.toFixed(1)}°C</span>
            </div>

            {data.temperature_max !== undefined && data.temperature_min !== undefined && (
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Min / Max Range:</span>
                <span className="font-mono text-slate-300">
                  {data.temperature_min.toFixed(1)}°C / {data.temperature_max.toFixed(1)}°C
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-slate-500" /> Humidity:
              </span>
              <span className="font-semibold text-white">{data.humidity.toFixed(1)}%</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-slate-500" /> Rainfall:
              </span>
              <span className="font-semibold text-white">{data.rainfall.toFixed(1)} mm</span>
            </div>

            {data.wind_speed !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-slate-500" /> Wind Speed:
                </span>
                <span className="font-semibold text-white">{data.wind_speed.toFixed(1)} km/h</span>
              </div>
            )}
          </div>
        </div>

        {/* Sentinel-2 Satellite Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <Satellite className="w-4 h-4" /> Sentinel-2 STAC
            </div>
            {getBadge(dataSources.satellite?.provider || dataSources.satellite?.source)}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5" title="Normalized Difference Vegetation Index (B8, B4)">
                <Eye className="w-3.5 h-3.5 text-slate-500" /> NDVI (Health):
              </span>
              <span className="font-semibold text-emerald-400">{data.ndvi.toFixed(3)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5" title="Normalized Difference Red Edge (B8A, B5)">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> NDRE (Stress):
              </span>
              <span className="font-semibold text-white">{data.ndre.toFixed(3)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5" title="Normalized Difference Water Index (B8, B11)">
                <Droplets className="w-3.5 h-3.5 text-slate-500" /> NDWI (Moisture):
              </span>
              <span className="font-semibold text-white">{data.ndwi.toFixed(3)}</span>
            </div>

            {data.ndvi_change_7d !== undefined && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">7-Day Change:</span>
                <span className={`font-mono ${data.ndvi_change_7d < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {data.ndvi_change_7d > 0 ? '+' : ''}
                  {data.ndvi_change_7d.toFixed(3)}
                </span>
              </div>
            )}

            {dataSources.satellite?.acquisition_date && (
              <div className="pt-1 text-[11px] font-mono text-emerald-300/80 flex items-center justify-between border-t border-slate-800/40">
                <span className="text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Acquisition:
                </span>
                <span>{dataSources.satellite.acquisition_date}</span>
              </div>
            )}
          </div>
        </div>

        {/* Soil Properties Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Layers className="w-4 h-4" /> Soil & Moisture
            </div>
            {getBadge(dataSources.soil_ph?.provider || 'SoilGrids')}
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-slate-500" /> Topsoil pH (0-5cm):
              </span>
              <span className="font-semibold text-white">{data.soil_ph.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Soil Nitrogen:
              </span>
              <span className="font-semibold text-white">{data.soil_nitrogen.toFixed(2)} g/kg</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-slate-500" /> Soil Moisture:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-amber-300">{data.soil_moisture.toFixed(1)}%</span>
                {getBadge('modeled', true)}
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-500 leading-tight">
              Soil pH & Nitrogen derived from ISRIC SoilGrids. Soil moisture modeled via Open-Meteo Land telemetry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
