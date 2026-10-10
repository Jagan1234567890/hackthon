'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  description: string;
  suggestedAction?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Analysis Failed',
  description,
  suggestedAction = 'Check file format or try a smaller file, then retry.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`rounded-2xl border border-rose-500/40 bg-[oklch(0.08_0.005_280)] p-6 shadow-2xl shadow-rose-950/20 text-center flex flex-col items-center justify-center gap-3 relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />

      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 z-10 shadow-lg shadow-rose-500/10">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="z-10">
        <h4 className="text-sm font-semibold text-rose-300 tracking-tight">{title}</h4>
        <p className="text-xs text-[oklch(0.7_0.01_280)] max-w-md mx-auto mt-1 leading-relaxed">
          {description}
        </p>
        {suggestedAction && (
          <p className="text-[11px] font-mono text-[oklch(0.55_0.01_280)] mt-2">
            Suggested step: {suggestedAction}
          </p>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
}
