'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Eye, ShieldCheck, HelpCircle } from 'lucide-react';

interface FieldRecommendationsProps {
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function FieldRecommendations({ recommendations, riskLevel }: FieldRecommendationsProps) {
  const isHigh = riskLevel === 'HIGH';
  const isMedium = riskLevel === 'MEDIUM';

  const defaultReason = isHigh
    ? 'Current model risk is above the configured alert threshold (75%).'
    : isMedium
    ? 'Moderate environmental pressure and vegetation stress indicators detected.'
    : 'Baseline conditions are within safe operational bounds.';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Field Recommendations
          </h3>
          <p className="text-xs text-slate-500 pt-0.5">
            Agronomic action guidance driven by model risk level and top contributing SHAP factors
          </p>
        </div>

        <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          Integrated Pest Management (IPM)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-start gap-3"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-800 shrink-0 mt-0.5">
                <CheckCircle className="w-4 h-4" />
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="text-xs font-bold text-slate-900 leading-snug">
                  {rec}
                </div>

                <div className="text-[11px] text-slate-500 flex items-start gap-1">
                  <span className="font-semibold text-slate-600">Reason:</span>
                  <span>{defaultReason}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
            Standard regular monitoring schedule recommended.
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Agronomic advisory follows conservative non-chemical scouting protocols.</span>
        <span>No synthetic pesticide dosage prescribed.</span>
      </div>
    </div>
  );
}
