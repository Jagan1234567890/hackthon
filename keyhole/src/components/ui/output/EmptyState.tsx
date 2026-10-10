'use client';

import React from 'react';
import { Inbox, Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-[oklch(0.22_0.01_280/80%)] bg-[oklch(0.08_0.005_280)] p-8 text-center flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[oklch(0.62_0.22_295/10%)] border border-[oklch(0.62_0.22_295/30%)] flex items-center justify-center text-[oklch(0.62_0.22_295)] shadow-lg shadow-purple-500/10">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
        <p className="text-xs text-[oklch(0.66_0.015_280)] max-w-sm mx-auto mt-1 leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[oklch(0.62_0.22_295)] hover:bg-[oklch(0.58_0.24_295)] text-white text-xs font-semibold shadow-lg shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
