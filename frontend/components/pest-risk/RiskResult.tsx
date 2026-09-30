'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, MapPin } from 'lucide-react';
import { PestRiskResponse } from '@/lib/pestRiskApi';

interface RiskResultProps {
  data: PestRiskResponse;
}

export default function RiskResult({ data }: RiskResultProps) {
  const { outbreak_probability, risk_percentage, risk_level, alert, crop, crop_stage, location } = data;

  const isHigh = risk_level === 'HIGH';
  const isMedium = risk_level === 'MEDIUM';

  const riskConfig = isHigh
    ? {
        bgColor: 'bg-rose-950/40',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/20',
        badgeBorder: 'border-rose-500/30',
        badgeText: 'text-rose-300',
        icon: <ShieldAlert className="w-8 h-8 text-rose-400" />,
        statusTitle: 'HIGH RISK OUTBREAK DETECTED',
      }
    : isMedium
    ? {
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-500/40',
        textColor: 'text-amber-400',
        badgeBg: 'bg-amber-500/20',
        badgeBorder: 'border-amber-500/30',
        badgeText: 'text-amber-300',
        icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
        statusTitle: 'MODERATE PEST PRESSURE',
      }
    : {
        bgColor: 'bg-emerald-950/40',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20',
        badgeBorder: 'border-emerald-500/30',
        badgeText: 'text-emerald-300',
        icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
        statusTitle: 'LOW PEST RISK',
      };

  return (
    <div
      className={`rounded-2xl border ${riskConfig.borderColor} ${riskConfig.bgColor} p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden transition-all`}
    >
      {/* Background glow */}
      <div
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none ${
          isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
      />

      <div className="relative z-10 space-y-6">
        {/* Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">{riskConfig.icon}</div>
            <div>
              <span className={`text-xs font-bold uppercase tracking-wider ${riskConfig.textColor}`}>
                Assessment Summary
              </span>
              <h3 className="text-lg font-bold text-white">{riskConfig.statusTitle}</h3>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${riskConfig.badgeBg} ${riskConfig.badgeBorder} ${riskConfig.badgeText}`}
          >
            {isHigh ? '🚨 Alert Level: High' : isMedium ? '⚠️ Warning: Moderate' : '✅ Status: Normal'}
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black text-white tracking-tight">
                {risk_percentage.toFixed(1)}%
              </span>
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                Outbreak Probability
              </span>
            </div>

            {/* Progress indicator bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isHigh
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : isMedium
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, risk_percentage))}%` }}
              />
            </div>
          </div>

          {/* Farm context metadata */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Target Crop:</span>
              <span className="font-semibold text-white">{crop}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Growth Stage:</span>
              <span className="font-semibold text-emerald-400">{crop_stage}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location:
              </span>
              <span className="font-mono text-xs text-slate-300">
                {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>

        {/* High Risk Alert Banner */}
        {alert && (
          <div className="bg-rose-900/30 border border-rose-600/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300">Application Alert Triggered (≥ 75% Threshold):</span>
              <p className="mt-0.5 text-rose-200/90 leading-relaxed">
                Conditions are exceptionally conducive for pest proliferation. Please prioritize scouting this parcel. Note that this threshold is a proactive decision-support flag based on synthetic benchmark data.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
