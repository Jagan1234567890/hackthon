'use client';

import React from 'react';

export interface ConfidenceRingProps {
  percentage: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceRing({
  percentage,
  size = 48,
  strokeWidth = 4,
  showLabel = false,
  className = '',
}: ConfidenceRingProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  // Color classification based on specification:
  // Violet/Green: high confidence (>85%)
  // Yellow: medium confidence (60-85%)
  // Red: low confidence (<60%)
  let strokeColor = 'oklch(0.62 0.22 295)'; // Electric violet
  let labelText = 'High Confidence';
  let labelColor = 'text-purple-300';

  if (clamped >= 90) {
    strokeColor = 'oklch(0.72 0.17 155)'; // Emerald
    labelText = 'Verified (>90%)';
    labelColor = 'text-emerald-400';
  } else if (clamped >= 75) {
    strokeColor = 'oklch(0.62 0.22 295)'; // Violet
    labelText = 'High Confidence';
    labelColor = 'text-purple-300';
  } else if (clamped >= 50) {
    strokeColor = 'oklch(0.78 0.15 85)'; // Yellow
    labelText = 'Medium Confidence';
    labelColor = 'text-amber-400';
  } else {
    strokeColor = 'oklch(0.63 0.2 25)'; // Red
    labelText = 'Low Confidence';
    labelColor = 'text-rose-400';
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="oklch(0.2 0.01 280)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span
          className="absolute font-mono font-bold text-white tracking-tight"
          style={{ fontSize: Math.max(9, Math.round(size * 0.28)) }}
        >
          {clamped}%
        </span>
      </div>
      {showLabel && (
        <span className={`text-[10px] font-mono mt-1 ${labelColor}`}>
          {labelText}
        </span>
      )}
    </div>
  );
}
