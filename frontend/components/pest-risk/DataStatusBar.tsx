'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { DataSourceItem } from '@/lib/pestRiskApi';

interface DataStatusBarProps {
  dataSources: {
    weather?: DataSourceItem;
    satellite?: DataSourceItem;
    soil_ph?: DataSourceItem;
    soil_nitrogen?: DataSourceItem;
    soil_moisture?: DataSourceItem;
    [key: string]: DataSourceItem | undefined;
  };
  hasResult: boolean;
}

export default function DataStatusBar({ dataSources, hasResult }: DataStatusBarProps) {
  const isWeatherAvail = hasResult && dataSources.weather?.status === 'success';
  const isSatAvail = hasResult && dataSources.satellite?.status === 'success';
  const isSoilAvail = hasResult && (dataSources.soil_ph?.status === 'success' || dataSources.soil_nitrogen?.status === 'success');
  const isAiComplete = hasResult;

  const items = [
    { label: 'Weather', available: isWeatherAvail, detail: 'Open-Meteo' },
    { label: 'Satellite', available: isSatAvail, detail: 'Sentinel-2 L2A' },
    { label: 'Soil', available: isSoilAvail, detail: 'SoilGrids & Open-Meteo' },
    { label: 'AI analysis', available: isAiComplete, detail: 'XGBoost + SHAP' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
      <span className="font-semibold text-slate-700">Data Integrity Status:</span>

      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-500">{item.label}</span>
            {item.available ? (
              <span className="text-emerald-700 flex items-center gap-0.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Available
              </span>
            ) : (
              <span className="text-amber-700 flex items-center gap-0.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Unavailable
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
