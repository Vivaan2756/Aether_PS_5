'use client';

import React from 'react';
import { Activity, Sliders, RefreshCw, AlertCircle } from 'lucide-react';

interface HeaderProps {
  onOpenSelector: () => void;
  isLoading: boolean;
  hasResult: boolean;
}

export default function Header({ onOpenSelector, isLoading, hasResult }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Pest Risk Intelligence
          </h1>
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Precision Ag
          </span>
        </div>
        <p className="text-xs text-slate-500">
          AI-powered crop health and pest outbreak monitoring
        </p>
      </div>

      <div className="flex items-center gap-3 self-start sm:self-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live environmental data
        </div>

        <button
          type="button"
          onClick={onOpenSelector}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span>{hasResult ? 'Change Field' : 'Select Field'}</span>
        </button>
      </div>
    </header>
  );
}
