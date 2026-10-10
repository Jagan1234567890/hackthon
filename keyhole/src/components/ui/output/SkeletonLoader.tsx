'use client';

import React from 'react';

export interface SkeletonLoaderProps {
  lines?: number;
  type?: 'card' | 'table' | 'text' | 'media';
  className?: string;
}

export function SkeletonLoader({
  lines = 3,
  type = 'card',
  className = '',
}: SkeletonLoaderProps) {
  if (type === 'media') {
    return (
      <div className={`rounded-2xl border border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.08_0.005_280)] p-6 space-y-4 animate-pulse ${className}`}>
        <div className="w-full h-48 rounded-xl bg-gradient-to-r from-[oklch(0.12_0.01_280)] via-[oklch(0.16_0.02_295/30%)] to-[oklch(0.12_0.01_280)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]" />
        <div className="h-4 w-2/3 rounded bg-[oklch(0.14_0.01_280)]" />
        <div className="h-3 w-1/2 rounded bg-[oklch(0.12_0.01_280)]" />
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`rounded-xl border border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.08_0.005_280)] p-4 space-y-3 animate-pulse ${className}`}>
        <div className="h-6 w-1/3 rounded bg-[oklch(0.14_0.01_280)] mb-4" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-1/4 rounded bg-[oklch(0.12_0.01_280)]" />
            <div className="h-4 w-1/2 rounded bg-[oklch(0.11_0.008_280)]" />
            <div className="h-4 w-1/4 rounded bg-[oklch(0.12_0.01_280)]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.08_0.005_280)] p-5 space-y-3 animate-pulse ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[oklch(0.14_0.01_280)]" />
        <div className="h-4 w-40 rounded bg-[oklch(0.14_0.01_280)]" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-[oklch(0.12_0.01_280)]"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}
