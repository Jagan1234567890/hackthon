'use client';

import React, { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  title?: string;
  maxHeight?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'json',
  showLineNumbers = true,
  title,
  maxHeight = '320px',
  className = '',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.split('\n');

  return (
    <div className={`rounded-xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.06_0.005_280)] overflow-hidden font-mono text-xs ${className}`}>
      {/* Header bar */}
      <div className="px-4 py-2 bg-[oklch(0.09_0.008_280)] border-b border-[oklch(0.22_0.01_280/40%)] flex items-center justify-between text-[11px] text-[oklch(0.66_0.015_280)]">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
          <span className="font-semibold text-white">{title || language.toUpperCase()}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[oklch(0.85_0.01_280)] hover:text-white transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents with line numbers */}
      <div className="overflow-x-auto p-4 leading-relaxed" style={{ maxHeight }}>
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                {showLineNumbers && (
                  <td className="pr-4 text-right select-none text-[oklch(0.4_0.01_280)] w-8 text-[11px]">
                    {idx + 1}
                  </td>
                )}
                <td className="text-[oklch(0.9_0.01_280)] whitespace-pre font-mono">
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
