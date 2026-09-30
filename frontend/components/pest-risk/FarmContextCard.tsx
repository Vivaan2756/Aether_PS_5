'use client';

import React from 'react';
import { Sprout, Calendar, MapPin, ShieldAlert, ShieldCheck, ChevronDown } from 'lucide-react';
import { FarmerPredictRequest } from '@/lib/pestRiskApi';

interface FarmContextCardProps {
  crop: string;
  cropStage: string;
  latitude: number;
  longitude: number;
  previousPestIncidence: number;
  onOpenSelector: () => void;
}

export default function FarmContextCard({
  crop,
  cropStage,
  latitude,
  longitude,
  previousPestIncidence,
  onOpenSelector,
}: FarmContextCardProps) {
  const isPestPresent = previousPestIncidence === 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side: Key Context Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 flex-1">
          {/* Crop */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Crop
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{crop}</span>
            </div>
          </div>

          {/* Growth stage */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Growth stage
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{cropStage}</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Location
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 font-mono text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span>{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
            </div>
          </div>

          {/* Previous pest incidence */}
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Previous pest incidence
            </span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              {isPestPresent ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-amber-700">Present (History)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-700">None reported</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onClick={onOpenSelector}
          className="self-end sm:self-center shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Modify</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
