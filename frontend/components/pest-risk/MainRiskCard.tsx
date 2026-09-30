'use client';

import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, BellRing, BellOff } from 'lucide-react';
import { PestRiskResponse } from '@/lib/pestRiskApi';

interface MainRiskCardProps {
  data: PestRiskResponse;
}

export default function MainRiskCard({ data }: MainRiskCardProps) {
  const { outbreak_probability, risk_percentage, risk_level, alert } = data;
  const percentage = risk_percentage ?? Math.round(outbreak_probability * 10000) / 100;

  const isHigh = risk_level === 'HIGH';
  const isMedium = risk_level === 'MEDIUM';

  // Strict visual color definitions: Red only for HIGH/alerts, Amber for warnings, Muted green for LOW
  const config = isHigh
    ? {
        badgeBg: 'bg-rose-50',
        badgeText: 'text-rose-700',
        badgeBorder: 'border-rose-200',
        ringColor: '#e11d48', // rose-600
        ringBg: '#ffe4e6', // rose-100
        levelLabel: 'HIGH RISK',
        bannerBg: 'bg-rose-50/80',
        bannerBorder: 'border-rose-200',
        bannerText: 'text-rose-800',
        bannerIcon: <BellRing className="w-4 h-4 text-rose-600 shrink-0" />,
        bannerTitle: 'Early-warning alert triggered',
        bannerDesc: 'Model risk score is above the 75% configured threshold. Immediate field scouting recommended.',
      }
    : isMedium
    ? {
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-800',
        badgeBorder: 'border-amber-200',
        ringColor: '#d97706', // amber-600
        ringBg: '#fef3c7', // amber-100
        levelLabel: 'MEDIUM RISK',
        bannerBg: 'bg-amber-50/70',
        bannerBorder: 'border-amber-200',
        bannerText: 'text-amber-800',
        bannerIcon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
        bannerTitle: 'Moderate pressure window',
        bannerDesc: 'Environmental parameters favor increased pest activity. Maintain regular monitoring.',
      }
    : {
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-800',
        badgeBorder: 'border-emerald-200',
        ringColor: '#059669', // emerald-600
        ringBg: '#d1fae5', // emerald-100
        levelLabel: 'LOW RISK',
        bannerBg: 'bg-slate-50',
        bannerBorder: 'border-slate-200',
        bannerText: 'text-slate-700',
        bannerIcon: <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />,
        bannerTitle: 'Normal conditions',
        bannerDesc: 'Environmental and vegetation signals indicate low probability of rapid pest proliferation.',
      };

  // Circular ring calculations (radius = 48, circumference = 2 * PI * 48 = 301.59)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Pest outbreak risk
          </span>
          <span className="text-[11px] text-slate-500">
            Model risk score evaluation
          </span>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} tracking-wide`}
        >
          {config.levelLabel}
        </span>
      </div>

      {/* Center: Prominent Percentage & Circular Ring */}
      <div className="flex items-center justify-center gap-6 py-2">
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
            {/* Background track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={config.ringBg}
              strokeWidth="10"
              fill="none"
            />
            {/* Value stroke */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              stroke={config.ringColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {percentage.toFixed(1)}%
            </span>
            <span className="text-[10px] font-medium text-slate-500">
              Risk Score
            </span>
          </div>
        </div>

        <div className="space-y-1.5 flex-1 max-w-[200px]">
          <div className="text-sm font-semibold text-slate-900">
            {isHigh ? 'High Outbreak Probability' : isMedium ? 'Moderate Pressure' : 'Favorable Baseline'}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Evaluated from 19 real environmental, vegetation, and soil features.
          </p>
        </div>
      </div>

      {/* Alert Status Banner */}
      <div className={`p-3.5 rounded-lg border ${config.bannerBg} ${config.bannerBorder} space-y-1`}>
        <div className="flex items-center gap-2">
          {config.bannerIcon}
          <span className={`text-xs font-bold ${config.bannerText}`}>
            {config.bannerTitle}
          </span>
        </div>
        <p className="text-[11px] text-slate-600 pl-6 leading-normal">
          {config.bannerDesc}
        </p>
      </div>

      {/* Footer: Alert Threshold info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Alert threshold: <strong className="text-slate-700 font-semibold">75%</strong></span>
        <span className="text-[11px] text-slate-400">Configured early-warning level</span>
      </div>
    </div>
  );
}
