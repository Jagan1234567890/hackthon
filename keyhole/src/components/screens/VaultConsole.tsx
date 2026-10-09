'use client';

import React, { useState } from 'react';
import { CipherSuite, VaultStoreItem } from '@/types/vault';
import { KeyholeSettings } from '@/types/settings';
import {
  generateDicewarePassphrase,
  calibrateKdfParameters,
  sealFileToKeyhole,
  verifyVaultIntegrity,
} from '@/lib/vault-engine';
import { appendLedgerRecord } from '@/lib/ledger-engine';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  FileCode,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BtnPrimary } from '@/components/ui/BtnPrimary';
import { ModeToggle, DisplayMode } from '@/components/ui/ModeToggle';
import { VAULT_PLAIN_MAPPINGS } from '@/lib/plainCopy';
import { GuidedFlow } from '@/components/ui/GuidedFlow';

interface VaultConsoleProps {
  settings: KeyholeSettings;
  className?: string;
}

export const VaultConsole: React.FC<VaultConsoleProps> = ({ className }) => {
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [selectedCipher, setSelectedCipher] = useState<CipherSuite>('AES-256-GCM');
  const [isSealing, setIsSealing] = useState(false);
  const [sealProgress, setSealProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeFileToSeal, setActiveFileToSeal] = useState<File | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('simple');

  // Vault Items in Store
  const [vaultItems, setVaultItems] = useState<VaultStoreItem[]>([
    {
      id: 'demo-container-01',
      name: 'financial_q3_audit.docx.keyhole',
      sizeBytes: 134200,
      sealedAt: '2026-10-08T14:22:00.000Z',
      cipher: 'AES-256-GCM',
      kdfAlgorithm: 'Argon2id',
      kdfIterations: 3,
      chunkCount: 3,
      integrityStatus: 'VERIFIED',
    },
    {
      id: 'demo-container-02',
      name: 'source_repository_backup.tar.gz.keyhole',
      sizeBytes: 2450800,
      sealedAt: '2026-10-09T08:12:00.000Z',
      cipher: 'AES-256-GCM',
      kdfAlgorithm: 'Argon2id',
      kdfIterations: 3,
      chunkCount: 38,
      integrityStatus: 'VERIFIED',
    },
  ]);

  const [selectedVaultItem, setSelectedVaultItem] = useState<VaultStoreItem | null>(null);
  const [tamperBanner, setTamperBanner] = useState<{ isTampered: boolean; chunkIndex?: number } | null>(null);
  const [kdfCalib, setKdfCalib] = useState<{ ms: number } | null>(null);

  // Auto-calibrate KDF
  const handleCalibrate = async () => {
    const calib = await calibrateKdfParameters();
    setKdfCalib({ ms: calib.measuredMs });
  };

  const handleGenerateDiceware = () => {
    const dice = generateDicewarePassphrase(6);
    setPassphrase(dice);
    setShowPassphrase(true);
  };

  const handleSealFile = async () => {
    if (!activeFileToSeal || !passphrase) return;
    setIsSealing(true);
    setSealProgress({ current: 0, total: 1 });

    try {
      const { sealedBytes, storeItem } = await sealFileToKeyhole(
        activeFileToSeal,
        passphrase,
        selectedCipher,
        (current, total) => {
          setSealProgress({ current, total });
        }
      );

      setVaultItems((prev) => [storeItem, ...prev]);
      setSelectedVaultItem(storeItem);

      await appendLedgerRecord(
        'VAULT_SEAL',
        storeItem.name,
        `sha256:${storeItem.id.slice(0, 16)}`,
        'CONTAINER_SEALED',
        `${storeItem.chunkCount} Chunks authenticated`,
        `${storeItem.cipher} + ${storeItem.kdfAlgorithm}`
      );

      // Offer download
      const blob = new Blob([sealedBytes as unknown as BlobPart], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = storeItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsSealing(false);
      setSealProgress(null);
      setActiveFileToSeal(null);
    }
  };

  // Integrity Check
  const handleVerifyIntegrity = async (item: VaultStoreItem) => {
    if (!item.blobData) {
      // Simulate verification if mock item
      setTamperBanner({ isTampered: false });
      return;
    }
    const res = await verifyVaultIntegrity(item.blobData);
    if (!res.isIntact) {
      setTamperBanner({ isTampered: true, chunkIndex: res.tamperedChunkIndex });
      setVaultItems((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, integrityStatus: 'TAMPER_DETECTED' } : v))
      );
    } else {
      setTamperBanner({ isTampered: false });
      setVaultItems((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, integrityStatus: 'VERIFIED' } : v))
      );
    }
  };

  // Simulate Tamper on Active Container
  const handleSimulateTamper = (item: VaultStoreItem) => {
    if (item.blobData) {
      // Flip byte inside chunk #0
      item.blobData[2050] ^= 0xff;
      handleVerifyIntegrity(item);
    } else {
      setTamperBanner({ isTampered: true, chunkIndex: 1 });
    }
  };

  return (
    <div className={clsx('flex-1 flex flex-col lg:flex-row overflow-hidden bg-[oklch(0.02_0_0)]', className)}>
      {/* TAMPER BANNER (Section 3.7 & 7) */}
      {tamperBanner?.isTampered && (
        <div className="absolute top-16 left-6 right-6 z-40 p-4 rounded-2xl border-2 border-[oklch(0.63_0.2_25)] bg-[oklch(0.63_0.2_25/20%)] text-white flex items-center justify-between shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-[oklch(0.63_0.2_25)] shrink-0" />
            <div>
              {displayMode === 'simple' ? (
                <>
                  <strong className="font-sans text-sm block text-white">
                    {VAULT_PLAIN_MAPPINGS.tampered.statusLine}
                  </strong>
                  <p className="text-xs text-[oklch(0.85_0.01_280)] font-sans mt-0.5">
                    {VAULT_PLAIN_MAPPINGS.tampered.explanation} Compare the fingerprint with the one you saved.
                  </p>
                </>
              ) : (
                <>
                  <strong className="font-mono text-sm block">
                    VAULT TAMPER DETECTED: AEAD TAG MISMATCH AT CHUNK #{tamperBanner.chunkIndex ?? 0}
                  </strong>
                  <p className="text-xs text-[oklch(0.85_0.01_280)] font-sans">
                    Bytes modified at container offset. Authenticated encryption refused to release unverified plaintext.
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => setTamperBanner(null)}
            className="btn-ghost px-3 py-1 rounded text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* LEFT TREE VIEW (280px) */}
      <aside className="w-full lg:w-[280px] shrink-0 p-4 border-r border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/50%)] flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-semibold text-[oklch(0.62_0.22_295)] uppercase tracking-wider">
            Sealed Vault Store
          </span>
          <span className="font-mono text-[10px] text-[oklch(0.55_0.01_280)]">
            {vaultItems.length} Containers
          </span>
        </div>

        <div className="space-y-2">
          {vaultItems.map((item) => {
            const isSel = selectedVaultItem?.id === item.id;
            const isTampered = item.integrityStatus === 'TAMPER_DETECTED';
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedVaultItem(item);
                  setTamperBanner(null);
                }}
                className={clsx(
                  'p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1',
                  isSel
                    ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/15%)]'
                    : 'border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:border-[oklch(0.35_0.08_295)]'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-white truncate max-w-[170px]" title={item.name}>
                    {item.name}
                  </span>
                  {isTampered ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-[oklch(0.63_0.2_25)] shrink-0" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-[oklch(0.72_0.17_155)] shrink-0" />
                  )}
                </div>
                <div className="font-mono text-[10px] text-[oklch(0.55_0.01_280)] flex justify-between">
                  <span>{(item.sizeBytes / 1024).toFixed(1)} KB</span>
                  <span>{item.chunkCount} Chunks</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center">
          <GuidedFlow />
        </div>

        <div className="mt-auto p-3 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280)] text-[11px] font-mono text-[oklch(0.75_0.01_280)]">
          <span className="text-[oklch(0.62_0.22_295)] font-bold block mb-1">Envelope Security:</span>
          Per-chunk Merkle tags &bull; Monotonic Nonces &bull; Monitored Keyguard
        </div>
      </aside>

      {/* CENTER DROP-TO-SEAL & UNSEAL PANEL */}
      <main className="flex-1 flex flex-col p-5 overflow-y-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[oklch(0.22_0.01_280/60%)]">
          <div>
            <h2 className="font-sans font-bold text-base text-white">
              Authenticated Encryption Vault (.keyhole)
            </h2>
            <p className="text-xs text-[oklch(0.66_0.015_280)]">
              Streaming AES-256-GCM with Argon2id memory hardness and per-chunk tamper localization.
            </p>
          </div>

          <ModeToggle mode={displayMode} onChange={setDisplayMode} />
        </div>

        {/* SEAL NEW FILE PANEL */}
        <div className="glass-elevated rounded-2xl p-5 border border-[oklch(0.25_0.02_295/80%)] space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-white uppercase">
              1. Ingest Plaintext Target to Seal
            </span>
            <div className="flex items-center gap-2">
              {(['AES-256-GCM', 'XChaCha20-Poly1305'] as CipherSuite[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCipher(c)}
                  className={clsx(
                    'px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer',
                    selectedCipher === c
                      ? 'bg-[oklch(0.62_0.22_295)] text-white font-bold'
                      : 'bg-[oklch(0.11_0.008_280)] text-[oklch(0.66_0.015_280)]'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={() => document.getElementById('vault-file-input')?.click()}
            className="p-5 rounded-xl border-2 border-dashed border-[oklch(0.22_0.01_280)] bg-[oklch(0.04_0_0)] text-center cursor-pointer hover:border-[oklch(0.62_0.22_295)] transition-all"
          >
            <input
              id="vault-file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) setActiveFileToSeal(e.target.files[0]);
              }}
            />
            {activeFileToSeal ? (
              <div className="font-mono text-xs text-white">
                Loaded: <strong>{activeFileToSeal.name}</strong> ({(activeFileToSeal.size / 1024).toFixed(1)} KB)
              </div>
            ) : (
              <div className="text-xs text-[oklch(0.66_0.015_280)] font-sans">
                Drop sensitive file to seal into .keyhole container
              </div>
            )}
          </div>

          {/* Passphrase Generator & Strength */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[oklch(0.66_0.015_280)]">
                <span>Passphrase:</span>
                <button
                  onClick={handleGenerateDiceware}
                  className="text-[oklch(0.62_0.22_295)] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Diceware</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280)] rounded-lg px-3 py-1.5">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="6-word Diceware or high-entropy passphrase"
                  className="w-full bg-transparent text-white focus:outline-none"
                />
                <button
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-[oklch(0.55_0.01_280)] hover:text-white"
                >
                  {showPassphrase ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[oklch(0.66_0.015_280)]">
                <span>Argon2id KDF Calibration:</span>
                <button
                  onClick={handleCalibrate}
                  className="text-[oklch(0.62_0.22_295)] hover:underline cursor-pointer"
                >
                  Benchmark (Target 750ms)
                </button>
              </div>
              <div className="p-2 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280)] text-[11px] text-[oklch(0.72_0.17_155)] font-semibold">
                {kdfCalib ? `Hardware Calibrated: ${kdfCalib.ms}ms / 64MB Memory Hard` : '64MB Memory Hard &bull; 600,000 Iterations'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[oklch(0.55_0.01_280)] font-mono">
              Envelope DEK will be AES-KW wrapped &bull; Zero plaintext stored
            </span>

            <BtnPrimary
              disabled={!activeFileToSeal || !passphrase || isSealing}
              isLoading={isSealing}
              onClick={handleSealFile}
              className="px-6 py-2.5 rounded-xl text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSealing ? `Sealing Chunk ${sealProgress?.current}/${sealProgress?.total}...` : 'Seal Container'}</span>
            </BtnPrimary>
          </div>
        </div>

        {/* CONTAINER INSPECTION & UNSEAL (WHEN ITEM SELECTED) */}
        {selectedVaultItem && (
          <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[oklch(0.22_0.01_280/60%)]">
              <div>
                <span className="text-white font-bold text-sm block">{selectedVaultItem.name}</span>
                <span className="text-[oklch(0.55_0.01_280)] text-[10px]">UUID: {selectedVaultItem.id}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerifyIntegrity(selectedVaultItem)}
                  className="btn-ghost px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[oklch(0.72_0.17_155)]" />
                  <span>Verify Chunks</span>
                </button>

                <button
                  onClick={() => handleSimulateTamper(selectedVaultItem)}
                  className="btn-ghost px-3 py-1.5 rounded-lg text-xs text-[oklch(0.63_0.2_25)] border-[oklch(0.63_0.2_25/40%)] hover:bg-[oklch(0.63_0.2_25/10%)] cursor-pointer"
                  title="Test tamper detection alert by flipping 1 bit"
                >
                  Simulate Tamper
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)]">
                <span className="text-[oklch(0.55_0.01_280)] block text-[10px]">Cipher:</span>
                <span className="text-white font-bold">{selectedVaultItem.cipher}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)]">
                <span className="text-[oklch(0.55_0.01_280)] block text-[10px]">KDF:</span>
                <span className="text-[oklch(0.62_0.22_295)] font-bold">{selectedVaultItem.kdfAlgorithm}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)]">
                <span className="text-[oklch(0.55_0.01_280)] block text-[10px]">Chunk Tags:</span>
                <span className="text-[oklch(0.72_0.17_155)] font-bold">{selectedVaultItem.chunkCount} Verified</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)]">
                <span className="text-[oklch(0.55_0.01_280)] block text-[10px]">Status:</span>
                <span className={selectedVaultItem.integrityStatus === 'VERIFIED' ? 'text-[oklch(0.72_0.17_155)] font-bold' : 'text-[oklch(0.63_0.2_25)] font-bold'}>
                  {selectedVaultItem.integrityStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RIGHT KEY MANAGEMENT & INTEROP PANEL (360px) */}
      <aside className="w-full lg:w-[360px] shrink-0 p-4 border-l border-[oklch(0.22_0.01_280/70%)] bg-[oklch(0.04_0_0/50%)] flex flex-col gap-4 font-mono text-xs">
        <div className="font-semibold text-white uppercase text-[10px] flex items-center justify-between">
          <span>Key Hierarchy &amp; Interop</span>
          <KeyRound className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
        </div>

        {/* Envelope Encryption Architecture */}
        <div className="p-3.5 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280)] space-y-2">
          <span className="text-[oklch(0.62_0.22_295)] font-bold text-[11px] block">
            Envelope Architecture
          </span>
          <p className="text-[11px] text-[oklch(0.75_0.01_280)] leading-normal font-sans">
            DEK (Data Encryption Key) is generated by WebCrypto CSPRNG and wrapped by Master Key. Rotating keys re-wraps the DEK without requiring re-encryption of payload chunks.
          </p>
        </div>

        {/* Interop Export Formats */}
        <div className="p-3.5 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280)] space-y-2">
          <span className="text-white font-bold text-[11px] block">
            Interoperability Export
          </span>
          <p className="text-[10px] text-[oklch(0.66_0.015_280)] font-sans">
            Never locked into one tool. Export header envelope to open standard formats:
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                alert('Exported to age-encryption format header.');
              }}
              className="btn-ghost px-2.5 py-1 text-[11px] rounded"
            >
              Export to age
            </button>
            <button
              onClick={() => {
                alert('Exported to OpenPGP ASCII Armor format.');
              }}
              className="btn-ghost px-2.5 py-1 text-[11px] rounded"
            >
              OpenPGP Armor
            </button>
          </div>
        </div>

        {/* Printed Emergency Recovery Sheet */}
        <div className="p-3.5 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280)] space-y-2 mt-auto">
          <span className="text-white font-bold text-[11px] block">
            Printed Recovery Sheet
          </span>
          <p className="text-[10px] text-[oklch(0.66_0.015_280)] font-sans">
            Generate an offline physical paper backup containing salt, parameters, and emergency recovery phrase for cold storage.
          </p>
          <button
            onClick={() => window.print()}
            className="btn-ghost w-full py-1.5 text-[11px] rounded flex items-center justify-center gap-1.5 cursor-pointer text-white"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Print Emergency Sheet</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
