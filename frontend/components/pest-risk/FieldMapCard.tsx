'use client';

import React from 'react';
import { MapPin, Navigation, Maximize2, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface FieldMapCardProps {
  latitude: number;
  longitude: number;
  crop: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  percentage: number;
}

export default function FieldMapCard({
  latitude,
  longitude,
  crop,
  riskLevel,
  percentage,
}: FieldMapCardProps) {
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const riskBadgeColor = isHigh
    ? 'bg-rose-500 text-white'
    : isMedium
    ? 'bg-amber-500 text-white'
    : 'bg-emerald-600 text-white';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Field Location & GIS Coordinates
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E</span>
        </div>
      </div>

      {/* Styled Clean Map Container */}
      <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
        {/* Subtle SVG Grid background representing geospatial agricultural parcel */}
        <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-map-light" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#cbd5e1" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#f1f5f9" />
          <rect width="100%" height="100%" fill="url(#grid-map-light)" />
          {/* Simulated field parcel outlines */}
          <polygon points="40,30 200,45 180,140 30,120" fill="#e2e8f0" opacity="0.6" />
          <polygon points="210,40 380,30 360,130 190,145" fill="#d1fae5" opacity="0.4" />
          <polygon points="50,135 220,150 200,200 40,190" fill="#e2e8f0" opacity="0.5" />
        </svg>

        {/* Center Farm Marker & Risk Indicator */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            {/* Pulsing ring */}
            <span
              className={`absolute -inset-2 rounded-full animate-ping opacity-40 ${
                isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {/* Marker Icon */}
            <div className={`w-9 h-9 rounded-full ${riskBadgeColor} shadow-md flex items-center justify-center`}>
              <Navigation className="w-4 h-4 transform rotate-45" />
            </div>
          </div>

          {/* Info Popup Badge */}
          <div className="mt-2 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md px-3 py-1.5 text-center space-y-0.5">
            <div className="text-[11px] font-bold text-slate-800">
              {crop} Parcel · {percentage.toFixed(1)}% Risk
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Lat: {latitude.toFixed(4)} | Lon: {longitude.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Top-Right AOI Footprint label */}
        <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded bg-white/90 backdrop-blur-sm border border-slate-200 text-[10px] font-semibold text-slate-600 shadow-sm">
          AOI Radius: 100m
        </div>
      </div>
    </div>
  );
}
