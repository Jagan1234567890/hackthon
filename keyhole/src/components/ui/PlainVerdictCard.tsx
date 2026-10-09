'use client';

import React from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import {
  AUTHENTICITY_PLAIN_MAPPINGS,
  RECOVERY_PLAIN_MAPPINGS,
} from '@/lib/plainCopy';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { NextSteps } from './NextSteps';
import { TechDetailAccordion } from './TechDetailAccordion';
import { AuthenticityVerdict, ForensicSignal } from '@/types/authenticity';
import { TerminalVerdict } from '@/types/recovery';

export interface PlainVerdictCardProps {
  type: 'authenticity' | 'recovery';
  authenticityVerdict?: AuthenticityVerdict;
  recoveryVerdict?: TerminalVerdict;
  strongestSignal?: string;
  recoveryDetails?: {
    count?: number;
    total?: number;
    timeEst?: string;
    sha256?: string;
  };
  signals?: ForensicSignal[];
  score?: number;
  uncertaintyBand?: { lower: number; upper: number };
  counterEvidence?: { explanation: string; likelihood: string; plausibilityReason: string }[];
  toolVersions?: { name: string; version: string }[];
  rawCommands?: { command: string; output: string }[];
  onActionClick?: (actionTarget: string) => void;
  className?: string;
}

export const PlainVerdictCard: React.FC<PlainVerdictCardProps> = ({
  type,
  authenticityVerdict = 'INCONCLUSIVE',
  recoveryVerdict = 'LIKELY RECOVERABLE',
  strongestSignal,
  recoveryDetails,
  signals,
  score,
  uncertaintyBand,
  counterEvidence,
  toolVersions,
  rawCommands,
  onActionClick,
  className,
}) => {
  // Resolve copy from typed mapping table
  const copy =
    type === 'authenticity'
      ? AUTHENTICITY_PLAIN_MAPPINGS[authenticityVerdict](strongestSignal)
      : RECOVERY_PLAIN_MAPPINGS[recoveryVerdict](recoveryDetails);

  // Semantic styles based on state
  const isDanger =
    authenticityVerdict === 'MANIPULATION-INDICATORS-DETECTED' ||
    recoveryVerdict === 'INFEASIBLE';
  const isSuccess =
    authenticityVerdict === 'AUTHENTIC-CONSISTENT' ||
    recoveryVerdict === 'RECOVERED';

  const colorToken = isDanger
    ? 'text-[oklch(0.63_0.2_25)]'
    : isSuccess
    ? 'text-[oklch(0.72_0.17_155)]'
    : 'text-[oklch(0.78_0.15_85)]';

  const borderToken = isDanger
    ? 'border-[oklch(0.63_0.2_25/60%)]'
    : isSuccess
    ? 'border-[oklch(0.72_0.17_155/60%)]'
    : 'border-[oklch(0.78_0.15_85/60%)]';

  const bgToken = isDanger
    ? 'bg-[oklch(0.63_0.2_25/5%)]'
    : isSuccess
    ? 'bg-[oklch(0.72_0.17_155/5%)]'
    : 'bg-[oklch(0.78_0.15_85/5%)]';

  const StatusIcon = isDanger ? AlertOctagon : isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <article
      aria-label="Analysis Verdict Result"
      className={clsx(
        'card-dark glass rounded-2xl p-6 sm:p-8 border shadow-xl relative overflow-hidden transition-all max-w-[68ch] space-y-6',
        borderToken,
        bgToken,
        className
      )}
    >
      {/* Aria-live announcement of plain verdict (Section 7.4) */}
      <div className="sr-only" aria-live="polite">
        Verdict updated: {copy.verdictLine}
      </div>

      {/* (a) Status glyph and one-line verdict, 28-32px, sentence case */}
      <div className="flex items-start gap-3.5">
        <div
          className={clsx(
            'p-2.5 rounded-xl border shrink-0',
            borderToken,
            'bg-[oklch(0.08_0.005_280)]'
          )}
        >
          <StatusIcon className={clsx('w-6 h-6', colorToken)} />
        </div>
        <div>
          <h2
            className={clsx(
              'font-sans font-bold text-[28px] sm:text-[32px] tracking-tight leading-tight m-0',
              colorToken
            )}
          >
            {copy.verdictLine}
          </h2>
          {copy.supportNotice && (
            <p className="text-xs text-[oklch(0.66_0.015_280)] mt-1 font-sans">
              {copy.supportNotice}
            </p>
          )}
        </div>
      </div>

      {/* (b) Confidence indicator */}
      <div className="pt-1">
        <ConfidenceIndicator level={copy.confidence} />
      </div>

      {/* (c) One sentence saying WHY */}
      <div className="p-4 rounded-xl bg-[oklch(0.06_0.005_280)] border border-[oklch(0.22_0.01_280/60%)]">
        <span className="text-xs uppercase tracking-wider font-semibold text-[oklch(0.66_0.015_280)] font-sans block mb-1">
          Why this happened:
        </span>
        <p className="text-[17px] text-[oklch(0.95_0_0)] leading-[1.6] font-sans m-0">
          {copy.whySentence}
        </p>
      </div>

      {/* (d) "What this means for you" — one line, concrete consequence */}
      <div className="space-y-1">
        <span className="text-xs uppercase tracking-wider font-semibold text-[oklch(0.66_0.015_280)] font-sans block">
          What this means for you:
        </span>
        <p className="text-[17px] text-white font-medium leading-[1.6] font-sans m-0">
          {copy.whatItMeans}
        </p>
      </div>

      {/* (e) Next steps checklist */}
      <NextSteps steps={copy.nextSteps} onActionClick={onActionClick} />

      {/* (f) Show the technical detail text button & accordion */}
      <TechDetailAccordion
        signals={signals}
        score={score}
        uncertaintyBand={uncertaintyBand}
        counterEvidence={counterEvidence}
        toolVersions={toolVersions}
        rawCommands={rawCommands}
      />

      {/* (g) Fixed footer strip with persistent caveats */}
      <div className="pt-3 border-t border-[oklch(0.22_0.01_280/50%)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[oklch(0.66_0.015_280)] font-sans">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[oklch(0.78_0.15_85)] shrink-0" />
          <span>{copy.mandatoryCaveat}</span>
        </div>

        {/* Persistent Chip */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border border-[oklch(0.78_0.15_85/40%)] bg-[oklch(0.78_0.15_85/10%)] text-[oklch(0.88_0.12_85)] shrink-0 self-start sm:self-auto">
          <span>DETECTION IS NOT PROOF</span>
        </div>
      </div>
    </article>
  );
};
