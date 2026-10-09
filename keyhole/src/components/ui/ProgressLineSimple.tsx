'use client';

import React from 'react';
import { Pause, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { BtnGhost } from './BtnGhost';

interface ProgressLineSimpleProps {
  checkedCount: number;
  estimatedMinutesLeft: number;
  isPaused?: boolean;
  onTogglePause?: () => void;
  className?: string;
}

export const ProgressLineSimple: React.FC<ProgressLineSimpleProps> = ({
  checkedCount,
  estimatedMinutesLeft,
  isPaused = false,
  onTogglePause,
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={clsx(
        'flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[oklch(0.06_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] text-sm font-sans',
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.62_0.22_295)] animate-pulse" />
        <span className="text-[oklch(0.9_0_0)]">
          Checked {checkedCount.toLocaleString()} guesses.{' '}
          <span className="text-[oklch(0.66_0.015_280)]">
            About {estimatedMinutesLeft} {estimatedMinutesLeft === 1 ? 'minute' : 'minutes'} left.
          </span>
        </span>
      </div>

      {onTogglePause && (
        <BtnGhost
          onClick={onTogglePause}
          className="flex items-center gap-1.5 py-1 px-2.5 text-xs font-sans text-white hover:border-[oklch(0.4_0.12_295/50%)]"
        >
          {isPaused ? (
            <>
              <Play className="w-3 h-3 text-[oklch(0.72_0.17_155)]" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-[oklch(0.78_0.15_85)]" />
              <span>Pause</span>
            </>
          )}
        </BtnGhost>
      )}
    </div>
  );
};
