'use client';

import React from 'react';
import { SimpleConfidenceLevel } from '@/lib/plainCopy';
import { clsx } from 'clsx';

interface ConfidenceIndicatorProps {
  level: SimpleConfidenceLevel;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  level,
  className,
}) => {
  const steps: { label: SimpleConfidenceLevel; index: number }[] = [
    { label: 'not sure', index: 1 },
    { label: 'probably', index: 2 },
    { label: 'fairly sure', index: 3 },
  ];

  const currentIndex = level === 'fairly sure' ? 3 : level === 'probably' ? 2 : 1;

  return (
    <div
      role="img"
      aria-label={`Confidence: ${level}`}
      className={clsx('flex flex-col gap-1.5', className)}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[oklch(0.66_0.015_280)] font-sans">Confidence:</span>
        <span className="text-xs font-semibold text-white capitalize font-sans">{level}</span>
      </div>

      {/* 3-Segment Bar */}
      <div className="flex items-center gap-1.5 w-40">
        {steps.map((step) => {
          const isActive = step.index <= currentIndex;
          const isHighest = step.index === currentIndex;

          let barColor = 'bg-[oklch(0.18_0.01_280)]';
          if (isActive) {
            if (currentIndex === 3) barColor = 'bg-[oklch(0.72_0.17_155)]'; // green
            else if (currentIndex === 2) barColor = 'bg-[oklch(0.78_0.15_85)]'; // amber
            else barColor = 'bg-[oklch(0.63_0.2_25)]'; // red/low
          }

          return (
            <div
              key={step.label}
              className={clsx(
                'h-2 flex-1 rounded-sm transition-all duration-200',
                barColor,
                isHighest && 'ring-1 ring-white/50'
              )}
            />
          );
        })}
      </div>
      <div className="flex justify-between w-40 text-[10px] text-[oklch(0.66_0.015_280)] font-sans">
        <span>Not sure</span>
        <span>Probably</span>
        <span>Fairly sure</span>
      </div>
    </div>
  );
};
