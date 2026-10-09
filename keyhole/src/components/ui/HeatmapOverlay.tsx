'use client';

import React from 'react';
import { FrameAnalysis } from '@/types/authenticity';
import { clsx } from 'clsx';

interface HeatmapOverlayProps {
  frame?: FrameAnalysis;
  showHeatmap: boolean;
  className?: string;
}

export const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  frame,
  showHeatmap,
  className,
}) => {
  if (!showHeatmap || !frame || !frame.heatmapBoundingBox) return null;

  const box = frame.heatmapBoundingBox;
  const isHighAnomaly = frame.anomalyScore > 0.65;
  const isModerate = frame.anomalyScore >= 0.35 && frame.anomalyScore <= 0.65;

  const outlineColor = isHighAnomaly
    ? 'border-[oklch(0.63_0.2_25)]'
    : isModerate
    ? 'border-[oklch(0.78_0.15_85)]'
    : 'border-[oklch(0.72_0.17_155)]';

  const overlayBg = isHighAnomaly
    ? 'bg-[oklch(0.63_0.2_25/25%)]'
    : isModerate
    ? 'bg-[oklch(0.78_0.15_85/20%)]'
    : 'bg-[oklch(0.72_0.17_155/15%)]';

  return (
    <div className={clsx('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {/* Dynamic Suspicious Region Boundary */}
      <div
        className={clsx(
          'absolute rounded-xl border-2 transition-all duration-200 backdrop-blur-[2px] flex items-start justify-end p-1.5',
          outlineColor,
          overlayBg
        )}
        style={{
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
        }}
      >
        <span
          className={clsx(
            'font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow',
            isHighAnomaly
              ? 'bg-[oklch(0.63_0.2_25)] text-white'
              : 'bg-[oklch(0.78_0.15_85)] text-black'
          )}
        >
          ANOMALY {(frame.anomalyScore * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
