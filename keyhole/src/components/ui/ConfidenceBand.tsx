import React from 'react';
import { clsx } from 'clsx';

interface ConfidenceBandProps {
  score: number; // 0.0 to 1.0 (manipulation likelihood)
  lower: number; // lower bound
  upper: number; // upper bound
  className?: string;
}

export const ConfidenceBand: React.FC<ConfidenceBandProps> = ({
  score,
  lower,
  upper,
  className,
}) => {
  const scorePercent = Math.round(score * 100);
  const lowerPercent = Math.round(lower * 100);
  const upperPercent = Math.round(upper * 100);
  const bandWidth = Math.max(4, upperPercent - lowerPercent);

  // Determine semantic color based on score (not violet, violet is brand)
  const isAuthentic = score < 0.35;
  const isManipulated = score > 0.65;
  const colorClass = isAuthentic
    ? 'bg-[oklch(0.72_0.17_155)]'
    : isManipulated
    ? 'bg-[oklch(0.63_0.2_25)]'
    : 'bg-[oklch(0.78_0.15_85)]';

  const bandBgClass = isAuthentic
    ? 'bg-[oklch(0.72_0.17_155/25%)]'
    : isManipulated
    ? 'bg-[oklch(0.63_0.2_25/25%)]'
    : 'bg-[oklch(0.78_0.15_85/25%)]';

  return (
    <div className={clsx('space-y-1.5 font-mono text-xs', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[oklch(0.66_0.015_280)] text-[11px]">
          Calibrated Score: <strong className="text-white">{score.toFixed(3)}</strong>
        </span>
        <span className="text-[oklch(0.55_0.01_280)] text-[10px]">
          Uncertainty Band: [{lower.toFixed(2)} — {upper.toFixed(2)}]
        </span>
      </div>

      {/* Main Track with Uncertainty Range Marker */}
      <div className="relative w-full h-3 rounded-full bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/60%)] overflow-hidden">
        {/* Shaded Uncertainty Spread */}
        <div
          className={clsx('absolute top-0 bottom-0 rounded-full transition-all duration-300', bandBgClass)}
          style={{
            left: `${lowerPercent}%`,
            width: `${bandWidth}%`,
          }}
        />

        {/* Central Calibrated Score Pin */}
        <div
          className={clsx('absolute top-0 bottom-0 w-1.5 rounded-full transition-all duration-300', colorClass)}
          style={{
            left: `calc(${scorePercent}% - 3px)`,
          }}
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-[oklch(0.55_0.01_280)] pt-0.5">
        <span>0.0 (Authentic-Consistent)</span>
        <span>0.5 (Inconclusive)</span>
        <span>1.0 (Manipulated)</span>
      </div>
    </div>
  );
};
