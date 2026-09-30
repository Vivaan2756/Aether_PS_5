import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AlertCircle, Info, Droplets, Bug, Sprout, ShieldAlert } from 'lucide-react';

export interface AdvisoryItem {
  type?: string;
  priority?: number;
  level: 'high' | 'medium' | 'low';
  message: string;
}

export default function AdvisoryList({ advisories }: { advisories: AdvisoryItem[] }) {
  const getCategoryMeta = (type?: string, level?: string) => {
    switch (type) {
      case 'irrigation':
        return { icon: Droplets, title: 'Irrigation & Water Stress', border: 'border-blue-200', bg: 'bg-blue-50/70', badge: 'bg-blue-100 text-blue-800' };
      case 'pest_control':
        return { icon: Bug, title: 'Crop Protection & Pest Alert', border: 'border-red-200', bg: 'bg-red-50/70', badge: 'bg-red-100 text-red-800' };
      case 'yield_alert':
        return { icon: Sprout, title: 'Yield Deficit Warning', border: 'border-amber-200', bg: 'bg-amber-50/70', badge: 'bg-amber-100 text-amber-800' };
      default:
        return level === 'high'
          ? { icon: ShieldAlert, title: 'Urgent Action', border: 'border-orange-200', bg: 'bg-orange-50/70', badge: 'bg-orange-100 text-orange-800' }
          : { icon: Info, title: 'Agronomic Guidance', border: 'border-emerald-200', bg: 'bg-emerald-50/70', badge: 'bg-emerald-100 text-emerald-800' };
    }
  };

  return (
    <Card className="shadow-md border border-gray-200 bg-white">
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 text-base font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-600" />
            AI Agronomic Advisories
          </CardTitle>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {advisories.length} Action{advisories.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">
        {advisories.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            Optimal crop conditions. No urgent interventions required.
          </div>
        ) : (
          advisories.map((adv, idx) => {
            const meta = getCategoryMeta(adv.type, adv.level);
            const Icon = meta.icon;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border ${meta.border} ${meta.bg} transition-all hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white shadow-xs border border-gray-100 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-xs font-semibold text-gray-900 truncate">{meta.title}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${meta.badge}`}>
                        {adv.level} Priority
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{adv.message}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
