'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GLOSSARY_DICTIONARY } from '@/lib/plainCopy';
import { clsx } from 'clsx';

interface GlossaryTokenProps {
  termKey: string;
  children?: React.ReactNode;
  className?: string;
}

export const GlossaryToken: React.FC<GlossaryTokenProps> = ({
  termKey,
  children,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const entry = GLOSSARY_DICTIONARY[termKey] || {
    term: termKey,
    plainDefinition: 'Technical cryptographic or forensic term.',
    technicalTerm: termKey,
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = `glossary-popover-${termKey.replace(/[^a-zA-Z0-9]/g, '-')}`;

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 120); // 120ms open delay per Section 6 to prevent hover flicker
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span className="relative inline-block" onMouseLeave={handleMouseLeave}>
      <button
        ref={buttonRef}
        type="button"
        aria-describedby={isOpen ? popoverId : undefined}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={handleMouseEnter}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={clsx(
          'inline cursor-help text-inherit underline decoration-dotted decoration-[oklch(0.62_0.22_295)] underline-offset-4 hover:text-[oklch(0.985_0_0)] hover:decoration-solid transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.62_0.22_295)] focus-visible:ring-offset-2 focus-visible:ring-offset-[oklch(0.02_0_0)] rounded-sm font-inherit',
          className
        )}
      >
        {children || entry.term}
      </button>

      {isOpen && (
        <div
          id={popoverId}
          role="tooltip"
          className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3.5 rounded-xl glass-elevated border border-[oklch(0.22_0.01_280/80%)] shadow-2xl animate-fade-in text-left select-none text-xs"
          style={{ transitionDuration: '200ms' }}
        >
          <div className="font-semibold text-white tracking-wide mb-1 font-sans">
            {entry.term}
          </div>
          <p className="text-[oklch(0.85_0.01_280)] leading-relaxed mb-2 font-sans">
            {entry.plainDefinition}
          </p>
          <div className="pt-2 border-t border-[oklch(0.22_0.01_280/60%)] flex items-start gap-1 font-mono text-[10px] text-[oklch(0.66_0.015_280)]">
            <span className="text-[oklch(0.62_0.22_295)] font-semibold shrink-0">In tech terms:</span>
            <span className="truncate">{entry.technicalTerm}</span>
          </div>
        </div>
      )}
    </span>
  );
};
