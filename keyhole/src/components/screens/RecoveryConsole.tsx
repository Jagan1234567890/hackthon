'use client';

import React, { useState } from 'react';
import { LeftRail } from '@/components/console/LeftRail';
import { CenterTabs } from '@/components/console/CenterTabs';
import { RightRail } from '@/components/console/RightRail';
import { ResultDrawer } from '@/components/console/ResultDrawer';
import {
  AnalyzedFile,
  Candidate,
  RecoveryMode,
  RecoveryVerdictData,
  StageExecution,
  UserAnswers,
} from '@/types/recovery';
import {
  buildStageLadder,
  determineVerdict,
  generateTargetedCandidates,
} from '@/lib/recovery-engine';
import { appendLedgerRecord } from '@/lib/ledger-engine';
import { LogLine } from '@/components/ui/Terminal';
import { clsx } from 'clsx';

interface RecoveryConsoleProps {
  className?: string;
}

export const RecoveryConsole: React.FC<RecoveryConsoleProps> = ({ className }) => {
  const [analyzedFile, setAnalyzedFile] = useState<AnalyzedFile | null>(null);
  const [mode, setMode] = useState<RecoveryMode>('B');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const [userAnswers, setUserAnswers] = useState<UserAnswers>({
    rememberedWords: 'Varun, Mumbai, Secret',
    approxLength: '10-14 chars',
    specialChars: '@, !, #, 123',
    datesOrYears: '2024, 2023, 1998',
    ownMachine: true,
    hasGpu: true,
    gpuModel: 'NVIDIA RTX 4090',
    cpuCores: 16,
    successBar: 'one',
  });

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stages, setStages] = useState<StageExecution[]>([]);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [verdictData, setVerdictData] = useState<RecoveryVerdictData | null>(null);

  const addLog = (type: LogLine['type'], text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        type,
        text,
        timestamp: time,
      },
    ]);
  };

  const handleFileAnalyzed = (file: AnalyzedFile) => {
    setAnalyzedFile(file);
    const initialCandidates = generateTargetedCandidates(userAnswers, file.name);
    setCandidates(initialCandidates);
    const ladder = buildStageLadder(mode, file, userAnswers);
    setStages(ladder);
    setActiveStageIndex(0);

    addLog('prompt', `Target ingested: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    addLog('info', `Original SHA-256: ${file.sha256}`);
    addLog('flag', `Shannon Entropy: ${file.entropy} bits/byte`);
    addLog('info', `Container: ${file.containerType} | Cipher: ${file.cipher}`);
  };

  const handleUpdateAnswers = (newAnswers: Partial<UserAnswers>) => {
    const updated = { ...userAnswers, ...newAnswers };
    setUserAnswers(updated);
    if (analyzedFile) {
      const regenerated = generateTargetedCandidates(updated, analyzedFile.name);
      setCandidates(regenerated);
    }
  };

  const handleUpdateCandidate = (id: string, newPassphrase: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, passphrase: newPassphrase } : c))
    );
  };

  const handleStartRecovery = async () => {
    if (!analyzedFile) {
      addLog('fail', 'No target container loaded. Drop an encrypted file first.');
      return;
    }
    if (!isAuthorized) {
      addLog('fail', 'Authorization gate rejected: Requester must affirm file ownership.');
      return;
    }

    setIsRunning(true);
    setVerdictData(null);

    addLog('prompt', `Ascending 6-Stage Recovery Ladder for ${analyzedFile.name}`);
    addLog('info', `Authorization confirmed: "Target is owned/authorized by requester"`);

    const ladder = buildStageLadder(mode, analyzedFile, userAnswers);
    setStages(ladder);

    for (let i = 0; i < ladder.length; i++) {
      setActiveStageIndex(i);
      setStages((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s))
      );

      const curStage = ladder[i];
      addLog('prompt', `$ ${curStage.command}`);
      await new Promise((r) => setTimeout(r, 600));

      curStage.findings.forEach((finding) => {
        addLog('info', `  • ${finding}`);
      });

      setStages((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'pass' } : s))
      );
      addLog('pass', `${curStage.tag} (${curStage.name}) complete.`);
      await new Promise((r) => setTimeout(r, 400));
    }

    const finalVerdict = determineVerdict(mode, analyzedFile, candidates, userAnswers);
    setVerdictData(finalVerdict);
    setIsRunning(false);

    await appendLedgerRecord(
      'RECOVERY_LADDER',
      analyzedFile.name,
      analyzedFile.sha256,
      finalVerdict.verdict,
      `Probability: ${finalVerdict.probability}%`,
      `Ladder 6-stages completed`
    );

    addLog(
      finalVerdict.verdict === 'RECOVERED' ? 'pass' : 'fail',
      `Terminal Verdict: [${finalVerdict.verdict}] (${finalVerdict.probability}% Probability)`
    );
  };

  return (
    <div className={clsx('flex-1 flex flex-col lg:flex-row overflow-hidden bg-[oklch(0.02_0_0)]', className)}>
      <LeftRail
        analyzedFile={analyzedFile}
        onFileAnalyzed={handleFileAnalyzed}
        mode={mode}
        onSelectMode={(m) => {
          setMode(m);
          if (analyzedFile) {
            setStages(buildStageLadder(m, analyzedFile, userAnswers));
          }
        }}
        isAuthorized={isAuthorized}
        onToggleAuthorized={setIsAuthorized}
      />

      <CenterTabs
        analyzedFile={analyzedFile}
        candidates={candidates}
        onUpdateCandidate={handleUpdateCandidate}
        stages={stages}
        activeStageIndex={activeStageIndex}
        isRunning={isRunning}
        onStartRecovery={handleStartRecovery}
        isAuthorized={isAuthorized}
        userAnswers={userAnswers}
        onUpdateAnswers={handleUpdateAnswers}
      />

      <RightRail
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {verdictData && analyzedFile && (
        <ResultDrawer
          analyzedFile={analyzedFile}
          verdictData={verdictData}
          onClose={() => setVerdictData(null)}
        />
      )}
    </div>
  );
};
