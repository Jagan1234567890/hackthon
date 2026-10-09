'use client';

import React from 'react';
import { DropZone } from '@/components/ui/DropZone';
import { Meter } from '@/components/ui/Meter';
import { AnalyzedFile, RecoveryMode, RECOVERY_MODES } from '@/types/recovery';
import { AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface LeftRailProps {
  analyzedFile: AnalyzedFile | null;
  onFileAnalyzed: (file: AnalyzedFile) => void;
  mode: RecoveryMode;
  onSelectMode: (mode: RecoveryMode) => void;
  isAuthorized: boolean;
  onToggleAuthorized: (authorized: boolean) => void;
  className?: string;
}

export const LeftRail: React.FC<LeftRailProps> = ({
  analyzedFile,
  onFileAnalyzed,
  mode,
  onSelectMode,
  isAuthorized,
  onToggleAuthorized,
  className,
}) => {
  return (
    <aside
      className={clsx(
        'w-full lg:w-[280px] shrink-0 p-4 flex flex-col gap-4 border-r border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/50%)] overflow-y-auto',
        className
      )}
    >
      {/* 1. Target Upload Drop Zone */}
      <div>
        <div className="font-mono text-[10px] font-semibold text-[oklch(0.62_0.22_295)] uppercase tracking-wider mb-2">
          Target Ingestion
        </div>
        <DropZone
          analyzedFile={analyzedFile}
          onFileAnalyzed={onFileAnalyzed}
        />
      </div>

      {/* 2. File Telemetry Card (When File Loaded) */}
      {analyzedFile && (
        <div className="p-3.5 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/80%)] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[oklch(0.55_0.01_280)] text-[10px] font-semibold uppercase">
              Container Telemetry
            </span>
            <span className="text-[oklch(0.72_0.17_155)] text-[10px] font-semibold">
              SANDBOXED
            </span>
          </div>

          <div>
            <div className="text-white font-semibold truncate text-[11px]" title={analyzedFile.name}>
              {analyzedFile.name}
            </div>
            <div className="text-[oklch(0.55_0.01_280)] text-[10px]">
              {(analyzedFile.size / 1024).toFixed(1)} KB &bull; {analyzedFile.containerType}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-[oklch(0.55_0.01_280)]">SHA-256 (BIT-IDENTICAL)</div>
            <div className="text-[10px] text-[oklch(0.75_0.01_280)] truncate bg-[oklch(0.04_0_0)] p-1 rounded border border-[oklch(0.18_0.01_280)]" title={analyzedFile.sha256}>
              {analyzedFile.sha256.slice(0, 16)}...{analyzedFile.sha256.slice(-8)}
            </div>
          </div>

          {/* Shannon Entropy Bar (0.0 to 8.0 bits/byte) */}
          <Meter
            value={analyzedFile.entropy}
            max={8.0}
            label="Shannon Entropy"
            unit="bits"
            color={analyzedFile.entropy >= 7.9 ? 'violet' : 'amber'}
            subLabel={
              analyzedFile.entropy >= 7.9
                ? 'High-entropy ciphertext confirmed'
                : 'Structure / partial compression'
            }
          />
        </div>
      )}

      {/* 3. Segmented Mode Chips (A, B, C, D) */}
      <div className="space-y-2">
        <div className="font-mono text-[10px] font-semibold text-[oklch(0.62_0.22_295)] uppercase tracking-wider">
          Recovery Mode
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(['A', 'B', 'C', 'D'] as RecoveryMode[]).map((mKey) => {
            const isSelected = mode === mKey;
            const mInfo = RECOVERY_MODES[mKey];
            return (
              <button
                key={mKey}
                onClick={() => onSelectMode(mKey)}
                className={clsx(
                  'p-2 rounded-xl text-left border transition-all cursor-pointer select-none flex flex-col justify-between',
                  isSelected
                    ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/15%)] text-white shadow-[0_0_16px_oklch(0.62_0.22_295/20%)]'
                    : 'border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280/60%)] text-[oklch(0.75_0.01_280)] hover:border-[oklch(0.35_0.08_295/50%)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">
                    Mode {mKey}
                  </span>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.62_0.22_295)] shadow-[0_0_8px_oklch(0.62_0.22_295)]" />
                  )}
                </div>
                <span className="text-[10px] text-[oklch(0.66_0.015_280)] truncate mt-1">
                  {mInfo.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Ethics & Authorization Checkbox (Mandatory Gating) */}
      <div className="mt-auto pt-4 border-t border-[oklch(0.22_0.01_280/60%)]">
        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[oklch(0.22_0.01_280/80%)] bg-[oklch(0.08_0.005_280)] hover:border-[oklch(0.4_0.12_295/50%)] transition-colors cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAuthorized}
            onChange={(e) => onToggleAuthorized(e.target.checked)}
            className="mt-0.5 rounded border-[oklch(0.35_0.08_295)] text-[oklch(0.62_0.22_295)] focus:ring-[oklch(0.62_0.22_295)] bg-[oklch(0.04_0_0)] cursor-pointer"
          />
          <div className="text-[11px] text-[oklch(0.85_0.01_280)] leading-tight">
            <strong className="text-white block font-medium mb-0.5">Authorization Gate:</strong>
            I own this file or am explicitly authorized to recover it.
          </div>
        </label>

        {!isAuthorized && (
          <div className="flex items-center gap-1.5 text-[10px] text-[oklch(0.78_0.15_85)] mt-2 font-mono px-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Authorization required to execute recovery.</span>
          </div>
        )}
      </div>
    </aside>
  );
};
