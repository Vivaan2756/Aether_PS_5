'use client';

import React from 'react';
import { HelpCircle, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { TopFactor } from '@/lib/pestRiskApi';

interface ShapContributionCardProps {
  factors: TopFactor[];
}

export default function ShapContributionCard({ factors }: ShapContributionCardProps) {
  const top5 = (factors || []).slice(0, 5);

  // Determine max absolute SHAP value for scaling bars proportionately
  const maxAbsShap = Math.max(...top5.map((f) => Math.abs(f.shap_value || 0)), 1.0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-5 h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Why is the model flagging this field?
          </h3>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            TreeSHAP
          </span>
        </div>
        <p className="text-xs text-slate-500 pt-0.5">
          Top features influencing the risk score relative to model baseline
        </p>
      </div>

      {/* Horizontal Factor Contribution Bars */}
      <div className="space-y-3.5 flex-1 justify-center flex flex-col">
        {top5.map((factor, idx) => {
          const isIncrease = factor.direction === 'increases_risk' || factor.shap_value > 0;
          const absVal = Math.abs(factor.shap_value || 0);
          const barWidthPercent = Math.min(100, Math.max(8, (absVal / maxAbsShap) * 100));

          return (
            <div key={factor.feature || idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span>{factor.label || factor.feature}</span>
                  {factor.value !== undefined && factor.value !== '' && (
                    <span className="text-[11px] text-slate-400 font-mono font-normal">
                      ({String(factor.value)})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 font-mono font-semibold text-xs">
                  {isIncrease ? (
                    <span className="text-rose-600 flex items-center">
                      <ArrowUpRight className="w-3 h-3" />
                      +{absVal.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-emerald-700 flex items-center">
                      <ArrowDownRight className="w-3 h-3" />
                      -{absVal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Bar track */}
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex items-center">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isIncrease ? 'bg-rose-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Informational Note as requested */}
      <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          SHAP values explain how features contributed to this model prediction. They do not establish biological causation.
        </p>
      </div>
    </div>
  );
}
