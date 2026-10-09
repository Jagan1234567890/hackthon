'use client';

import React, { useState } from 'react';
import { LedgerRecord } from '@/types/ledger';
import { ShieldCheck, CheckCircle2, Download, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface LedgerTableProps {
  records: LedgerRecord[];
  onVerifyChain: () => Promise<{ isValid: boolean; totalBlocks: number }>;
  className?: string;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  records,
  onVerifyChain,
  className,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<LedgerRecord | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      const result = await onVerifyChain();
      setVerifyStatus(
        result.isValid
          ? `CHAIN VERIFIED: All ${result.totalBlocks} blocks cryptographically unbroken.`
          : 'CHAIN COMPROMISED: Hash mismatch detected.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleExportJson = (record: LedgerRecord) => {
    const jsonStr = JSON.stringify(record, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KEYHOLE-Ledger-${record.caseId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={clsx('space-y-4 font-mono text-xs', className)}>
      {/* Ledger Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl glass border border-[oklch(0.22_0.01_280/80%)]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[oklch(0.72_0.17_155)]" />
            <span className="font-bold text-white text-sm">
              IMMUTABLE CASE LEDGER &bull; CHAIN-OF-CUSTODY
            </span>
          </div>
          <p className="text-[11px] text-[oklch(0.66_0.015_280)] mt-0.5 font-sans">
            Cryptographic SHA-256 Merkle link anchors every authenticity verdict and vault sealing operation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isVerifying && 'animate-spin')} />
            <span>{isVerifying ? 'Verifying...' : 'Re-verify Chain'}</span>
          </button>
        </div>
      </div>

      {verifyStatus && (
        <div
          className={clsx(
            'p-3 rounded-lg border text-xs font-semibold flex items-center gap-2',
            verifyStatus.includes('VERIFIED')
              ? 'border-[oklch(0.72_0.17_155/40%)] bg-[oklch(0.72_0.17_155/12%)] text-[oklch(0.85_0.12_155)]'
              : 'border-[oklch(0.63_0.2_25/40%)] bg-[oklch(0.63_0.2_25/12%)] text-[oklch(0.85_0.15_25)]'
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{verifyStatus}</span>
        </div>
      )}

      {/* Dense Mono Table */}
      <div className="glass rounded-xl border border-[oklch(0.22_0.01_280/80%)] overflow-hidden">
        <div className="overflow-x-auto max-h-[460px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[oklch(0.04_0_0)] border-b border-[oklch(0.22_0.01_280/60%)] sticky top-0 z-10 text-[11px] text-[oklch(0.55_0.01_280)]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Kind</th>
                <th className="py-2.5 px-3">Input Target</th>
                <th className="py-2.5 px-3">SHA-256</th>
                <th className="py-2.5 px-3">Verdict / State</th>
                <th className="py-2.5 px-3">Model / KDF</th>
                <th className="py-2.5 px-3">Chain Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[oklch(0.18_0.01_280/50%)] text-[11px]">
              {records.map((rec) => {
                const isSelected = selectedRecord?.caseId === rec.caseId;
                return (
                  <tr
                    key={rec.caseId}
                    onClick={() => setSelectedRecord(rec)}
                    className={clsx(
                      'hover:bg-[oklch(0.08_0.005_280)] cursor-pointer transition-colors',
                      isSelected && 'bg-[oklch(0.62_0.22_295/10%)]'
                    )}
                  >
                    <td className="py-2 px-3 text-[oklch(0.66_0.015_280)] whitespace-nowrap">
                      {rec.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">
                      {rec.kind}
                    </td>
                    <td className="py-2 px-3 text-[oklch(0.85_0.01_280)] truncate max-w-[160px]" title={rec.inputFilename}>
                      {rec.inputFilename}
                    </td>
                    <td className="py-2 px-3 text-[oklch(0.62_0.22_295)] font-mono">
                      {rec.inputSha256.slice(0, 10)}...
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-bold',
                          rec.verdict.includes('AUTHENTIC') || rec.verdict.includes('SEALED')
                            ? 'bg-[oklch(0.72_0.17_155/15%)] text-[oklch(0.72_0.17_155)] border border-[oklch(0.72_0.17_155/30%)]'
                            : rec.verdict.includes('MANIPULATION')
                            ? 'bg-[oklch(0.63_0.2_25/15%)] text-[oklch(0.63_0.2_25)] border border-[oklch(0.63_0.2_25/30%)]'
                            : 'bg-[oklch(0.78_0.15_85/15%)] text-[oklch(0.78_0.15_85)] border border-[oklch(0.78_0.15_85/30%)]'
                        )}
                      >
                        {rec.verdict}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[oklch(0.66_0.015_280)] truncate max-w-[140px]" title={rec.modelOrKdfInfo}>
                      {rec.modelOrKdfInfo}
                    </td>
                    <td className="py-2 px-3 text-[oklch(0.55_0.01_280)] font-mono">
                      {rec.evidenceChainHash.slice(0, 8)}...
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Record Detail Modal / Panel */}
      {selectedRecord && (
        <div className="glass-elevated rounded-xl p-4 border border-[oklch(0.25_0.02_295/80%)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[oklch(0.22_0.01_280/60%)]">
            <span className="font-bold text-white">
              Case Record: {selectedRecord.caseId}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportJson(selectedRecord)}
                className="btn-ghost px-2.5 py-1 rounded text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export Case JSON</span>
              </button>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-[oklch(0.55_0.01_280)] hover:text-white px-2"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[oklch(0.55_0.01_280)] block">Target File:</span>
              <span className="text-white font-semibold">{selectedRecord.inputFilename}</span>
            </div>
            <div>
              <span className="text-[oklch(0.55_0.01_280)] block">Target SHA-256:</span>
              <span className="text-[oklch(0.75_0.01_280)] select-all">{selectedRecord.inputSha256}</span>
            </div>
            <div>
              <span className="text-[oklch(0.55_0.01_280)] block">Block Chain Hash:</span>
              <span className="text-[oklch(0.62_0.22_295)] select-all">{selectedRecord.evidenceChainHash}</span>
            </div>
            <div>
              <span className="text-[oklch(0.55_0.01_280)] block">Previous Block Anchor:</span>
              <span className="text-[oklch(0.55_0.01_280)] select-all">{selectedRecord.previousRecordHash}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
