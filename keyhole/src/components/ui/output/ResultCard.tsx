'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, ExternalLink } from 'lucide-react';
import { ConfidenceRing } from './ConfidenceRing';

export interface ResultCardProps {
  title: string;
  icon?: React.ReactNode;
  confidence?: number; // 0 to 1
  badgeText?: string;
  badgeVariant?: 'violet' | 'green' | 'yellow' | 'red' | 'grey';
  timestamp?: string;
  metadata?: Record<string, string | number>;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onExport?: (format: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ResultCard({
  title,
  icon,
  confidence,
  badgeText,
  badgeVariant = 'violet',
  timestamp,
  metadata,
  collapsible = true,
  defaultExpanded = true,
  onExport,
  actions,
  children,
  className = '',
}: ResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);

  const badgeColors = {
    violet: 'bg-[oklch(0.62_0.22_295/15%)] text-[oklch(0.62_0.22_295)] border-[oklch(0.62_0.22_295/30%)]',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    red: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    grey: 'bg-white/10 text-[oklch(0.66_0.015_280)] border-white/15',
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 hover:border-[oklch(0.4_0.12_295/50%)] hover:shadow-[0_12px_32px_-8px_oklch(0.62_0.22_295/0.25)] ${className}`}
    >
      {/* Gradient Header Bar */}
      <div className="px-5 py-4 bg-gradient-to-r from-[oklch(0.11_0.008_280)] via-[oklch(0.09_0.005_280)] to-[oklch(0.08_0.005_280)] border-b border-[oklch(0.22_0.01_280/40%)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-[oklch(0.62_0.22_295/15%)] border border-[oklch(0.62_0.22_295/30%)] flex items-center justify-center text-[oklch(0.62_0.22_295)] shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white tracking-tight truncate flex items-center gap-2">
              <span>{title}</span>
              {badgeText && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColors[badgeVariant]}`}>
                  {badgeText}
                </span>
              )}
            </h3>
            {timestamp && (
              <span className="text-[10px] font-mono text-[oklch(0.66_0.015_280)] block">
                {timestamp}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {confidence !== undefined && (
            <ConfidenceRing percentage={Math.round(confidence * 100)} size={38} strokeWidth={3.5} />
          )}

          {actions}

          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-[oklch(0.66_0.015_280)] hover:text-white hover:bg-white/5 transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-5 text-xs text-[oklch(0.9_0_0)] space-y-4 animate-in fade-in duration-200">
          {children}
        </div>
      )}

      {/* Footer Metadata */}
      {metadata && isExpanded && (
        <div className="px-5 py-2.5 bg-[oklch(0.06_0.004_280)] border-t border-[oklch(0.22_0.01_280/40%)] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-[oklch(0.66_0.015_280)]">
          <div className="flex flex-wrap items-center gap-4">
            {Object.entries(metadata).map(([key, val]) => (
              <span key={key}>
                <span className="opacity-70">{key}:</span> <strong className="text-white font-medium">{val}</strong>
              </span>
            ))}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors"
            title="Copy Result Card"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
