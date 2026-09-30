import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { TrendingUp, AlertTriangle, ShieldCheck, Sparkles, Loader2, Cpu, Satellite } from 'lucide-react';

interface YieldCardProps {
  forecast: number;
  lower: number;
  upper: number;
  unit?: string;
  uncertaintyStd?: number;
  confidence?: 'high' | 'medium' | 'low';
  prithviYield?: number;
  catboostYield?: number;
  ensembleWeights?: string;
  districtAvg?: number;
  isLoading?: boolean;
}

export default function YieldCard({
  forecast,
  lower,
  upper,
  unit = 't/ha',
  uncertaintyStd,
  confidence = 'medium',
  prithviYield,
  catboostYield,
  ensembleWeights = 'Prithvi (60%) + CatBoost (40%)',
  districtAvg = 3.10,
  isLoading = false
}: YieldCardProps) {
  const diffPercent = (((forecast - districtAvg) / districtAvg) * 100).toFixed(1);
  const isPositive = Number(diffPercent) >= 0;

  const confidenceBadge = {
    high: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: ShieldCheck, label: 'High Confidence' },
    medium: { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Sparkles, label: 'Confidence: 80%' },
    low: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle, label: 'Moderate Variance' }
  }[confidence];

  const BadgeIcon = confidenceBadge.icon;

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 shadow-md relative overflow-hidden">
      {/* Background aesthetic glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-900 text-base font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Multi-Modal Ensembled Yield
          </CardTitle>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border flex items-center gap-1 ${confidenceBadge.bg}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            {confidenceBadge.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {isLoading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-emerald-700">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm font-medium">Fusing Prithvi-EO + CatBoost Pipelines...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Blended Yield */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                  {forecast.toFixed(3)}
                </span>
                <span className="text-lg font-semibold text-emerald-700 ml-1.5">{unit}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                {ensembleWeights}
              </span>
            </div>

            {/* Model Branch Breakdown */}
            {(prithviYield !== undefined || catboostYield !== undefined) && (
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/80 border border-emerald-100 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-50 text-blue-700">
                    <Satellite className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">Prithvi-EO (60%)</div>
                    <div className="font-bold text-gray-800">
                      {prithviYield !== undefined ? `${prithviYield.toFixed(3)} ${unit}` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-50 text-amber-700">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-semibold">CatBoost (40%)</div>
                    <div className="font-bold text-gray-800">
                      {catboostYield !== undefined ? `${catboostYield.toFixed(3)} ${unit}` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confidence Interval */}
            <div className="p-2.5 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-semibold">80% Confidence Interval:</span>{' '}
                <span className="font-mono font-medium">{lower.toFixed(2)} - {upper.toFixed(2)} {unit}</span>
              </div>
              {uncertaintyStd !== undefined && (
                <div className="text-[11px] text-emerald-700 font-mono">
                  &plusmn;{uncertaintyStd.toFixed(3)}
                </div>
              )}
            </div>

            {/* District Benchmark Comparison */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-emerald-600' : 'text-amber-600'}`} />
              <span>
                <strong className={isPositive ? 'text-emerald-700' : 'text-amber-700'}>
                  {isPositive ? `+${diffPercent}%` : `${diffPercent}%`}
                </strong>{' '}
                vs District Benchmark ({districtAvg} {unit})
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
