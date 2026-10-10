'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  durationMs?: number;
}

export interface ToastNotificationProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastNotificationContainer({ toasts, onDismiss }: ToastNotificationProps) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function SingleToast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const duration = toast.durationMs || 5000;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-[oklch(0.62_0.22_295)] shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/40',
    error: 'border-rose-500/40',
    warning: 'border-amber-500/40',
    info: 'border-[oklch(0.62_0.22_295/50%)]',
  };

  const progressColors = {
    success: 'bg-emerald-400',
    error: 'bg-rose-400',
    warning: 'bg-amber-400',
    info: 'bg-[oklch(0.62_0.22_295)]',
  };

  return (
    <div
      className={`pointer-events-auto rounded-xl border ${borders[toast.type]} bg-[oklch(0.08_0.005_280)]/95 backdrop-blur-xl p-3.5 shadow-2xl overflow-hidden relative transition-all duration-300 animate-in slide-in-from-right`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {icons[toast.type]}
          <div>
            <h5 className="text-xs font-semibold text-white tracking-tight">{toast.title}</h5>
            {toast.message && <p className="text-[11px] text-[oklch(0.66_0.015_280)] mt-0.5 leading-relaxed">{toast.message}</p>}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar countdown */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className={`h-full ${progressColors[toast.type]} transition-all ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
