import React from 'react';
import { AuthenticityVerdict } from '@/types/authenticity';
import { ConfidenceBand } from './ConfidenceBand';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { clsx } from 'clsx';

interface VerdictCardProps {
  verdict: AuthenticityVerdict;
  score: number;
  uncertaintyBand: { lower: number; upper: number };
  firedSignalsCount: number;
  totalSignalsCount: number;
  provenanceStatus: string;
  disclaimer: string;
  className?: string;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  verdict,
  score,
  uncertaintyBand,
  firedSignalsCount,
  totalSignalsCount,
  provenanceStatus,
  disclaimer,
  className,
}) => {
  const styles = {
    'AUTHENTIC-CONSISTENT': {
      border: 'border-[oklch(0.72_0.17_155)]',
      bg: 'bg-[oklch(0.72_0.17_155/8%)]',
      text: 'text-[oklch(0.72_0.17_155)]',
      badge: 'border-[oklch(0.72_0.17_155/40%)] bg-[oklch(0.72_0.17_155/15%)] text-[oklch(0.85_0.12_155)]',
      icon: CheckCircle2,
      headline: 'Authentic-Consistent (No Significant Synthesis Artifacts)',
      summary:
        'All deterministic frequency and biological continuity checks align with legitimate camera sensor physics. (Mandatory caveat: Absence of detected anomalies does not constitute absolute proof of authenticity against unknown future architectures).',
    },
    INCONCLUSIVE: {
      border: 'border-[oklch(0.78_0.15_85)]',
      bg: 'bg-[oklch(0.78_0.15_85/8%)]',
      text: 'text-[oklch(0.78_0.15_85)]',
      badge: 'border-[oklch(0.78_0.15_85/40%)] bg-[oklch(0.78_0.15_85/15%)] text-[oklch(0.88_0.12_85)]',
      icon: AlertTriangle,
      headline: 'Inconclusive (Benign Alternative Explanations Equi-Plausible)',
      summary:
        'Anomalies detected in frequency/temporal domains are equally consistent with social media re-compression, smartphone night mode ISP computational photography, or camera motion blur. Additional sensor reference required.',
    },
    'MANIPULATION-INDICATORS-DETECTED': {
      border: 'border-[oklch(0.63_0.2_25)]',
      bg: 'bg-[oklch(0.63_0.2_25/8%)]',
      text: 'text-[oklch(0.63_0.2_25)]',
      badge: 'border-[oklch(0.63_0.2_25/40%)] bg-[oklch(0.63_0.2_25/15%)] text-[oklch(0.85_0.15_25)]',
      icon: AlertOctagon,
      headline: 'Manipulation Indicators Detected (Neural Synthesis / Splice Artifacts)',
      summary:
        'Multiple orthogonal forensics vectors fired: unnatural frequency checkerboards, unnatural facial landmark phase discontinuities, or neural vocoder energy cliffs. Review fired signal matrix below.',
    },
  }[verdict];

  const VerdictIcon = styles.icon;

  return (
    <div
      className={clsx(
        'glass-elevated rounded-2xl p-5 md:p-6 border space-y-4 shadow-xl relative overflow-hidden',
        styles.border,
        styles.bg,
        className
      )}
    >
      {/* Permanent non-dismissible mini-label required by Section 5.5 */}
      <div className="flex items-center justify-between pb-3 border-b border-[oklch(0.22_0.01_280/50%)]">
        <div className="flex items-center gap-2">
          <div className={clsx('p-2 rounded-xl border', styles.badge)}>
            <VerdictIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={clsx('font-mono font-bold text-xs tracking-wider uppercase', styles.text)}>
                [{verdict}]
              </span>
            </div>
            <h3 className="font-sans font-bold text-base text-white mt-0.5">
              {styles.headline}
            </h3>
          </div>
        </div>

        {/* Persistent Chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[10px] font-semibold border border-[oklch(0.78_0.15_85/40%)] bg-[oklch(0.78_0.15_85/10%)] text-[oklch(0.88_0.12_85)]">
          <Info className="w-3 h-3" />
          <span>DETECTION IS NOT PROOF</span>
        </div>
      </div>

      {/* Detail Narrative */}
      <p className="text-xs text-[oklch(0.85_0.01_280)] leading-relaxed">
        {styles.summary}
      </p>

      {/* Confidence Band */}
      <div className="pt-2">
        <ConfidenceBand
          score={score}
          lower={uncertaintyBand.lower}
          upper={uncertaintyBand.upper}
        />
      </div>

      {/* Quick Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono border-t border-[oklch(0.22_0.01_280/40%)]">
        <div className="text-[oklch(0.66_0.015_280)]">
          Fired Signals: <span className="text-white font-semibold">{firedSignalsCount}/{totalSignalsCount}</span>
        </div>
        <div className="text-[oklch(0.66_0.015_280)] truncate">
          C2PA: <span className="text-[oklch(0.62_0.22_295)] font-semibold">{provenanceStatus.slice(0, 18)}</span>
        </div>
        <div className="text-[oklch(0.66_0.015_280)] col-span-2 sm:col-span-1">
          Uncertainty: <span className="text-white font-semibold">±0.08</span>
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="text-[10px] text-[oklch(0.55_0.01_280)] font-sans italic pt-1">
        {disclaimer}
      </div>
    </div>
  );
};
