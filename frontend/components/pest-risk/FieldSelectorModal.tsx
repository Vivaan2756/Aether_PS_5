'use client';

import React, { useState } from 'react';
import { X, MapPin, Sprout, Calendar, ShieldAlert, Sparkles, Loader2, Check } from 'lucide-react';
import { FarmerPredictRequest } from '@/lib/pestRiskApi';

interface FieldSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FarmerPredictRequest) => void;
  isLoading: boolean;
  currentValues: FarmerPredictRequest;
}

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Soybean', 'Maize'];
const CROP_STAGES = ['Tillering/Branching', 'Vegetative', 'Flowering', 'Maturity', 'Harvest'];

const PRESETS = [
  {
    name: 'Haryana Agri Belt (Validated Real Telemetry)',
    lat: 29.0588,
    lon: 76.0856,
    crop: 'Wheat',
    stage: 'Vegetative',
    previousPest: 1,
    desc: 'Clear Sentinel-2 scenes, active SoilGrids & live weather telemetry',
  },
  {
    name: 'Maharashtra Agri Belt (Validated Real Telemetry)',
    lat: 19.8500,
    lon: 75.3000,
    crop: 'Wheat',
    stage: 'Vegetative',
    previousPest: 1,
    desc: 'ISRIC SoilGrids pH=6.9, N=1.37 g/kg, clear Sentinel-2 acquisition',
  },
  {
    name: 'Ahmednagar Cotton Farmlands',
    lat: 19.1000,
    lon: 74.7000,
    crop: 'Cotton',
    stage: 'Vegetative',
    previousPest: 0,
    desc: 'Maharashtra rural cotton parcel',
  },
  {
    name: 'Punjab Ludhiana Center (Urban / Null SoilGrids Demo)',
    lat: 30.9010,
    lon: 75.8570,
    crop: 'Wheat',
    stage: 'Tillering/Branching',
    previousPest: 1,
    desc: 'Urban centroid returning null SoilGrids (422 test)',
  },
];

export default function FieldSelectorModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  currentValues,
}: FieldSelectorModalProps) {
  const [lat, setLat] = useState<number>(currentValues.latitude);
  const [lon, setLon] = useState<number>(currentValues.longitude);
  const [crop, setCrop] = useState<string>(currentValues.crop);
  const [stage, setStage] = useState<string>(currentValues.crop_stage);
  const [previousPest, setPreviousPest] = useState<number>(currentValues.previous_pest_incidence);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setLat(preset.lat);
    setLon(preset.lon);
    setCrop(preset.crop);
    setStage(preset.stage);
    setPreviousPest(preset.previousPest);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      latitude: lat,
      longitude: lon,
      crop,
      crop_stage: stage,
      previous_pest_incidence: previousPest,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Select Field Location & Crop
            </h3>
            <p className="text-xs text-slate-500 pt-0.5">
              Choose an agricultural preset or input custom farm coordinates
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Validated Agricultural Presets
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PRESETS.map((p) => {
              const isSelected = lat === p.lat && lon === p.lon && crop === p.crop;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-left p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {p.crop} · {p.stage} · ({p.lat.toFixed(4)}, {p.lon.toFixed(4)})
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Form Parameters */}
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-2 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lon}
                onChange={(e) => setLon(parseFloat(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Crop</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">Growth Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {CROP_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Previous Pest History
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreviousPest(0)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  previousPest === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                No Previous Outbreak (0)
              </button>
              <button
                type="button"
                onClick={() => setPreviousPest(1)}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                  previousPest === 1
                    ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Previous Outbreak Present (1)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Real Telemetry...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Intelligence Model</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
