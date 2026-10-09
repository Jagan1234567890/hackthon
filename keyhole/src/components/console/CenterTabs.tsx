'use client';

import React, { useState } from 'react';
import { AnalyzedFile, Candidate, StageExecution, UserAnswers } from '@/types/recovery';
import { Meter } from '@/components/ui/Meter';
import { BtnPrimary } from '@/components/ui/BtnPrimary';
import { Stepper } from '@/components/ui/Stepper';
import {
  Binary,
  KeyRound,
  Play,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface CenterTabsProps {
  analyzedFile: AnalyzedFile | null;
  candidates: Candidate[];
  onUpdateCandidate: (id: string, newPassphrase: string) => void;
  stages: StageExecution[];
  activeStageIndex: number;
  isRunning: boolean;
  onStartRecovery: () => void;
  isAuthorized: boolean;
  userAnswers: UserAnswers;
  onUpdateAnswers: (answers: Partial<UserAnswers>) => void;
  className?: string;
}

export const CenterTabs: React.FC<CenterTabsProps> = ({
  analyzedFile,
  candidates,
  onUpdateCandidate,
  stages,
  activeStageIndex,
  isRunning,
  onStartRecovery,
  isAuthorized,
  userAnswers,
  onUpdateAnswers,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'candidates' | 'run'>('inspector');

  return (
    <main className={clsx('flex-1 flex flex-col p-5 overflow-y-auto bg-[oklch(0.02_0_0)]', className)}>
      {/* Tab Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[oklch(0.22_0.01_280/60%)] mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)]">
          <button
            onClick={() => setActiveTab('inspector')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'inspector'
                ? 'bg-[oklch(0.62_0.22_295)] text-white shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <Binary className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>

          <button
            onClick={() => setActiveTab('candidates')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'candidates'
                ? 'bg-[oklch(0.62_0.22_295)] text-white shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Candidates ({candidates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('run')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'run'
                ? 'bg-[oklch(0.62_0.22_295)] text-white shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Execution Ladder</span>
          </button>
        </div>

        {/* Quick Launch Button in Header */}
        {activeTab !== 'run' && (
          <button
            disabled={!analyzedFile || !isAuthorized || isRunning}
            onClick={onStartRecovery}
            className="btn-primary px-4 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Run Pipeline</span>
          </button>
        )}
      </div>

      {/* TAB 1: INSPECTOR */}
      {activeTab === 'inspector' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!analyzedFile ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-[oklch(0.22_0.01_280)] bg-[oklch(0.04_0_0)] text-xs text-[oklch(0.55_0.01_280)]">
              Drop an encrypted file in the left rail to inspect parsed headers and KDF parameters.
            </div>
          ) : (
            <>
              {/* Header Breakdown Table */}
              <div className="glass rounded-xl p-4 border border-[oklch(0.22_0.01_280/80%)] overflow-x-auto">
                <div className="font-mono text-xs font-bold text-white mb-3 flex items-center justify-between">
                  <span>PARSED CONTAINER STRUCTURE</span>
                  <span className="text-[oklch(0.62_0.22_295)]">{analyzedFile.containerType}</span>
                </div>

                <table className="w-full text-left font-mono text-xs border-collapse">
                  <tbody>
                    <tr className="border-b border-[oklch(0.18_0.01_280)]">
                      <td className="py-2 text-[oklch(0.55_0.01_280)] w-1/3">Detected MIME:</td>
                      <td className="py-2 text-white font-semibold">{analyzedFile.detectedMime}</td>
                    </tr>
                    <tr className="border-b border-[oklch(0.18_0.01_280)]">
                      <td className="py-2 text-[oklch(0.55_0.01_280)]">Cipher Specification:</td>
                      <td className="py-2 text-[oklch(0.85_0.01_280)]">{analyzedFile.cipher}</td>
                    </tr>
                    <tr className="border-b border-[oklch(0.18_0.01_280)]">
                      <td className="py-2 text-[oklch(0.55_0.01_280)]">KDF &amp; Hash Work:</td>
                      <td className="py-2 text-[oklch(0.62_0.22_295)] font-semibold">{analyzedFile.kdf}</td>
                    </tr>
                    <tr className="border-b border-[oklch(0.18_0.01_280)]">
                      <td className="py-2 text-[oklch(0.55_0.01_280)]">Iteration Count:</td>
                      <td className="py-2 text-white">
                        {analyzedFile.iterations.toLocaleString()} iter{' '}
                        <span className="text-[oklch(0.55_0.01_280)] text-[10px]">
                          ({analyzedFile.iterations < 100000 ? 'Low cost -> crackable' : 'High cost -> strict budget'})
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 text-[oklch(0.55_0.01_280)]">Format Security:</td>
                      <td className="py-2">
                        {analyzedFile.isLegacyWeak ? (
                          <span className="font-bold text-[oklch(0.63_0.2_25)]">
                            LEGACY WEAK (Known-plaintext attack viable via bkcrack)
                          </span>
                        ) : (
                          <span className="font-bold text-[oklch(0.72_0.17_155)]">
                            CRYPTOGRAPHICALLY SOUND PRIMITIVE
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Raw Magic Bytes Hex Viewer */}
              <div className="glass rounded-xl p-4 border border-[oklch(0.22_0.01_280/80%)] space-y-2">
                <div className="font-mono text-xs font-semibold text-white flex items-center justify-between">
                  <span>FIRST 64 BYTES (xxd -l 64)</span>
                  <span className="text-[10px] text-[oklch(0.55_0.01_280)]">Magic Byte Verification</span>
                </div>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] text-[oklch(0.78_0.01_280)] leading-relaxed overflow-x-auto select-all">
                  {analyzedFile.first64Hex}
                </div>
              </div>

              {/* Contextual Input Form (Batched 5 questions) */}
              <div className="glass rounded-xl p-4 border border-[oklch(0.22_0.01_280/80%)] space-y-3">
                <div className="font-mono text-xs font-semibold text-white flex items-center justify-between">
                  <span>HUMAN-FACTOR CONTEXT</span>
                  <span className="text-[10px] text-[oklch(0.62_0.22_295)] font-mono">Improves P1 candidate ranking</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[oklch(0.66_0.015_280)] mb-1">
                      Remembered root words (comma separated):
                    </label>
                    <input
                      type="text"
                      value={userAnswers.rememberedWords}
                      onChange={(e) => onUpdateAnswers({ rememberedWords: e.target.value })}
                      placeholder="e.g. Varun, Mumbai, Secret, Vault"
                      className="w-full px-3 py-2 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280)] text-white focus:outline-none focus:border-[oklch(0.62_0.22_295)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[oklch(0.66_0.015_280)] mb-1">
                      Key dates / birth years:
                    </label>
                    <input
                      type="text"
                      value={userAnswers.datesOrYears}
                      onChange={(e) => onUpdateAnswers({ datesOrYears: e.target.value })}
                      placeholder="e.g. 2024, 2023, 1998, 123"
                      className="w-full px-3 py-2 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280)] text-white focus:outline-none focus:border-[oklch(0.62_0.22_295)] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[oklch(0.66_0.015_280)] mb-1">
                      GPU Model (for accurate Hashcat math):
                    </label>
                    <input
                      type="text"
                      value={userAnswers.gpuModel}
                      onChange={(e) => onUpdateAnswers({ gpuModel: e.target.value })}
                      placeholder="e.g. NVIDIA RTX 4090 (24GB)"
                      className="w-full px-3 py-2 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280)] text-white focus:outline-none focus:border-[oklch(0.62_0.22_295)] font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[oklch(0.85_0.01_280)]">
                      <input
                        type="checkbox"
                        checked={userAnswers.ownMachine}
                        onChange={(e) => onUpdateAnswers({ ownMachine: e.target.checked })}
                        className="rounded border-[oklch(0.35_0.08_295)] text-[oklch(0.62_0.22_295)] focus:ring-[oklch(0.62_0.22_295)] bg-[oklch(0.04_0_0)] cursor-pointer"
                      />
                      <span>I own the machine that encrypted it (Stage 1 search)</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: CANDIDATES */}
      {activeTab === 'candidates' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-sans font-semibold text-sm text-white">
                Rule-Generated Candidate Ranking (Top 20)
              </h3>
              <p className="text-xs text-[oklch(0.66_0.015_280)]">
                Synthesized from remembered roots, South-Asian naming patterns (Name@123), and KoreKel rules.
              </p>
            </div>
            <span className="font-mono text-xs text-[oklch(0.62_0.22_295)]">
              {candidates.length} Ranked Keys
            </span>
          </div>

          <div className="glass rounded-xl border border-[oklch(0.22_0.01_280/80%)] overflow-hidden">
            <div className="max-h-[380px] overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-[oklch(0.04_0_0)] border-b border-[oklch(0.22_0.01_280/60%)] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 text-[oklch(0.55_0.01_280)] font-semibold w-12">#</th>
                    <th className="py-2.5 px-4 text-[oklch(0.55_0.01_280)] font-semibold">Candidate Passphrase</th>
                    <th className="py-2.5 px-4 text-[oklch(0.55_0.01_280)] font-semibold w-24">Confidence</th>
                    <th className="py-2.5 px-4 text-[oklch(0.55_0.01_280)] font-semibold">Rule / Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[oklch(0.18_0.01_280/60%)]">
                  {candidates.map((cand, idx) => (
                    <tr key={cand.id} className="hover:bg-[oklch(0.08_0.005_280)] transition-colors">
                      <td className="py-2 px-4 text-[oklch(0.55_0.01_280)] font-bold">{idx + 1}</td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={cand.passphrase}
                          onChange={(e) => onUpdateCandidate(cand.id, e.target.value)}
                          className="bg-transparent text-white font-semibold focus:outline-none focus:bg-[oklch(0.04_0_0)] px-2 py-0.5 rounded border border-transparent focus:border-[oklch(0.62_0.22_295)] w-full"
                        />
                      </td>
                      <td className="py-2 px-4 font-bold text-[oklch(0.72_0.17_155)]">
                        {cand.confidence}%
                      </td>
                      <td className="py-2 px-4 text-[oklch(0.66_0.015_280)] truncate max-w-xs" title={cand.rationale}>
                        {cand.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RUN & LADDER */}
      {activeTab === 'run' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Large Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl glass-elevated border border-[oklch(0.25_0.02_295/80%)] shadow-2xl">
            <div>
              <div className="font-sans font-bold text-base text-white">
                Ascend 6-Stage Recovery Ladder
              </div>
              <p className="text-xs text-[oklch(0.66_0.015_280)] mt-0.5">
                Executes cheapest-first triage through budgeted offline cracking.
              </p>
            </div>

            <BtnPrimary
              disabled={!analyzedFile || !isAuthorized || isRunning}
              isLoading={isRunning}
              onClick={onStartRecovery}
              className="px-8 py-3.5 text-sm font-bold w-full sm:w-auto"
            >
              <Zap className="w-4 h-4" />
              <span>{isRunning ? 'Analyzing Ladder...' : 'Begin Recovery Run'}</span>
            </BtnPrimary>
          </div>

          {/* Amber Kill-Criterion Warning Strip */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-[oklch(0.78_0.15_85/40%)] bg-[oklch(0.78_0.15_85/10%)] text-xs text-[oklch(0.88_0.12_85)]">
            <AlertTriangle className="w-4 h-4 text-[oklch(0.78_0.15_85)] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Budget &amp; Kill-Criterion Notice:</strong>
              If Pass 2 (rockyou + dive.rule) fails after budgeted allocation, expected mathematical success drops below ~2%. KEYHOLE will recommend terminating search rather than wasting GPU energy.
            </div>
          </div>

          {/* Stepper Node Display */}
          <div className="space-y-3">
            <div className="font-mono text-xs font-semibold text-white flex items-center justify-between">
              <span>LIVE STAGE PROGRESSION</span>
              <span className="text-[oklch(0.62_0.22_295)]">Stage {activeStageIndex + 1} of {stages.length}</span>
            </div>
            <Stepper stages={stages} activeStageIndex={activeStageIndex} />
          </div>

          {/* Offline Cracking Budget Bars (P1-P4) */}
          <div className="glass rounded-xl p-4 border border-[oklch(0.22_0.01_280/80%)] space-y-4">
            <div className="font-mono text-xs font-semibold text-white">
              OFFLINE CRACKING THROUGHPUT BUDGET (HASHCAT BENCHMARK)
            </div>

            <div className="space-y-3">
              <Meter
                value={100}
                max={100}
                label="Pass 1: Curated Top Rules (Minutes)"
                showValue
                unit="Complete"
                color="green"
                subLabel="Keyspace: 1,420 candidates &bull; GPU Hours: 0.005h"
              />
              <Meter
                value={isRunning ? 60 : 0}
                max={100}
                label="Pass 2: Rockyou + Dive Rules (Hours)"
                showValue
                unit={isRunning ? 'Active' : 'Standby'}
                color="violet"
                subLabel="Keyspace: 14.3M &bull; GPU Hours: 2.4h"
              />
              <Meter
                value={0}
                max={100}
                label="Pass 3: Structural Masks ?u?l?l?l?d?d?d?d (Overnight)"
                showValue
                unit="Standby"
                color="amber"
                subLabel="Keyspace: 456M &bull; GPU Hours: 6.1h"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
