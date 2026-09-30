'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Context Bar Skeleton */}
      <div className="h-20 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Aggregating real Open-Meteo weather, Sentinel-2 STAC imagery, and ISRIC soil telemetry...</span>
        </div>
      </div>

      {/* Main 2-Column Risk & SHAP Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="h-4 w-32 bg-slate-100 rounded" />
          <div className="h-28 w-28 mx-auto rounded-full bg-slate-100" />
          <div className="h-12 bg-slate-50 rounded-lg" />
        </div>

        <div className="h-72 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="h-4 w-48 bg-slate-100 rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-slate-100 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Environmental Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-200 shadow-sm" />
        ))}
      </div>

      {/* Satellite Health Skeleton */}
      <div className="h-64 bg-white rounded-xl border border-slate-200 shadow-sm" />
    </div>
  );
}
