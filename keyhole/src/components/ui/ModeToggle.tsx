'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';

export type DisplayMode = 'simple' | 'expert';

interface ModeToggleProps {
  mode?: DisplayMode;
  onChange?: (mode: DisplayMode) => void;
  className?: string;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({
  mode: propMode,
  onChange,
  className,
}) => {
  const [internalMode, setInternalMode] = useState<DisplayMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('keyhole_display_mode');
      if (saved === 'expert' || saved === 'simple') return saved;
    }
    return 'simple';
  });

  const activeMode = propMode ?? internalMode;

  const handleSelect = (newMode: DisplayMode) => {
    setInternalMode(newMode);
    localStorage.setItem('keyhole_display_mode', newMode);
    if (onChange) onChange(newMode);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Display Mode"
      className={clsx(
        'inline-flex items-center p-0.5 rounded-full glass border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.04_0_0)] select-none',
        className
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={activeMode === 'simple'}
        onClick={() => handleSelect('simple')}
        className={clsx(
          'px-2.5 py-1 rounded-full font-mono text-[0.6875rem] uppercase tracking-wider transition-all duration-150 cursor-pointer',
          activeMode === 'simple'
            ? 'bg-[oklch(0.15_0.01_280)] text-white shadow-sm ring-1 ring-[oklch(0.62_0.22_295)]'
            : 'text-[oklch(0.66_0.015_280)] hover:text-white'
        )}
      >
        Simple
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={activeMode === 'expert'}
        onClick={() => handleSelect('expert')}
        className={clsx(
          'px-2.5 py-1 rounded-full font-mono text-[0.6875rem] uppercase tracking-wider transition-all duration-150 cursor-pointer',
          activeMode === 'expert'
            ? 'bg-[oklch(0.15_0.01_280)] text-white shadow-sm ring-1 ring-[oklch(0.62_0.22_295)]'
            : 'text-[oklch(0.66_0.015_280)] hover:text-white'
        )}
      >
        Expert
      </button>
    </div>
  );
};
