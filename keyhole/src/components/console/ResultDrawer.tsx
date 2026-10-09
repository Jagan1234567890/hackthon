'use client';

import React, { useState } from 'react';
import { AnalyzedFile, RecoveryVerdictData } from '@/types/recovery';
import { generateReportJson, generateReportPlainText } from '@/lib/recovery-engine';
import { PlainVerdictCard } from '@/components/ui/PlainVerdictCard';
import { ModeToggle, DisplayMode } from '@/components/ui/ModeToggle';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  FileText,
  FileJson,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ResultDrawerProps {
  analyzedFile: AnalyzedFile;
  verdictData: RecoveryVerdictData;
  onClose: () => void;
}

export const ResultDrawer: React.FC<ResultDrawerProps> = ({
  analyzedFile,
  verdictData,
  onClose,
}) => {
  const [isMasked, setIsMasked] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPlan, setCopiedPlan] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('simple');

  const handleCopyPassphrase = () => {
    if (verdictData.recoveredPassphrase) {
      navigator.clipboard.writeText(verdictData.recoveredPassphrase);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCopyCommand = (command: string, step: number) => {
    navigator.clipboard.writeText(command);
    setCopiedPlan(step);
    setTimeout(() => setCopiedPlan(null), 2000);
  };

  const handleDownloadJson = () => {
    const jsonStr = generateReportJson(analyzedFile, verdictData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KEYHOLE-Report-${analyzedFile.name}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const txtStr = generateReportPlainText(analyzedFile, verdictData);
    const blob = new Blob([txtStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KEYHOLE-Report-${analyzedFile.name}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // State Color Theming
  const stateTheme = {
    RECOVERED: {
      border: 'border-[oklch(0.72_0.17_155)]',
      bg: 'bg-[oklch(0.72_0.17_155/12%)]',
      text: 'text-[oklch(0.72_0.17_155)]',
      shadow: 'shadow-[0_0_50px_-10px_oklch(0.72_0.17_155/35%)]',
      icon: CheckCircle2,
    },
    'LIKELY RECOVERABLE': {
      border: 'border-[oklch(0.78_0.15_85)]',
      bg: 'bg-[oklch(0.78_0.15_85/12%)]',
      text: 'text-[oklch(0.78_0.15_85)]',
      shadow: 'shadow-[0_0_50px_-10px_oklch(0.78_0.15_85/35%)]',
      icon: AlertTriangle,
    },
    'LONG SHOT': {
      border: 'border-[oklch(0.62_0.22_295)]',
      bg: 'bg-[oklch(0.62_0.22_295/12%)]',
      text: 'text-[oklch(0.85_0.12_295)]',
      shadow: 'shadow-[0_0_50px_-10px_oklch(0.62_0.22_295/35%)]',
      icon: HelpCircle,
    },
    INFEASIBLE: {
      border: 'border-[oklch(0.63_0.2_25)]',
      bg: 'bg-[oklch(0.63_0.2_25/12%)]',
      text: 'text-[oklch(0.63_0.2_25)]',
      shadow: 'shadow-[0_0_50px_-10px_oklch(0.63_0.2_25/35%)]',
      icon: XCircle,
    },
  }[verdictData.verdict];

  const VerdictIcon = stateTheme.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:p-6 bg-[oklch(0.02_0_0/80%)] backdrop-blur-md animate-in fade-in duration-300">
      <div
        className={clsx(
          'w-full max-w-5xl glass-elevated rounded-t-3xl md:rounded-3xl border max-h-[90vh] overflow-y-auto flex flex-col p-6 md:p-8 space-y-6',
          stateTheme.border,
          stateTheme.shadow
        )}
        style={{
          transition: 'all 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[oklch(0.22_0.01_280/60%)]">
          <div className="flex items-center gap-3">
            <div className={clsx('p-2.5 rounded-2xl border', stateTheme.border, stateTheme.bg, stateTheme.text)}>
              <VerdictIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={clsx('font-mono font-bold text-sm tracking-wider uppercase', stateTheme.text)}>
                  [{verdictData.verdict}]
                </span>
                <span className="font-mono text-xs text-[oklch(0.66_0.015_280)]">
                  ({verdictData.probability}% Estimated Probability)
                </span>
              </div>
              <h2 className="font-sans font-bold text-lg text-white">
                {verdictData.headline}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Toggle (Section 1.1) */}
            <ModeToggle mode={displayMode} onChange={setDisplayMode} />

            <button
              onClick={handleDownloadJson}
              className="btn-ghost px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 text-[oklch(0.85_0.01_280)]"
              title="Download JSON Report"
            >
              <FileJson className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
              <span className="hidden sm:inline">JSON Report</span>
            </button>

            <button
              onClick={handleDownloadTxt}
              className="btn-ghost px-3 py-1.5 rounded-xl text-xs inline-flex items-center gap-1.5 text-[oklch(0.85_0.01_280)]"
              title="Download Plain Text Log"
            >
              <FileText className="w-4 h-4 text-[oklch(0.72_0.17_155)]" />
              <span className="hidden sm:inline">Text Log</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[oklch(0.55_0.01_280)] hover:text-white hover:bg-[oklch(0.15_0.01_280)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {displayMode === 'simple' ? (
          /* Simple Mode Recovery Result Card */
          <div className="flex flex-col items-center sm:items-start">
            <PlainVerdictCard
              type="recovery"
              recoveryVerdict={verdictData.verdict}
              recoveryDetails={{
                sha256: analyzedFile.sha256,
                timeEst: verdictData.nextPassCost,
              }}
              rawCommands={verdictData.evidence.map((e) => ({
                command: e.command,
                output: e.output,
              }))}
            />
          </div>
        ) : (
          <>
            {/* 1. Verdict Detail Rationale */}
            <div className="p-4 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] text-xs text-[oklch(0.85_0.01_280)] leading-relaxed">
              {verdictData.reason}
            </div>

        {/* 2. Recovered Passphrase (RECOVERED State) */}
        {verdictData.recoveredPassphrase && (
          <div className="p-5 rounded-2xl bg-[oklch(0.72_0.17_155/10%)] border border-[oklch(0.72_0.17_155/40%)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-[oklch(0.72_0.17_155)] uppercase">
                Recovered Master Passphrase
              </span>
              <span className="text-[11px] font-mono text-[oklch(0.66_0.015_280)]">
                Duration: {verdictData.timeElapsed}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280)]">
              <div className="font-mono text-base font-bold text-white tracking-wider select-all">
                {isMasked ? '••••••••••••••••' : verdictData.recoveredPassphrase}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="p-2 rounded-lg bg-[oklch(0.11_0.008_280)] text-[oklch(0.75_0.01_280)] hover:text-white transition-colors cursor-pointer"
                  title={isMasked ? 'Reveal Passphrase' : 'Hide Passphrase'}
                >
                  {isMasked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPassphrase}
                  className="px-3 py-2 rounded-lg bg-[oklch(0.72_0.17_155)] text-black font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Evidence & Raw Commands */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Evidence &amp; Forensic Output
          </div>
          {verdictData.evidence.map((ev, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-1.5 font-mono text-xs">
              <div className="text-[oklch(0.62_0.22_295)] font-semibold">$ {ev.command}</div>
              <pre className="text-[oklch(0.75_0.01_280)] text-[11px] overflow-x-auto whitespace-pre-wrap">{ev.output}</pre>
              <div className="pt-1 text-[oklch(0.72_0.17_155)] text-[11px]">&bull; {ev.conclusion}</div>
            </div>
          ))}
        </div>

        {/* 4. Numbered Recovery Plan */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Copy-Pasteable Recovery Plan
          </div>
          <div className="space-y-2">
            {verdictData.recoveryPlan.map((plan) => (
              <div key={plan.step} className="p-3 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/70%)] flex items-center justify-between gap-4 font-mono text-xs">
                <div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <span className="text-[oklch(0.62_0.22_295)]">Step {plan.step}:</span>
                    <span>{plan.title}</span>
                    <span className="text-[oklch(0.55_0.01_280)] text-[10px]">({plan.timeCost})</span>
                  </div>
                  <div className="text-[oklch(0.75_0.01_280)] mt-1 font-mono text-[11px]">
                    $ {plan.command}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCommand(plan.command, plan.step)}
                  className="px-2.5 py-1.5 rounded-lg bg-[oklch(0.11_0.008_280)] text-white hover:bg-[oklch(0.15_0.01_280)] text-[11px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedPlan === plan.step ? <Check className="w-3 h-3 text-[oklch(0.72_0.17_155)]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPlan === plan.step ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Effort Table */}
        <div className="space-y-2">
          <div className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Cracking Effort vs Success Probability
          </div>
          <div className="rounded-xl border border-[oklch(0.22_0.01_280/80%)] overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-[oklch(0.04_0_0)] border-b border-[oklch(0.22_0.01_280/60%)]">
                <tr>
                  <th className="py-2 px-3 text-[oklch(0.55_0.01_280)]">Pass</th>
                  <th className="py-2 px-3 text-[oklch(0.55_0.01_280)]">Tool</th>
                  <th className="py-2 px-3 text-[oklch(0.55_0.01_280)]">Keyspace</th>
                  <th className="py-2 px-3 text-[oklch(0.55_0.01_280)]">GPU-Hours</th>
                  <th className="py-2 px-3 text-[oklch(0.55_0.01_280)]">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.18_0.01_280/60%)]">
                {verdictData.effortTable.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="py-2 px-3 text-white font-medium">{row.pass}</td>
                    <td className="py-2 px-3 text-[oklch(0.75_0.01_280)]">{row.tool}</td>
                    <td className="py-2 px-3 text-[oklch(0.66_0.015_280)]">{row.keyspace}</td>
                    <td className="py-2 px-3 text-[oklch(0.62_0.22_295)]">{row.gpuHours}</td>
                    <td className="py-2 px-3 text-[oklch(0.72_0.17_155)] font-bold">{row.successRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Prevention & Vault Hygiene */}
        <div className="p-4 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/70%)] space-y-2 text-xs">
          <div className="font-mono font-semibold text-white uppercase text-[11px]">
            Prevention &amp; Vault Hygiene
          </div>
          <ul className="space-y-1 text-[oklch(0.75_0.01_280)] list-disc list-inside">
            {verdictData.prevention.map((prev, pIdx) => (
              <li key={pIdx}>{prev}</li>
            ))}
          </ul>
        </div>
        </>
        )}
      </div>
    </div>
  );
};
