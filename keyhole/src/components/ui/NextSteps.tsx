'use client';

import React from 'react';
import { NextStepItem } from '@/lib/plainCopy';
import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';

interface NextStepsProps {
  steps: NextStepItem[];
  onActionClick?: (actionTarget: string) => void;
  className?: string;
}

export const NextSteps: React.FC<NextStepsProps> = ({
  steps,
  onActionClick,
  className,
}) => {
  return (
    <div className={clsx('space-y-3', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.66_0.015_280)] font-sans">
        Next Steps
      </h3>

      <ol className="space-y-2 list-none p-0 m-0">
        {steps.map((step, idx) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[oklch(0.06_0.005_280)] border border-[oklch(0.22_0.01_280/50%)] hover:border-[oklch(0.4_0.12_295/50%)] transition-colors min-h-[44px]"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[oklch(0.15_0.01_280)] text-white text-xs font-semibold shrink-0">
                {step.stepNumber}
              </span>
              <p className="text-sm text-[oklch(0.9_0_0)] leading-snug font-sans m-0 pt-0.5">
                {step.label}
              </p>
            </div>

            {step.actionType === 'button' && step.buttonText && (
              <button
                type="button"
                onClick={() => step.actionTarget && onActionClick?.(step.actionTarget)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[oklch(0.62_0.22_295)] hover:bg-[oklch(0.68_0.22_295)] active:scale-95 transition-all flex items-center gap-1 shadow-sm min-h-[36px]"
              >
                <span>{step.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};
