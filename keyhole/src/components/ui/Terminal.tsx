import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Terminal as TerminalIcon, Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface LogLine {
  id: string;
  type: 'prompt' | 'info' | 'flag' | 'pass' | 'fail' | 'timing' | 'raw';
  text: string;
  timestamp: string;
}

interface TerminalProps {
  logs: LogLine[];
  className?: string;
  onClear?: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, className, onClear }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleCopyLogs = () => {
    const rawText = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const rawText = logs.map((l) => `[${l.timestamp}] ${l.text}`).join('\n');
    const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `keyhole-execution-${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={clsx(
        'glass-elevated rounded-2xl flex flex-col h-[400px] border border-[oklch(0.22_0.01_280/80%)] overflow-hidden shadow-2xl',
        className
      )}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.04_0_0)]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.63_0.2_25/80%)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.78_0.15_85/80%)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[oklch(0.72_0.17_155/80%)]" />
          </div>
          <TerminalIcon className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
          <span className="font-mono text-xs font-semibold text-[oklch(0.85_0.01_280)]">
            tty://keyhole/live-forensics
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="px-2 py-1 rounded text-[11px] font-mono font-medium text-[oklch(0.66_0.015_280)] hover:text-white bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/50%)] transition-colors cursor-pointer"
              title="Clear Terminal"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLogs}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium text-[oklch(0.66_0.015_280)] hover:text-white bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/50%)] transition-colors cursor-pointer"
            title="Copy Terminal Logs"
          >
            {copied ? <Check className="w-3 h-3 text-[oklch(0.72_0.17_155)]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadLogs}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium text-[oklch(0.66_0.015_280)] hover:text-white bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/50%)] transition-colors cursor-pointer"
            title="Download .log File"
          >
            <Download className="w-3 h-3" />
            <span>.log</span>
          </button>
        </div>
      </div>

      {/* Terminal Screen (14 fixed rows viewable, auto-scrolling) */}
      <div
        role="log"
        aria-live="polite"
        className="flex-1 p-4 overflow-y-auto font-mono text-[11.5px] leading-relaxed bg-[oklch(0.02_0_0)] space-y-1 select-text"
      >
        {logs.length === 0 ? (
          <div className="text-[oklch(0.45_0.01_280)] italic">
            Waiting for analysis initiation... Select a target and verify ownership authorization.
          </div>
        ) : (
          logs.map((log) => {
            return (
              <div key={log.id} className="flex items-start gap-2 break-all">
                <span className="text-[oklch(0.4_0.01_280)] shrink-0 select-none">
                  {log.timestamp}
                </span>

                {log.type === 'prompt' && (
                  <span className="text-[oklch(0.68_0.22_295)] font-semibold">
                    &gt; {log.text}
                  </span>
                )}

                {log.type === 'flag' && (
                  <span className="text-[oklch(0.78_0.01_280)]">
                    [FLAG] {log.text}
                  </span>
                )}

                {log.type === 'pass' && (
                  <span className="text-[oklch(0.72_0.17_155)] font-semibold">
                    [PASS] {log.text}
                  </span>
                )}

                {log.type === 'fail' && (
                  <span className="text-[oklch(0.63_0.2_25)] font-semibold">
                    [FAIL] {log.text}
                  </span>
                )}

                {log.type === 'timing' && (
                  <span className="text-[oklch(0.75_0.14_210)]">
                    [BENCHMARK] {log.text}
                  </span>
                )}

                {log.type === 'info' && (
                  <span className="text-[oklch(0.66_0.015_280)]">
                    {log.text}
                  </span>
                )}

                {log.type === 'raw' && (
                  <span className="text-[oklch(0.85_0.01_280)]">
                    {log.text}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
