'use client';

import React from 'react';

export interface MetricBadgeProps {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
  variant?: 'violet' | 'green' | 'yellow' | 'red' | 'grey';
  className?: string;
}

export function MetricBadge({
  icon,
  value,
  label,
  variant = 'violet',
  className = '',
}: MetricBadgeProps) {
  const variantStyles = {
    violet: 'border-[oklch(0.62_0.22_295/35%)] bg-[oklch(0.62_0.22_295/10%)] text-[oklch(0.62_0.22_295)]',
    green: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-400',
    yellow: 'border-amber-500/35 bg-amber-500/10 text-amber-400',
    red: 'border-rose-500/35 bg-rose-500/10 text-rose-400',
    grey: 'border-white/20 bg-white/5 text-[oklch(0.66_0.015_280)]',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-sans transition-all hover:scale-105 ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="font-mono font-bold text-white tracking-tight">{value}</span>
      <span className="text-[11px] opacity-80">{label}</span>
    </div>
  );
}
