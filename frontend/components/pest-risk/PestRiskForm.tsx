'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Sprout, AlertCircle, Loader2 } from 'lucide-react';
import { FarmerPredictRequest } from '@/lib/pestRiskApi';

interface PestRiskFormProps {
  onSubmit: (data: FarmerPredictRequest) => void;
  isLoading: boolean;
}

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Soybean', 'Maize'];
const CROP_STAGES = [
  'Tillering/Branching',
  'Vegetative',
  'Flowering',
  'Maturity',
  'Harvest'
];

const PRESETS = [
  { name: 'Maharashtra Agri Belt (Real Validated)', lat: 19.85, lon: 75.30, crop: 'Wheat', stage: 'Vegetative' },
  { name: 'Ahmednagar Farmlands', lat: 19.10, lon: 74.70, crop: 'Cotton', stage: 'Vegetative' },
  { name: 'Punjab Ludhiana Center (Urban / Null SoilGrids)', lat: 30.901, lon: 75.857, crop: 'Wheat', stage: 'Tillering/Branching' },
  { name: 'Madhya Pradesh Soybean', lat: 23.181, lon: 77.412, crop: 'Soybean', stage: 'Vegetative' },
];

export default function PestRiskForm({ onSubmit, isLoading }: PestRiskFormProps) {
  const [latitude, setLatitude] = useState<number>(19.85);
  const [longitude, setLongitude] = useState<number>(75.30);
  const [crop, setCrop] = useState<string>('Wheat');
  const [cropStage, setCropStage] = useState<string>('Vegetative');
  const [previousPest, setPreviousPest] = useState<number>(1);
  const [locating, setLocating] = useState<boolean>(false);
  const [locError, setLocError] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(4)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(4)));
        setLocating(false);
      },
      (err) => {
        setLocError(`Could not access GPS location: ${err.message}`);
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setLatitude(preset.lat);
    setLongitude(preset.lon);
    setCrop(preset.crop);
    setCropStage(preset.stage);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      latitude,
      longitude,
      crop,
      crop_stage: cropStage,
      previous_pest_incidence: previousPest
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Farmer Field Details</h2>
          <p className="text-sm text-slate-400">Enter farm location and crop stage — weather, satellite, and soil data are retrieved automatically.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Farm Location Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Farm Location
            </label>
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              {locating ? 'Detecting GPS...' : 'Use Current Location'}
            </button>
          </div>

          {locError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {locError}
            </div>
          )}

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 self-center mr-1">Quick Select:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handlePresetSelect(p)}
                className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 transition-all text-[11px]"
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Lat/Lon coordinate inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Latitude (°N)</label>
              <input
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                placeholder="e.g. 19.0760"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Longitude (°E)</label>
              <input
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                placeholder="e.g. 72.8777"
              />
            </div>
          </div>
        </div>

        {/* Crop Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Crop Type</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Crop Growth Stage</label>
            <select
              value={cropStage}
              onChange={(e) => setCropStage(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {CROP_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Previous Pest Incidence */}
        <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-200">
            Have you observed pests in this field recently?
          </label>
          <div className="flex items-center gap-6">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="radio"
                name="previous_pest"
                checked={previousPest === 0}
                onChange={() => setPreviousPest(0)}
                className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-2"
              />
              <span className="text-sm font-medium">No (Clean field)</span>
            </label>
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="radio"
                name="previous_pest"
                checked={previousPest === 1}
                onChange={() => setPreviousPest(1)}
                className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 focus:ring-2"
              />
              <span className="text-sm font-medium">Yes (Pests or damage seen)</span>
            </label>
          </div>
          <p className="text-xs text-slate-400">
            Past pest pressure helps the model assess carryover risk, egg deposits, or localized breeding spots.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-950/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Gathering Satellite, Weather & Soil Data...</span>
            </>
          ) : (
            <span>Analyze Pest Risk</span>
          )}
        </button>
      </form>
    </div>
  );
}
