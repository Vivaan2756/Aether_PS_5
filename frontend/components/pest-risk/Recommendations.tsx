'use client';

import React from 'react';
import { ClipboardCheck, Shield, CheckCircle } from 'lucide-react';

interface RecommendationsProps {
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function Recommendations({ recommendations, riskLevel }: RecommendationsProps) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const isHigh = riskLevel === 'HIGH';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Recommended Action Steps</h3>
          <p className="text-sm text-slate-400">
            Integrated Pest Management (IPM) guidelines tailored to current field risk and environmental signals.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
              isHigh
                ? 'bg-slate-950/70 border-slate-800 hover:border-rose-900/50'
                : 'bg-slate-950/70 border-slate-800 hover:border-emerald-900/50'
            }`}
          >
            <div className="mt-0.5">
              <CheckCircle className={`w-5 h-5 ${isHigh ? 'text-rose-400' : 'text-emerald-400'}`} />
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">{rec}</p>
          </div>
        ))}
      </div>

      {/* Advisory & Responsible ML Disclaimer */}
      <div className="flex items-start gap-3 bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400">
        <Shield className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-semibold text-slate-300">Responsible Agronomic Advisory Notice:</span>
          <p>
            This system does not prescribe chemical pesticide application rates or diagnose specific pest species without visual entomological inspection. Always physically scout affected plants and consult your local agricultural extension officer before applying chemical treatments.
          </p>
        </div>
      </div>
    </div>
  );
}
