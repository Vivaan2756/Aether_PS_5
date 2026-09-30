'use client';

import React from 'react';
import { Thermometer, Droplets, CloudRain, Wind, Layers } from 'lucide-react';
import { EnvironmentalData } from '@/lib/pestRiskApi';

interface EnvironmentalGridProps {
  data: EnvironmentalData;
}

export default function EnvironmentalGrid({ data }: EnvironmentalGridProps) {
  const {
    temperature,
    temperature_max,
    temperature_min,
    humidity,
    rainfall,
    wind_speed,
    soil_moisture,
  } = data;

  const cards = [
    {
      title: 'Temperature',
      value: `${temperature !== undefined ? temperature.toFixed(1) : '—'}°C`,
      subtitle:
        temperature_max !== undefined && temperature_min !== undefined
          ? `High: ${temperature_max.toFixed(1)}° · Low: ${temperature_min.toFixed(1)}°`
          : 'Current ambient',
      icon: <Thermometer className="w-4 h-4 text-rose-500" />,
      tag: 'Air Temp',
    },
    {
      title: 'Humidity',
      value: `${humidity !== undefined ? Math.round(humidity) : '—'}%`,
      subtitle: humidity > 70 ? 'Elevated spore/pest risk' : 'Moderate range',
      icon: <Droplets className="w-4 h-4 text-sky-500" />,
      tag: 'Relative',
    },
    {
      title: 'Rainfall',
      value: `${rainfall !== undefined ? rainfall.toFixed(1) : '—'} mm`,
      subtitle: rainfall > 0 ? 'Recent precipitation' : 'No recent rain',
      icon: <CloudRain className="w-4 h-4 text-indigo-500" />,
      tag: 'Daily Sum',
    },
    {
      title: 'Wind Speed',
      value: `${wind_speed !== undefined ? wind_speed.toFixed(1) : '—'} km/h`,
      subtitle: wind_speed && wind_speed > 15 ? 'Breezy (Spore drift)' : 'Light surface air',
      icon: <Wind className="w-4 h-4 text-teal-600" />,
      tag: '10m Surface',
    },
    {
      title: 'Soil Moisture',
      value: `${soil_moisture !== undefined ? soil_moisture.toFixed(1) : '—'}%`,
      subtitle: 'Topsoil 0–7cm (Modeled)',
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
      tag: 'Root-zone',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Environmental Conditions
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          Live Meteorological & Rootzone Telemetry
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card, idx) => (
          <div
            key={card.title || idx}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                {card.icon}
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <div className="text-[11px] text-slate-500 pt-0.5 truncate">
                {card.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
