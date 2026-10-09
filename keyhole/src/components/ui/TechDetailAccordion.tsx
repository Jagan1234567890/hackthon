'use client';

import React, { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { ConfidenceBand } from './ConfidenceBand';
import { ForensicSignal } from '@/types/authenticity';

interface TechDetailAccordionProps {
  signals?: ForensicSignal[];
  score?: number;
  uncertaintyBand?: { lower: number; upper: number };
  counterEvidence?: { explanation: string; likelihood: string; plausibilityReason: string }[];
  toolVersions?: { name: string; version: string; weightsHash?: string }[];
  rawCommands?: { command: string; output: string }[];
  className?: string;
}

export const TechDetailAccordion: React.FC<TechDetailAccordionProps> = ({
  signals,
  score,
  uncertaintyBand,
  counterEvidence,
  toolVersions,
  rawCommands,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className={clsx('pt-3 border-t border-[oklch(0.22_0.01_280/50%)]', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
        className="flex items-center gap-2 text-xs font-mono text-[oklch(0.66_0.015_280)] hover:text-white transition-colors py-1 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.22_295)] rounded"
      >
        <ChevronDown
          className={clsx(
            'w-4 h-4 transition-transform duration-200 text-[oklch(0.62_0.22_295)]',
            isOpen && 'rotate-180'
          )}
        />
        <span className="underline decoration-dotted group-hover:decoration-solid">
          {isOpen ? 'Hide technical detail' : 'Show the technical detail'}
        </span>
      </button>

      {isOpen && (
        <div
          className="mt-3 space-y-4 pt-3 border-t border-[oklch(0.22_0.01_280/40%)] animate-fade-in text-xs"
          style={{ transition: 'opacity 200ms ease-in-out' }}
        >
          {/* Confidence Band Component */}
          {score !== undefined && uncertaintyBand && (
            <div className="p-3 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/60%)] space-y-2">
              <span className="font-mono text-[11px] text-[oklch(0.66_0.015_280)] uppercase tracking-wider block">
                Calibrated Uncertainty Spread
              </span>
              <ConfidenceBand
                score={score}
                lower={uncertaintyBand.lower}
                upper={uncertaintyBand.upper}
              />
            </div>
          )}

          {/* Signals Table */}
          {signals && signals.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-[11px] text-[oklch(0.66_0.015_280)] uppercase tracking-wider block">
                Evidence Signals Matrix ({signals.length})
              </span>
              <div className="divide-y divide-[oklch(0.22_0.01_280/40%)] rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/60%)] overflow-hidden">
                {signals.slice(0, 5).map((s) => (
                  <div key={s.id} className="p-2.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-medium text-white text-[11px]">{s.name}</div>
                      <p className="text-[11px] text-[oklch(0.66_0.015_280)] mt-0.5">{s.explanation}</p>
                      <div className="font-mono text-[10px] text-[oklch(0.62_0.22_295)] mt-1">
                        Tool: {s.commandOrTool}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        'font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0',
                        s.verdict === 'PASS'
                          ? 'border-[oklch(0.72_0.17_155/40%)] text-[oklch(0.72_0.17_155)] bg-[oklch(0.72_0.17_155/10%)]'
                          : s.verdict === 'FAIL'
                          ? 'border-[oklch(0.63_0.2_25/40%)] text-[oklch(0.63_0.2_25)] bg-[oklch(0.63_0.2_25/10%)]'
                          : 'border-[oklch(0.78_0.15_85/40%)] text-[oklch(0.78_0.15_85)] bg-[oklch(0.78_0.15_85/10%)]'
                      )}
                    >
                      {s.verdict} ({s.score.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counter-Evidence Review */}
          {counterEvidence && counterEvidence.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/60%)]">
              <span className="font-mono text-[11px] text-[oklch(0.78_0.15_85)] uppercase tracking-wider block">
                Counter-Evidence (Benign Alternative Explanations)
              </span>
              {counterEvidence.map((c, i) => (
                <div key={i} className="text-[11px] text-[oklch(0.85_0.01_280)]">
                  &bull; <strong className="text-white">{c.explanation}</strong> ({c.likelihood} likelihood): {c.plausibilityReason}
                </div>
              ))}
            </div>
          )}

          {/* Tool Versions Chips */}
          {toolVersions && toolVersions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {toolVersions.map((tv, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[oklch(0.1_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] font-mono text-[10px] text-[oklch(0.66_0.015_280)]"
                >
                  <span>{tv.name}</span>
                  <span className="text-white">v{tv.version}</span>
                </span>
              ))}
            </div>
          )}

          {/* Raw Commands */}
          {rawCommands && rawCommands.length > 0 && (
            <div className="space-y-1 pt-1 font-mono text-[10px]">
              <span className="text-[oklch(0.66_0.015_280)]">Raw Execution Evidence:</span>
              {rawCommands.map((rc, i) => (
                <div key={i} className="p-2 rounded bg-black/80 border border-white/10 overflow-x-auto">
                  <div className="text-[oklch(0.62_0.22_295)]">$ {rc.command}</div>
                  <div className="text-[oklch(0.66_0.015_280)] whitespace-pre-wrap">{rc.output}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
