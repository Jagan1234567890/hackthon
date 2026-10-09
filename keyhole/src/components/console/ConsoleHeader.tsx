'use client';

import React from 'react';
import { KeyRound, Shield, Pause, Play, RotateCcw, XSquare } from 'lucide-react';
import { AnalyzedFile } from '@/types/recovery';

interface ConsoleHeaderProps {
  analyzedFile: AnalyzedFile | null;
  isRunning: boolean;
  isPaused: boolean;
  onTogglePause: () => void;
  onCancel: () => void;
  onReset: () => void;
  onExitToLanding?: () => void;
}

export const ConsoleHeader: React.FC<ConsoleHeaderProps> = ({
  analyzedFile,
  isRunning,
  isPaused,
  onTogglePause,
  onCancel,
  onReset,
  onExitToLanding,
}) => {
  return (
    <header className="px-6 py-3.5 border-b border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/90%)] backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Brand & Target Information */}
      <div className="flex items-center gap-4">
        <div
          onClick={onExitToLanding}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Return to Landing Page"
        >
          <div className="w-7 h-7 rounded-xl bg-[oklch(0.62_0.22_295)] p-0.5 flex items-center justify-center shadow-[0_0_12px_oklch(0.62_0.22_295/50%)]">
            <KeyRound className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-sm text-white leading-none">
              KEYHOLE
            </span>
            <span className="font-mono text-[9px] text-[oklch(0.62_0.22_295)] uppercase font-semibold mt-0.5">
              Recovery Console
            </span>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-[oklch(0.22_0.01_280)] hidden sm:block" />

        {/* Current Active Target Display */}
        {analyzedFile ? (
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[oklch(0.85_0.01_280)]">
            <span className="text-[oklch(0.55_0.01_280)]">TARGET:</span>
            <span className="font-semibold text-white truncate max-w-[200px]">
              {analyzedFile.name}
            </span>
            <span className="text-[oklch(0.55_0.01_280)]">
              ({(analyzedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-[oklch(0.55_0.01_280)]">
            <span>No Target Loaded</span>
          </div>
        )}
      </div>

      {/* Persistent 0 Bytes Uploaded Status Chip & Controls */}
      <div className="flex items-center gap-3">
        {/* Persistent Chip required by prompt */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold border border-[oklch(0.72_0.17_155/35%)] bg-[oklch(0.72_0.17_155/10%)] text-[oklch(0.85_0.12_155)] shadow-sm">
          <Shield className="w-3 h-3 text-[oklch(0.72_0.17_155)]" />
          <span>0 BYTES UPLOADED</span>
        </div>

        {/* Execution Controls */}
        {isRunning && (
          <div className="flex items-center gap-1.5 border-l border-[oklch(0.22_0.01_280)] pl-3">
            <button
              onClick={onTogglePause}
              className="p-1.5 rounded-lg bg-[oklch(0.11_0.008_280)] hover:bg-[oklch(0.15_0.01_280)] text-white border border-[oklch(0.22_0.01_280)] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title={isPaused ? 'Resume Analysis' : 'Pause Analysis'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[oklch(0.72_0.17_155)]" /> : <Pause className="w-3.5 h-3.5 text-[oklch(0.78_0.15_85)]" />}
              <span className="hidden md:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg bg-[oklch(0.11_0.008_280)] hover:bg-[oklch(0.63_0.2_25/20%)] text-[oklch(0.63_0.2_25)] border border-[oklch(0.63_0.2_25/40%)] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Cancel Analysis"
            >
              <XSquare className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cancel</span>
            </button>
          </div>
        )}

        {analyzedFile && !isRunning && (
          <button
            onClick={onReset}
            className="p-1.5 rounded-lg bg-[oklch(0.11_0.008_280)] hover:bg-[oklch(0.15_0.01_280)] text-[oklch(0.75_0.01_280)] border border-[oklch(0.22_0.01_280)] transition-colors cursor-pointer text-xs flex items-center gap-1"
            title="Reset Target"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>
        )}
      </div>
    </header>
  );
};
