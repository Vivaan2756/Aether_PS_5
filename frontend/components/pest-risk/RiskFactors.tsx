'use client';

import React from 'react';
import { Activity, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { TopFactor } from '@/lib/pestRiskApi';

interface RiskFactorsProps {
  factors: TopFactor[];
}

export default function RiskFactors({ factors }: RiskFactorsProps) {
  if (!factors || factors.length === 0) {
    return null;
  }

  // Find max absolute SHAP value for scaling bars
  const maxAbsShap = Math.max(...factors.map((f) => Math.abs(f.shap_value)), 0.1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Why is the risk at this level?</h3>
            <p className="text-sm text-slate-400">
              Explainable AI (SHAP) reveals the primary environmental & field drivers influencing the prediction.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-500" /> Increases Risk
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500 ml-2" /> Lowers Risk
        </div>
      </div>

      <div className="space-y-4">
        {factors.map((factor, index) => {
          const isIncrease = factor.direction === 'increases_risk';
          const relativePercentage = Math.min(100, Math.max(12, (Math.abs(factor.shap_value) / maxAbsShap) * 100));

          return (
            <div
              key={`${factor.feature}-${index}`}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-4 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 text-sm">{factor.label}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Measured: {String(factor.value)}
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md ${
                    isIncrease
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {isIncrease ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{isIncrease ? '+ Increases Risk' : '- Lowers Risk'}</span>
                  <span className="font-mono ml-1 text-[11px] opacity-80">
                    (SHAP: {factor.shap_value > 0 ? '+' : ''}
                    {factor.shap_value.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Visual SHAP Impact Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isIncrease
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                  }`}
                  style={{ width: `${relativePercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
        <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
        <span>
          SHAP values isolate each feature&apos;s contribution to the XGBoost tree ensemble relative to average crop baselines.
        </span>
      </div>
    </div>
  );
}
