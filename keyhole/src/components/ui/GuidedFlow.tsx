'use client';

import React, { useState } from 'react';
import { HelpCircle, X, ArrowRight, Play } from 'lucide-react';
import { clsx } from 'clsx';
import { BtnGhost } from './BtnGhost';
import { BtnPrimary } from './BtnPrimary';

export interface GuidedFlowAnswers {
  problemType: string;
  triedSteps: string[];
  timeBudget: string;
}

interface GuidedFlowProps {
  onComplete?: (answers: GuidedFlowAnswers) => void;
  className?: string;
}

export const GuidedFlow: React.FC<GuidedFlowProps> = ({
  onComplete,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [problemType, setProblemType] = useState<string>('');
  const [triedSteps, setTriedSteps] = useState<string[]>([]);
  const [timeBudget, setTimeBudget] = useState<string>('two minutes');

  const q1Options = [
    "I can't open a file",
    'I forgot the password',
    'I want to check if this video or photo is real',
    'I want to lock a file',
  ];

  const q2Options = [
    'restarted and retried',
    'checked my email for the password',
    'tried the password from another device',
    'asked whoever sent the file',
    'nothing yet',
  ];

  const q3Options = [
    'two minutes',
    'this evening',
    'overnight',
    'do whatever it takes',
  ];

  const handleToggleQ2 = (opt: string) => {
    if (opt === 'nothing yet') {
      setTriedSteps(['nothing yet']);
      return;
    }
    const filtered = triedSteps.filter((s) => s !== 'nothing yet');
    if (filtered.includes(opt)) {
      setTriedSteps(filtered.filter((s) => s !== opt));
    } else {
      setTriedSteps([...filtered, opt]);
    }
  };

  const handleStart = () => {
    onComplete?.({
      problemType,
      triedSteps,
      timeBudget,
    });
    setIsOpen(false);
    setStep(1);
  };

  if (!isOpen) {
    return (
      <div className={className}>
        <BtnGhost
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 text-xs py-1.5 px-3"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
          <span>Help me with this</span>
        </BtnGhost>
      </div>
    );
  }

  return (
    <div className={clsx('card-dark glass rounded-2xl p-6 border border-[oklch(0.4_0.12_295/50%)] shadow-2xl max-w-xl mx-auto space-y-5 animate-fade-in', className)}>
      <div className="flex items-center justify-between pb-3 border-b border-[oklch(0.22_0.01_280/60%)]">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
          <h3 className="font-sans font-semibold text-sm text-white m-0">Guided Setup</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Screen 1: What happened? */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-white">What happened?</p>
          <div className="grid grid-cols-1 gap-2">
            {q1Options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setProblemType(opt);
                  setStep(2);
                }}
                className={clsx(
                  'text-left p-3 rounded-xl border text-xs font-sans transition-all cursor-pointer',
                  problemType === opt
                    ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/15%)] text-white'
                    : 'border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.06_0.005_280)] text-[oklch(0.85_0.01_280)] hover:border-[oklch(0.4_0.12_295/50%)]'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Screen 2: What have you already tried? */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-white">What have you already tried?</p>
          <div className="grid grid-cols-1 gap-2">
            {q2Options.map((opt) => {
              const isSelected = triedSteps.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleToggleQ2(opt)}
                  className={clsx(
                    'text-left p-3 rounded-xl border text-xs font-sans transition-all cursor-pointer',
                    isSelected
                      ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/15%)] text-white'
                      : 'border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.06_0.005_280)] text-[oklch(0.85_0.01_280)] hover:border-[oklch(0.4_0.12_295/50%)]'
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between pt-2">
            <BtnGhost onClick={() => setStep(1)} className="text-xs">
              Back
            </BtnGhost>
            <BtnPrimary
              onClick={() => setStep(3)}
              disabled={triedSteps.length === 0}
              className="text-xs flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* Screen 3: How much time do you want to spend? */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-white">How much time do you want to spend?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q3Options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setTimeBudget(opt)}
                className={clsx(
                  'text-center p-3 rounded-xl border text-xs font-sans transition-all cursor-pointer capitalize',
                  timeBudget === opt
                    ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/15%)] text-white'
                    : 'border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.06_0.005_280)] text-[oklch(0.85_0.01_280)] hover:border-[oklch(0.4_0.12_295/50%)]'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-2">
            <BtnGhost onClick={() => setStep(2)} className="text-xs">
              Back
            </BtnGhost>
            <BtnPrimary
              onClick={() => setStep(4)}
              className="text-xs flex items-center gap-1.5"
            >
              <span>Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* Screen 4: Ready to Start */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/60%)] space-y-1.5 text-xs">
            <div className="text-[oklch(0.66_0.015_280)]">
              Target: <span className="text-white font-medium">{problemType}</span>
            </div>
            <div className="text-[oklch(0.66_0.015_280)]">
              Prior attempts: <span className="text-white font-medium">{triedSteps.join(', ')}</span>
            </div>
            <div className="text-[oklch(0.66_0.015_280)]">
              Allocated time: <span className="text-white font-medium capitalize">{timeBudget}</span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <BtnGhost onClick={() => setStep(3)} className="text-xs">
              Back
            </BtnGhost>
            <BtnPrimary onClick={handleStart} className="text-xs flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              <span>Start</span>
            </BtnPrimary>
          </div>
        </div>
      )}
    </div>
  );
};
