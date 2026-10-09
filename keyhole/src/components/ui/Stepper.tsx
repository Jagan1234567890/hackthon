import React from 'react';
import { clsx } from 'clsx';
import { StageExecution } from '@/types/recovery';
import { CheckCircle2, XCircle, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface StepperProps {
  stages: StageExecution[];
  activeStageIndex?: number;
  onSelectStage?: (stageId: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ stages, activeStageIndex, onSelectStage }) => {
  const [expandedStage, setExpandedStage] = React.useState<number | null>(null);

  const toggleExpand = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedStage(expandedStage === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const isRunning = stage.status === 'running';
        const isPass = stage.status === 'pass';
        const isFail = stage.status === 'fail';
        const isQueued = stage.status === 'queued';
        const isExpanded = expandedStage === stage.id;
        const isCurrent = activeStageIndex === idx;

        return (
          <div
            key={stage.id}
            onClick={() => onSelectStage?.(stage.id)}
            className={clsx(
              'group rounded-xl border transition-all duration-200 p-4 cursor-pointer',
              isCurrent
                ? 'border-[oklch(0.62_0.22_295/70%)] bg-[oklch(0.62_0.22_295/8%)] shadow-[0_0_24px_-8px_oklch(0.62_0.22_295/30%)]'
                : 'border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280/80%)] hover:border-[oklch(0.35_0.08_295/40%)]'
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Status Indicator Icon */}
                <div className="shrink-0">
                  {isRunning && <Loader2 className="w-5 h-5 text-[oklch(0.62_0.22_295)] animate-spin" />}
                  {isPass && <CheckCircle2 className="w-5 h-5 text-[oklch(0.72_0.17_155)]" />}
                  {isFail && <XCircle className="w-5 h-5 text-[oklch(0.63_0.2_25)]" />}
                  {isQueued && <Clock className="w-5 h-5 text-[oklch(0.55_0.01_280)]" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-[oklch(0.62_0.22_295)] font-semibold">
                      {stage.tag}
                    </span>
                    <span className="text-sm font-medium text-[oklch(0.985_0_0)]">
                      {stage.name}
                    </span>
                  </div>
                  <p className="text-xs text-[oklch(0.66_0.015_280)] mt-0.5 line-clamp-1">
                    {stage.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Status Badge */}
                <span
                  className={clsx(
                    'font-mono text-[11px] px-2.5 py-0.5 rounded-full border font-semibold',
                    isPass && 'border-[oklch(0.72_0.17_155/40%)] bg-[oklch(0.72_0.17_155/15%)] text-[oklch(0.85_0.12_155)]',
                    isFail && 'border-[oklch(0.63_0.2_25/40%)] bg-[oklch(0.63_0.2_25/15%)] text-[oklch(0.85_0.15_25)]',
                    isRunning && 'border-[oklch(0.62_0.22_295/40%)] bg-[oklch(0.62_0.22_295/15%)] text-[oklch(0.85_0.15_295)]',
                    isQueued && 'border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.11_0.008_280)] text-[oklch(0.55_0.01_280)]'
                  )}
                >
                  {isPass ? 'PASS' : isFail ? 'FAIL' : isRunning ? 'RUNNING' : 'QUEUED'}
                </span>

                <button
                  type="button"
                  onClick={(e) => toggleExpand(stage.id, e)}
                  className="p-1 rounded text-[oklch(0.55_0.01_280)] hover:text-[oklch(0.85_0.01_280)] transition-colors"
                  aria-label="Toggle raw stdout details"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Expandable Raw Findings & Stdout */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-[oklch(0.22_0.01_280/40%)] space-y-2 text-xs">
                <div className="font-mono text-[oklch(0.78_0.01_280)] bg-[oklch(0.04_0_0)] p-2.5 rounded-lg border border-[oklch(0.18_0.01_280)] overflow-x-auto">
                  <div className="text-[oklch(0.62_0.22_295)] mb-1 font-semibold">$ {stage.command}</div>
                  {stage.findings.map((finding, fIdx) => (
                    <div key={fIdx} className="text-[oklch(0.75_0.01_280)]">
                      &bull; {finding}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
