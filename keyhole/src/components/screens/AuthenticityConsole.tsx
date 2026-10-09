'use client';

import React, { useState } from 'react';
import { MediaType, AuthenticityResult } from '@/types/authenticity';
import { KeyholeSettings } from '@/types/settings';
import { analyzeMediaAuthenticity } from '@/lib/authenticity-engine';
import { appendLedgerRecord } from '@/lib/ledger-engine';
import { VerdictCard } from '@/components/ui/VerdictCard';
import { FrameScrubber } from '@/components/ui/FrameScrubber';
import { HeatmapOverlay } from '@/components/ui/HeatmapOverlay';
import { Terminal, LogLine } from '@/components/ui/Terminal';
import {
  ShieldCheck,
  Image as ImageIcon,
  Video,
  Mic,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AuthenticityConsoleProps {
  settings: KeyholeSettings;
  className?: string;
}

export const AuthenticityConsole: React.FC<AuthenticityConsoleProps> = ({
  settings,
  className,
}) => {
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('VIDEO');
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuthenticityResult | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'frames' | 'signals' | 'provenance'>('overview');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);

  const addLog = (type: LogLine['type'], text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [
      ...prev,
      { id: `log-${Date.now()}-${Math.random()}`, type, text, timestamp: time },
    ]);
  };

  const handleFileDrop = async (file: File) => {
    setTargetFile(file);
    // Auto-detect media type from mime/extension
    if (file.type.startsWith('video') || /\.(mp4|mov|webm|mkv)$/i.test(file.name)) {
      setSelectedMediaType('VIDEO');
    } else if (file.type.startsWith('audio') || /\.(mp3|wav|ogg|flac|m4a)$/i.test(file.name)) {
      setSelectedMediaType('AUDIO');
    } else {
      setSelectedMediaType('PHOTO');
    }

    addLog('prompt', `Ingested media target: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    addLog('info', `MIME: ${file.type || 'binary/stream'} &bull; Prepared for deterministic + learned evaluation.`);
  };

  const handleRunAnalysis = async () => {
    if (!targetFile) {
      addLog('fail', 'No media target ingested.');
      return;
    }
    if (!isAuthorized) {
      addLog('fail', 'Authorization required: Requester must confirm lawful possession.');
      return;
    }

    setIsAnalyzing(true);
    addLog('prompt', `Starting Authenticity Pipeline (${selectedMediaType}) for ${targetFile.name}`);
    addLog('info', `Evaluating: C2PA Provenance -> FFT/DCT Noise -> Temporal Landmarks -> Neural Detectors`);

    await new Promise((r) => setTimeout(r, 600));

    try {
      const res = await analyzeMediaAuthenticity(targetFile, selectedMediaType, settings);
      setResult(res);
      setActiveFrameIndex(0);

      // Log signal outputs
      res.signals.forEach((sig) => {
        addLog(
          sig.verdict === 'PASS' ? 'pass' : sig.verdict === 'FAIL' ? 'fail' : 'flag',
          `[${sig.verdict}] ${sig.name}: ${sig.explanation.slice(0, 80)}...`
        );
      });

      addLog(
        res.verdict === 'AUTHENTIC-CONSISTENT' ? 'pass' : res.verdict === 'MANIPULATION-INDICATORS-DETECTED' ? 'fail' : 'flag',
        `Terminal Verdict: [${res.verdict}] (Calibrated Score: ${res.calibratedScore})`
      );

      // Record in immutable ledger
      await appendLedgerRecord(
        'AUTHENTICITY_INSPECTION',
        res.filename,
        res.sha256,
        res.verdict,
        `Score: ${res.calibratedScore}`,
        `Signals: ${res.signals.length} evaluated`
      );
      addLog('pass', `Case immutable record anchored into cryptographic ledger.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={clsx('flex-1 flex flex-col lg:flex-row overflow-hidden bg-[oklch(0.02_0_0)]', className)}>
      {/* LEFT RAIL (280px) */}
      <aside className="w-full lg:w-[280px] shrink-0 p-4 border-r border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/50%)] flex flex-col gap-4 overflow-y-auto">
        <div>
          <div className="font-mono text-[10px] font-semibold text-[oklch(0.62_0.22_295)] uppercase tracking-wider mb-2">
            Media Ingestion
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
            }}
            onClick={() => {
              const el = document.getElementById('authenticity-file-input');
              el?.click();
            }}
            className="p-5 rounded-xl border-2 border-dashed border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280/60%)] hover:border-[oklch(0.62_0.22_295)] text-center cursor-pointer transition-all"
          >
            <input
              id="authenticity-file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
              }}
            />
            <div className="flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-[oklch(0.62_0.22_295)]" />
              <div className="text-xs font-semibold text-white">
                {targetFile ? targetFile.name : 'Drop photo, video or audio'}
              </div>
              <p className="text-[10px] text-[oklch(0.55_0.01_280)] font-sans">
                {targetFile ? `${(targetFile.size / 1024).toFixed(1)} KB` : 'Local sandbox &bull; 0 bytes uploaded'}
              </p>
            </div>
          </div>
        </div>

        {/* Media Type Chips */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="text-[10px] text-[oklch(0.62_0.22_295)] font-semibold uppercase">
            Analysis Modality
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['PHOTO', 'VIDEO', 'AUDIO'] as MediaType[]).map((t) => {
              const isSel = selectedMediaType === t;
              const Icon = t === 'PHOTO' ? ImageIcon : t === 'VIDEO' ? Video : Mic;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedMediaType(t)}
                  className={clsx(
                    'p-2 rounded-lg border text-center flex flex-col items-center gap-1 cursor-pointer transition-all',
                    isSel
                      ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/20%)] text-white font-bold'
                      : 'border-[oklch(0.22_0.01_280)] text-[oklch(0.66_0.015_280)] hover:text-white'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{t}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Metadata Card */}
        {targetFile && (
          <div className="p-3 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/80%)] space-y-2 font-mono text-xs">
            <div className="text-[10px] text-[oklch(0.55_0.01_280)] uppercase font-semibold">
              Media Envelope
            </div>
            <div className="text-white truncate font-bold text-[11px]">{targetFile.name}</div>
            <div className="text-[oklch(0.62_0.22_295)] text-[10px]">
              MODALITY: {selectedMediaType}
            </div>
            <div className="text-[oklch(0.72_0.17_155)] text-[10px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Read-Only Memory Sandbox</span>
            </div>
          </div>
        )}

        {/* Mandatory Authorization Gate */}
        <div className="mt-auto pt-3 border-t border-[oklch(0.22_0.01_280/60%)]">
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[oklch(0.22_0.01_280/80%)] bg-[oklch(0.08_0.005_280)] hover:border-[oklch(0.4_0.12_295/50%)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAuthorized}
              onChange={(e) => setIsAuthorized(e.target.checked)}
              className="mt-0.5 rounded border-[oklch(0.35_0.08_295)] text-[oklch(0.62_0.22_295)] bg-[oklch(0.04_0_0)] cursor-pointer"
            />
            <div className="text-[11px] text-[oklch(0.85_0.01_280)] leading-tight">
              <strong className="text-white block font-medium mb-0.5">Lawful Use:</strong>
              I possess this media lawfully and authorize defensive forensic review.
            </div>
          </label>
        </div>
      </aside>

      {/* CENTER FLUID TABS */}
      <main className="flex-1 flex flex-col p-5 overflow-y-auto space-y-5">
        {/* Tab Headers & Run Button */}
        <div className="flex items-center justify-between pb-3 border-b border-[oklch(0.22_0.01_280/60%)]">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)]">
            <button
              onClick={() => setActiveTab('overview')}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-colors',
                activeTab === 'overview' ? 'bg-[oklch(0.62_0.22_295)] text-white' : 'text-[oklch(0.66_0.015_280)] hover:text-white'
              )}
            >
              Overview &amp; Verdict
            </button>
            <button
              onClick={() => setActiveTab('frames')}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-colors',
                activeTab === 'frames' ? 'bg-[oklch(0.62_0.22_295)] text-white' : 'text-[oklch(0.66_0.015_280)] hover:text-white'
              )}
            >
              Frames &amp; Heatmaps
            </button>
            <button
              onClick={() => setActiveTab('signals')}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-colors',
                activeTab === 'signals' ? 'bg-[oklch(0.62_0.22_295)] text-white' : 'text-[oklch(0.66_0.015_280)] hover:text-white'
              )}
            >
              Signal Matrix
            </button>
            <button
              onClick={() => setActiveTab('provenance')}
              className={clsx(
                'px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer transition-colors',
                activeTab === 'provenance' ? 'bg-[oklch(0.62_0.22_295)] text-white' : 'text-[oklch(0.66_0.015_280)] hover:text-white'
              )}
            >
              C2PA Provenance
            </button>
          </div>

          <button
            disabled={!targetFile || !isAuthorized || isAnalyzing}
            onClick={handleRunAnalysis}
            className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>{isAnalyzing ? 'Extracting Signals...' : 'Analyze Authenticity'}</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {!result ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-[oklch(0.22_0.01_280)] bg-[oklch(0.04_0_0)] text-xs text-[oklch(0.55_0.01_280)]">
                Drop media on the left and click &quot;Analyze Authenticity&quot; to compute calibrated evidence.
              </div>
            ) : (
              <>
                {/* Main Verdict Card with Calibration and Uncertainty Band */}
                <VerdictCard
                  verdict={result.verdict}
                  score={result.calibratedScore}
                  uncertaintyBand={result.uncertaintyBand}
                  firedSignalsCount={result.signals.filter((s) => s.verdict === 'FAIL').length}
                  totalSignalsCount={result.signals.length}
                  provenanceStatus={result.provenance.status}
                  disclaimer={result.disclaimer}
                />

                {/* Counter-Evidence Panel (Mandatory Section 2.7) */}
                <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase text-[11px]">
                      Counter-Evidence &amp; Benign Alternative Hypotheses
                    </span>
                    <span className="text-[10px] text-[oklch(0.78_0.15_85)]">
                      Non-Malicious Explanations
                    </span>
                  </div>

                  <div className="space-y-2">
                    {result.counterEvidence.map((ce, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-1"
                      >
                        <div className="flex items-center justify-between text-white font-semibold">
                          <span>{ce.explanation}</span>
                          <span
                            className={clsx(
                              'text-[10px] px-2 py-0.5 rounded font-bold',
                              ce.likelihood === 'HIGH'
                                ? 'bg-[oklch(0.78_0.15_85/20%)] text-[oklch(0.78_0.15_85)]'
                                : 'bg-[oklch(0.11_0.008_280)] text-[oklch(0.66_0.015_280)]'
                            )}
                          >
                            {ce.likelihood} PLAUSIBILITY
                          </span>
                        </div>
                        <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-sans leading-normal">
                          {ce.plausibilityReason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: FRAMES & HEATMAPS */}
        {activeTab === 'frames' && result && (
          <div className="space-y-4">
            <div className="relative aspect-video rounded-2xl bg-black border border-[oklch(0.22_0.01_280)] flex items-center justify-center overflow-hidden">
              <div className="text-center text-xs text-[oklch(0.55_0.01_280)] font-mono">
                [ MEDIA PREVIEW: {result.filename} &bull; FRAME #{activeFrameIndex} ]
              </div>

              {/* Heatmap Overlay Aligned at All Sizes */}
              <HeatmapOverlay
                frame={result.timeline[activeFrameIndex]}
                showHeatmap={true}
              />
            </div>

            <FrameScrubber
              timeline={result.timeline}
              activeFrameIndex={activeFrameIndex}
              onSelectFrame={setActiveFrameIndex}
            />
          </div>
        )}

        {/* TAB 3: SIGNAL MATRIX */}
        {activeTab === 'signals' && result && (
          <div className="glass rounded-xl border border-[oklch(0.22_0.01_280/80%)] overflow-hidden">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-[oklch(0.04_0_0)] border-b border-[oklch(0.22_0.01_280/60%)] text-[10px] text-[oklch(0.55_0.01_280)]">
                <tr>
                  <th className="py-2.5 px-3">Signal Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[oklch(0.18_0.01_280/50%)] text-[11px]">
                {result.signals.map((sig) => (
                  <tr key={sig.id} className="hover:bg-[oklch(0.08_0.005_280)]">
                    <td className="py-2.5 px-3 font-semibold text-white">{sig.name}</td>
                    <td className="py-2.5 px-3 text-[oklch(0.66_0.015_280)]">{sig.category}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded text-[10px] font-bold',
                          sig.verdict === 'PASS'
                            ? 'bg-[oklch(0.72_0.17_155/15%)] text-[oklch(0.72_0.17_155)]'
                            : sig.verdict === 'FAIL'
                            ? 'bg-[oklch(0.63_0.2_25/15%)] text-[oklch(0.63_0.2_25)]'
                            : 'bg-[oklch(0.78_0.15_85/15%)] text-[oklch(0.78_0.15_85)]'
                        )}
                      >
                        {sig.verdict}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[oklch(0.62_0.22_295)] font-bold">{sig.score}</td>
                    <td className="py-2.5 px-3 text-[oklch(0.75_0.01_280)] max-w-sm truncate" title={sig.explanation}>
                      {sig.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: C2PA PROVENANCE */}
        {activeTab === 'provenance' && result && (
          <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[oklch(0.22_0.01_280/60%)]">
              <span className="font-bold text-white text-sm">C2PA PROVENANCE CHAIN</span>
              <span className="text-[oklch(0.62_0.22_295)] font-semibold">
                Status: {result.provenance.status}
              </span>
            </div>

            <div className="space-y-2 text-[oklch(0.85_0.01_280)]">
              <div>
                Issuer Identity: <strong className="text-white">{result.provenance.issuerIdentity || 'None detected'}</strong>
              </div>
              <div>
                Claim Generator: <strong className="text-white">{result.provenance.claimGenerator || 'None'}</strong>
              </div>
              <div>
                Signature Valid: <strong className={result.provenance.signatureValid ? 'text-[oklch(0.72_0.17_155)]' : 'text-[oklch(0.55_0.01_280)]'}>
                  {result.provenance.signatureValid ? 'YES' : 'NO / STRIPPED'}
                </strong>
              </div>
              <div>
                Cryptographic Assertions Count: <strong className="text-white">{result.provenance.assertionsCount}</strong>
              </div>
            </div>

            <p className="text-[11px] text-[oklch(0.55_0.01_280)] font-sans italic pt-2">
              Note: A cryptographically verified C2PA manifest certifies the chain of custody and signing hardware, but does not certify the objective truthfulness of depicted real-world events.
            </p>
          </div>
        )}
      </main>

      {/* RIGHT RAIL (360px Terminal & Decision Resolution Card) */}
      <aside className="w-full lg:w-[360px] shrink-0 p-4 border-l border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/50%)] flex flex-col gap-4">
        <div className="font-mono text-[10px] font-semibold text-[oklch(0.62_0.22_295)] uppercase tracking-wider">
          Forensic Execution Terminal
        </div>
        <Terminal logs={logs} className="h-[360px]" onClear={() => setLogs([])} />

        {/* What would change this verdict card */}
        <div className="p-3.5 rounded-xl glass border border-[oklch(0.22_0.01_280)] space-y-2 font-mono text-xs">
          <div className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
            <span>Highest-Value Extra Tests</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-[oklch(0.75_0.01_280)] font-sans">
            <li>&bull; Supply reference camera raw capture to calibrate PRNU sensor noise.</li>
            <li>&bull; Ingest uncompressed audio wav file to resolve neural vocoder cliff.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};
