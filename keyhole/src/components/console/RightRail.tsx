'use client';

import React from 'react';
import { Terminal, LogLine } from '@/components/ui/Terminal';
import { clsx } from 'clsx';

interface RightRailProps {
  logs: LogLine[];
  className?: string;
  onClearLogs?: () => void;
}

export const RightRail: React.FC<RightRailProps> = ({ logs, className, onClearLogs }) => {
  return (
    <aside
      className={clsx(
        'w-full lg:w-[360px] shrink-0 p-4 border-l border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/50%)] flex flex-col',
        className
      )}
    >
      <div className="font-mono text-[10px] font-semibold text-[oklch(0.62_0.22_295)] uppercase tracking-wider mb-2">
        Live Execution Terminal
      </div>
      <Terminal logs={logs} className="flex-1 h-full min-h-[420px]" onClear={onClearLogs} />
    </aside>
  );
};
