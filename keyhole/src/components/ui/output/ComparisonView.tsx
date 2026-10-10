'use client';

import React from 'react';
import { ArrowLeftRight, Check, X } from 'lucide-react';

export interface ComparisonMetric {
  label: string;
  leftValue: string | number;
  rightValue: string | number;
  leftBetter?: boolean;
  rightBetter?: boolean;
}

export interface ComparisonViewProps {
  leftTitle: string;
  rightTitle: string;
  leftSubtitle?: string;
  rightSubtitle?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  metrics?: ComparisonMetric[];
  className?: string;
}

export function ComparisonView({
  leftTitle,
  rightTitle,
  leftSubtitle,
  rightSubtitle,
  leftContent,
  rightContent,
  metrics,
  className = '',
}: ComparisonViewProps) {
  return (
    <div className={`rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] overflow-hidden ${className}`}>
      {/* Side-by-side header */}
      <div className="grid grid-cols-2 divide-x divide-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.11_0.008_280)] border-b border-[oklch(0.22_0.01_280/60%)]">
        <div className="p-4">
          <span className="text-[10px] font-mono uppercase text-blue-400 block mb-0.5">Left Baseline</span>
          <h4 className="text-sm font-semibold text-white">{leftTitle}</h4>
          {leftSubtitle && <p className="text-xs text-[oklch(0.66_0.015_280)] mt-0.5">{leftSubtitle}</p>}
        </div>
        <div className="p-4">
          <span className="text-[10px] font-mono uppercase text-purple-400 block mb-0.5">Right Candidate</span>
          <h4 className="text-sm font-semibold text-white">{rightTitle}</h4>
          {rightSubtitle && <p className="text-xs text-[oklch(0.66_0.015_280)] mt-0.5">{rightSubtitle}</p>}
        </div>
      </div>

      {/* Visual content if provided (e.g. images or graphs) */}
      {(leftContent || rightContent) && (
        <div className="grid grid-cols-2 divide-x divide-[oklch(0.22_0.01_280/50%)] p-4 border-b border-[oklch(0.22_0.01_280/40%)]">
          <div className="pr-2">{leftContent}</div>
          <div className="pl-2">{rightContent}</div>
        </div>
      )}

      {/* Matching metrics table */}
      {metrics && metrics.length > 0 && (
        <div className="divide-y divide-[oklch(0.22_0.01_280/30%)]">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 py-2.5 px-4 text-xs transition-colors hover:bg-[oklch(0.12_0.01_280)] items-center"
            >
              <div className="col-span-5 flex items-center justify-between pr-4">
                <span className={`font-mono ${m.leftBetter ? 'text-emerald-400 font-bold' : 'text-white'}`}>
                  {m.leftValue}
                </span>
                {m.leftBetter && <span className="text-[10px] text-emerald-400">✓ Better</span>}
              </div>

              <div className="col-span-2 text-center text-[11px] font-sans text-[oklch(0.66_0.015_280)]">
                {m.label}
              </div>

              <div className="col-span-5 flex items-center justify-between pl-4">
                {m.rightBetter && <span className="text-[10px] text-emerald-400">✓ Better</span>}
                <span className={`font-mono ml-auto ${m.rightBetter ? 'text-emerald-400 font-bold' : 'text-white'}`}>
                  {m.rightValue}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
