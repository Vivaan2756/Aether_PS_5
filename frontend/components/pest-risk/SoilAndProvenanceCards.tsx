'use client';

import React from 'react';
import { Layers, Satellite, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { EnvironmentalData, DataSourceItem } from '@/lib/pestRiskApi';

interface SoilAndProvenanceCardsProps {
  soilData: {
    soil_ph: number;
    soil_nitrogen: number;
    soil_moisture: number;
  };
  dataSources: {
    satellite?: DataSourceItem;
    soil_ph?: DataSourceItem;
    soil_nitrogen?: DataSourceItem;
    soil_moisture?: DataSourceItem;
    [key: string]: DataSourceItem | undefined;
  };
}

export default function SoilAndProvenanceCards({ soilData, dataSources }: SoilAndProvenanceCardsProps) {
  const { soil_ph, soil_nitrogen, soil_moisture } = soilData;
  const sat = dataSources.satellite;
  const isRealSat = sat?.provider_api?.includes('Earth Search') || sat?.provider?.includes('Sentinel') || sat?.status === 'success';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* 1. Soil Conditions Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Soil conditions
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
            Depth 0–5cm
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* pH */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              pH
            </span>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {soil_ph !== undefined ? soil_ph.toFixed(1) : '—'}
            </div>
            <span className="text-[10px] text-slate-500 block">Topsoil (0–5cm)</span>
          </div>

          {/* Nitrogen */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Nitrogen
            </span>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {soil_nitrogen !== undefined ? `${soil_nitrogen.toFixed(2)}` : '—'}{' '}
              <span className="text-xs font-normal text-slate-500">g/kg</span>
            </div>
            <span className="text-[10px] text-slate-500 block">Total nitrogen</span>
          </div>

          {/* Moisture */}
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Moisture
            </span>
            <div className="text-lg font-bold text-slate-900 font-mono">
              {soil_moisture !== undefined ? `${soil_moisture.toFixed(1)}%` : '—'}
            </div>
            <span className="text-[10px] text-slate-500 block">Rootzone (0–7cm)</span>
          </div>
        </div>

        {/* Source metadata */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>Soil chemistry source:</span>
            <span className="font-medium text-slate-700">ISRIC SoilGrids REST (0–5cm)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Soil moisture source:</span>
            <span className="font-medium text-slate-700">Open-Meteo modeled soil moisture (0–7cm)</span>
          </div>
        </div>
      </div>

      {/* 2. Satellite Data / Provenance Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Satellite Data
            </h3>
          </div>
          {isRealSat && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Real satellite observation
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Platform & Catalog
            </span>
            <div className="font-semibold text-slate-800">
              Sentinel-2 L2A
            </div>
            <div className="text-[11px] text-slate-500">
              Earth Search STAC
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Latest Observation
            </span>
            <div className="font-semibold text-slate-800 font-mono">
              {sat?.acquisition_date || 'Current Scene'}
            </div>
            <div className="text-[11px] text-slate-500">
              Cloud cover: {sat?.cloud_cover !== undefined ? `${sat.cloud_cover}%` : '0%'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              7-Day Reference
            </span>
            <div className="font-semibold text-slate-800 font-mono">
              {sat?.historical_7d_date ? `${sat.historical_7d_date}` : 'Unavailable'}
            </div>
            <div className="text-[11px] text-slate-500">
              {sat?.historical_7d_date ? 'Prior cloud-free revisit' : 'No scene in ±4d window'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              14-Day Reference
            </span>
            <div className="font-semibold text-slate-800 font-mono">
              {sat?.historical_14d_date ? `${sat.historical_14d_date}` : 'Unavailable'}
            </div>
            <div className="text-[11px] text-slate-500">
              {sat?.historical_14d_date ? 'Baseline cloud-free revisit' : 'No scene in ±5d window'}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Surface reflectance band assets (B4, B5, B8, B8A, B11)</span>
          <span className="font-mono">10m / 20m</span>
        </div>
      </div>
    </div>
  );
}
