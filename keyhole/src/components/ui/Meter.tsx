import React from 'react';
import { clsx } from 'clsx';

interface MeterProps {
  value: number; // 0.0 to 8.0 for entropy or 0 to 100 for percentage
  max?: number;
  label?: string;
  subLabel?: string;
  showValue?: boolean;
  unit?: string;
  color?: 'violet' | 'green' | 'amber' | 'red';
  className?: string;
}

export const Meter: React.FC<MeterProps> = ({
  value,
  max = 8.0,
  label,
  subLabel,
  showValue = true,
  unit = 'bits/byte',
  color = 'violet',
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorStyles = {
    violet: 'bg-[oklch(0.62_0.22_295)] shadow-[0_0_12px_oklch(0.62_0.22_295/60%)]',
    green: 'bg-[oklch(0.72_0.17_155)] shadow-[0_0_12px_oklch(0.72_0.17_155/60%)]',
    amber: 'bg-[oklch(0.78_0.15_85)] shadow-[0_0_12px_oklch(0.78_0.15_85/60%)]',
    red: 'bg-[oklch(0.63_0.2_25)] shadow-[0_0_12px_oklch(0.63_0.2_25/60%)]',
  };

  return (
    <div className={clsx('space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-[oklch(0.85_0.01_280)]">{label}</span>
          {showValue && (
            <span className="font-mono text-[oklch(0.62_0.22_295)] font-semibold">
              {value} {unit}
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="w-full h-2 rounded-full bg-[oklch(0.11_0.008_280)] overflow-hidden p-[1px] border border-[oklch(0.22_0.01_280/60%)]"
      >
        <div
          className={clsx('h-full rounded-full transition-all duration-300', colorStyles[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {subLabel && (
        <div className="text-[11px] text-[oklch(0.66_0.015_280)]">{subLabel}</div>
      )}
    </div>
  );
};
