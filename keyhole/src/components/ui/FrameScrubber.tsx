'use client';

import React from 'react';
import { FrameAnalysis } from '@/types/authenticity';
import { clsx } from 'clsx';

interface FrameScrubberProps {
  timeline: FrameAnalysis[];
  activeFrameIndex: number;
  onSelectFrame: (index: number) => void;
  className?: string;
}

export const FrameScrubber: React.FC<FrameScrubberProps> = ({
  timeline,
  activeFrameIndex,
  onSelectFrame,
  className,
}) => {
  return (
    <div className={clsx('space-y-2 select-none', className)}>
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-[oklch(0.66_0.015_280)]">
          Timeline Scrubber ({timeline.length} Frames)
        </span>
        <span className="text-white">
          Frame #{activeFrameIndex} &bull; {timeline[activeFrameIndex]?.timestampSec.toFixed(2)}s &bull; Anomaly: {timeline[activeFrameIndex]?.anomalyScore.toFixed(3)}
        </span>
      </div>

      {/* Frame Scrubber Bar with Sparkline Heights */}
      <div className="flex items-end gap-1 h-12 p-1.5 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/80%)] overflow-x-auto">
        {timeline.map((frame) => {
          const isSelected = frame.frameIndex === activeFrameIndex;
          const score = frame.anomalyScore;
          // Colors: success (<0.35), warning (0.35-0.65), danger (>0.65)
          const barColor =
            score < 0.35
              ? 'bg-[oklch(0.72_0.17_155)]'
              : score > 0.65
              ? 'bg-[oklch(0.63_0.2_25)]'
              : 'bg-[oklch(0.78_0.15_85)]';

          const heightPercent = Math.max(15, Math.round(score * 100));

          return (
            <button
              key={frame.frameIndex}
              type="button"
              onClick={() => onSelectFrame(frame.frameIndex)}
              onMouseEnter={() => onSelectFrame(frame.frameIndex)}
              className={clsx(
                'flex-1 min-w-[20px] rounded-sm transition-all duration-150 flex flex-col justify-end items-center cursor-pointer relative group',
                isSelected ? 'ring-2 ring-white/90 scale-105 z-10' : 'opacity-80 hover:opacity-100'
              )}
              style={{ height: '100%' }}
              title={`Frame ${frame.frameIndex} (${frame.timestampSec}s) — Anomaly: ${score}`}
            >
              <div
                className={clsx('w-full rounded-sm transition-all', barColor)}
                style={{ height: `${heightPercent}%` }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
