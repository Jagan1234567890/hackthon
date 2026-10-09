'use client';

import React, { useState } from 'react';
import { LedgerRecord } from '@/types/ledger';
import { getLedgerRecords, verifyLedgerChain } from '@/lib/ledger-engine';
import { LedgerTable } from '@/components/ui/LedgerTable';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

export const LedgerConsole: React.FC<{ className?: string }> = ({ className }) => {
  const [records] = useState<LedgerRecord[]>(() => getLedgerRecords());

  const handleVerifyChain = async () => {
    return await verifyLedgerChain();
  };

  return (
    <div className={clsx('flex-1 p-6 overflow-y-auto space-y-6 max-w-7xl mx-auto w-full', className)}>
      <div className="flex items-center justify-between pb-4 border-b border-[oklch(0.22_0.01_280/60%)]">
        <div>
          <h2 className="font-sans font-bold text-lg text-white">
            Forensic Case Ledger &bull; Chain of Custody
          </h2>
          <p className="text-xs text-[oklch(0.66_0.015_280)] mt-0.5 font-sans">
            Cryptographically anchored tamper-evident journal recording all media forgery inspections, vault operations, and recovery runs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <div className="font-mono text-xs text-[oklch(0.72_0.17_155)] border border-[oklch(0.72_0.17_155/30%)] bg-[oklch(0.72_0.17_155/10%)] px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SHA-256 Merkle Chain Active</span>
          </div>
        </div>
      </div>

      <LedgerTable
        records={records}
        onVerifyChain={handleVerifyChain}
      />
    </div>
  );
};
