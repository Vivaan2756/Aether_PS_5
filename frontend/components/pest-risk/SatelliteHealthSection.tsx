'use client';

import React from 'react';
import { Satellite, TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
import { EnvironmentalData, DataSourceItem } from '@/lib/pestRiskApi';

interface SatelliteHealthSectionProps {
  data: EnvironmentalData;
  satelliteSource?: DataSourceItem;
}

export default function SatelliteHealthSection({ data, satelliteSource }: SatelliteHealthSectionProps) {
  const { ndvi, ndre, ndwi, ndvi_change_7d, ndvi_change_14d } = data;

  const acqDate = satelliteSource?.acquisition_date || 'Latest';
  const hist7dDate = satelliteSource?.historical_7d_date;
  const hist14dDate = satelliteSource?.historical_14d_date;

  // Compute points for NDVI trend if historical changes exist
  const hasHistorical = ndvi_change_7d !== undefined || ndvi_change_14d !== undefined;
  const ndviCurrent = ndvi;
  const ndvi7d = ndvi_change_7d !== undefined ? Number((ndviCurrent - ndvi_change_7d).toFixed(4)) : null;
  const ndvi14d = ndvi_change_14d !== undefined ? Number((ndviCurrent - ndvi_change_14d).toFixed(4)) : null;

  const trendPoints = [
    { label: '14d', date: hist14dDate || '14d ref', value: ndvi14d },
    { label: '7d', date: hist7dDate || '7d ref', value: ndvi7d },
    { label: 'Now', date: acqDate, value: ndviCurrent },
  ].filter((p) => p.value !== null) as { label: string; date: string; value: number }[];

  // Calculate SVG chart coordinates if points are available
  const minVal = Math.min(...trendPoints.map((p) => p.value)) - 0.05;
  const maxVal = Math.max(...trendPoints.map((p) => p.value)) + 0.05;
  const range = maxVal - minVal || 1;

  const chartWidth = 500;
  const chartHeight = 120;
  const paddingX = 40;
  const paddingY = 20;

  const getX = (idx: number, total: number) => {
    if (total <= 1) return chartWidth / 2;
    return paddingX + (idx / (total - 1)) * (chartWidth - 2 * paddingX);
  };

  const getY = (val: number) => {
    return chartHeight - paddingY - ((val - minVal) / range) * (chartHeight - 2 * paddingY);
  };

  const pointsSvg = trendPoints
    .map((p, i) => `${getX(i, trendPoints.length)},${getY(p.value)}`)
    .join(' ');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Satellite vegetation health
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Sentinel-2 L2A
            </span>
          </div>
          <p className="text-xs text-slate-500 pt-0.5">
            Recent Sentinel-2 observations for this location
          </p>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Acquisition: <span className="text-slate-700 font-semibold">{acqDate}</span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* NDVI */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 tracking-wider">NDVI</span>
            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
              B8 · B4
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {ndvi.toFixed(3)}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Vegetation vigor
          </div>
        </div>

        {/* NDRE */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 tracking-wider">NDRE</span>
            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
              B8A · B5
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {ndre.toFixed(3)}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Chlorophyll response
          </div>
        </div>

        {/* NDWI */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 tracking-wider">NDWI</span>
            <span className="text-[10px] font-medium text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
              B8 · B11
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {ndwi.toFixed(3)}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Vegetation water signal
          </div>
        </div>
      </div>

      {/* NDVI Historical Trend Chart */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            NDVI Historical Trend (14d → 7d → Current)
          </span>

          {/* Change Badges */}
          <div className="flex items-center gap-3 text-xs">
            {ndvi_change_7d !== undefined && (
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">7-day change:</span>
                <span
                  className={`font-semibold ${
                    ndvi_change_7d > 0
                      ? 'text-emerald-700'
                      : ndvi_change_7d < 0
                      ? 'text-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  {ndvi_change_7d > 0 ? `+${ndvi_change_7d}` : ndvi_change_7d}
                </span>
              </div>
            )}

            {ndvi_change_14d !== undefined && (
              <div className="flex items-center gap-1 font-mono">
                <span className="text-slate-400">14-day change:</span>
                <span
                  className={`font-semibold ${
                    ndvi_change_14d > 0
                      ? 'text-emerald-700'
                      : ndvi_change_14d < 0
                      ? 'text-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  {ndvi_change_14d > 0 ? `+${ndvi_change_14d}` : ndvi_change_14d}
                </span>
              </div>
            )}
          </div>
        </div>

        {trendPoints.length >= 2 ? (
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 overflow-x-auto">
            <svg
              className="w-full h-32"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
            >
              {/* Grid horizontal guideline */}
              <line
                x1={paddingX}
                y1={chartHeight / 2}
                x2={chartWidth - paddingX}
                y2={chartHeight / 2}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {/* Trend Polyline */}
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={pointsSvg}
              />

              {/* Data points & labels */}
              {trendPoints.map((p, i) => {
                const x = getX(i, trendPoints.length);
                const y = getY(p.value);
                return (
                  <g key={p.label || i}>
                    <circle cx={x} cy={y} r="5" fill="#ffffff" stroke="#059669" strokeWidth="2.5" />
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      className="text-[11px] font-mono font-bold fill-slate-800"
                    >
                      {p.value.toFixed(3)}
                    </text>
                    <text
                      x={x}
                      y={chartHeight - 4}
                      textAnchor="middle"
                      className="text-[10px] font-medium fill-slate-500"
                    >
                      {p.label} ({p.date})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span>Historical satellite observation unavailable</span>
          </div>
        )}
      </div>
    </div>
  );
}
