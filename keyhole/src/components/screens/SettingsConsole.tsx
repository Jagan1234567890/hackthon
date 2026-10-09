'use client';

import { KeyholeSettings } from '@/types/settings';
import { Sliders, Cpu, Shield, Database } from 'lucide-react';
import { clsx } from 'clsx';

interface SettingsConsoleProps {
  settings: KeyholeSettings;
  onUpdateSettings: (settings: KeyholeSettings) => void;
  className?: string;
}

export const SettingsConsole: React.FC<SettingsConsoleProps> = ({
  settings,
  onUpdateSettings,
  className,
}) => {
  const toggleModel = (modelId: string) => {
    const updatedModels = settings.models.map((m) =>
      m.id === modelId ? { ...m, enabled: !m.enabled } : m
    );
    onUpdateSettings({ ...settings, models: updatedModels });
  };

  return (
    <div className={clsx('flex-1 p-6 overflow-y-auto space-y-6 max-w-5xl mx-auto w-full font-mono text-xs', className)}>
      <div className="flex items-center justify-between pb-4 border-b border-[oklch(0.22_0.01_280/60%)]">
        <div>
          <h2 className="font-sans font-bold text-lg text-white">
            Forensic &amp; Hardware Engine Settings
          </h2>
          <p className="text-xs text-[oklch(0.66_0.015_280)] font-sans mt-0.5">
            Calibrate false-positive operating bands, neural weights verification, memory limits, and privacy redaction filters.
          </p>
        </div>
      </div>

      {/* 1. OPERATING THRESHOLD SLIDERS (Section 2.7 & 1.6) */}
      <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Sliders className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
          <span>Operational Calibration Sliders</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[oklch(0.66_0.015_280)]">False-Positive Tolerance (Strictness):</span>
              <span className="text-[oklch(0.62_0.22_295)] font-bold">{(settings.falsePositiveTolerance * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.20"
              step="0.01"
              value={settings.falsePositiveTolerance}
              onChange={(e) =>
                onUpdateSettings({ ...settings, falsePositiveTolerance: parseFloat(e.target.value) })
              }
              className="w-full accent-[oklch(0.62_0.22_295)] cursor-pointer"
            />
            <p className="text-[10px] text-[oklch(0.55_0.01_280)] font-sans">
              Lower tolerance tightens authentic threshold, requiring stronger certainty before declaring authentic-consistent.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[oklch(0.66_0.015_280)]">False-Negative Tolerance (Sensitivity):</span>
              <span className="text-[oklch(0.62_0.22_295)] font-bold">{(settings.falseNegativeTolerance * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.20"
              step="0.01"
              value={settings.falseNegativeTolerance}
              onChange={(e) =>
                onUpdateSettings({ ...settings, falseNegativeTolerance: parseFloat(e.target.value) })
              }
              className="w-full accent-[oklch(0.62_0.22_295)] cursor-pointer"
            />
            <p className="text-[10px] text-[oklch(0.55_0.01_280)] font-sans">
              Lower tolerance increases sensitivity to subtle manipulation artifacts before falling back to inconclusive.
            </p>
          </div>
        </div>
      </div>

      {/* 2. MODEL REGISTRY TABLE (Section 2.6 & 8.3) */}
      <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Database className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
            <span>Open-Weight Model Registry (ONNX Runtime Web / Local Worker)</span>
          </div>
          <span className="text-[10px] text-[oklch(0.72_0.17_155)] font-semibold">
            PINNED SHA-256 VERIFIED
          </span>
        </div>

        <div className="rounded-lg border border-[oklch(0.22_0.01_280/60%)] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[oklch(0.04_0_0)] text-[10px] text-[oklch(0.55_0.01_280)] border-b border-[oklch(0.22_0.01_280/50%)]">
              <tr>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Model Name &amp; Family</th>
                <th className="py-2 px-3">Version</th>
                <th className="py-2 px-3">Checksum</th>
                <th className="py-2 px-3">VRAM</th>
                <th className="py-2 px-3">Published EER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[oklch(0.18_0.01_280/40%)] text-[11px]">
              {settings.models.map((m) => (
                <tr key={m.id} className="hover:bg-[oklch(0.08_0.005_280)]">
                  <td className="py-2 px-3">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={() => toggleModel(m.id)}
                      className="accent-[oklch(0.62_0.22_295)] cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-3 font-semibold text-white">{m.name}</td>
                  <td className="py-2 px-3 text-[oklch(0.66_0.015_280)]">{m.version}</td>
                  <td className="py-2 px-3 text-[oklch(0.62_0.22_295)] font-mono">{m.weightsHash.slice(0, 16)}...</td>
                  <td className="py-2 px-3 text-[oklch(0.85_0.01_280)]">{m.vramUsageMB} MB</td>
                  <td className="py-2 px-3 text-[oklch(0.72_0.17_155)] font-bold">{m.eerPublished}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. HARDWARE & MEMORY BUDGET */}
      <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Cpu className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
          <span>Hardware &amp; Execution Budget</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-1">
            <span className="text-[oklch(0.55_0.01_280)] text-[10px] block">Max VRAM Allocation:</span>
            <span className="text-white font-bold text-sm">{settings.maxVramBudgetMB} MB</span>
          </div>
          <div className="p-3 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-1">
            <span className="text-[oklch(0.55_0.01_280)] text-[10px] block">CPU Worker Concurrency:</span>
            <span className="text-white font-bold text-sm">{settings.maxCpuWorkers} Parallel Threads</span>
          </div>
          <div className="p-3 rounded-lg bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-1">
            <span className="text-[oklch(0.55_0.01_280)] text-[10px] block">Network Egress Policy:</span>
            <span className="text-[oklch(0.72_0.17_155)] font-bold text-sm">AIR-GAPPED (Connect-Src: &apos;self&apos;)</span>
          </div>
        </div>
      </div>

      {/* 4. PRIVACY REDACTION RULES */}
      <div className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/80%)] space-y-3">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <Shield className="w-4 h-4 text-[oklch(0.72_0.17_155)]" />
          <span>Case Report Redaction Options</span>
        </div>
        <p className="text-xs text-[oklch(0.66_0.015_280)] font-sans">
          Select fields automatically stripped from exported JSON and PDF-style case reports:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <label className="flex items-center gap-2 text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.redaction.stripOriginalFilepaths}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  redaction: { ...settings.redaction, stripOriginalFilepaths: e.target.checked },
                })
              }
              className="accent-[oklch(0.62_0.22_295)]"
            />
            <span>Strip original absolute filesystem paths</span>
          </label>

          <label className="flex items-center gap-2 text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.redaction.stripRawHashes}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  redaction: { ...settings.redaction, stripRawHashes: e.target.checked },
                })
              }
              className="accent-[oklch(0.62_0.22_295)]"
            />
            <span>Mask raw target SHA-256 hashes</span>
          </label>

          <label className="flex items-center gap-2 text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.redaction.stripHostDeviceName}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  redaction: { ...settings.redaction, stripHostDeviceName: e.target.checked },
                })
              }
              className="accent-[oklch(0.62_0.22_295)]"
            />
            <span>Redact host device hostname and GPU serials</span>
          </label>

          <label className="flex items-center gap-2 text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.redaction.stripUsernames}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  redaction: { ...settings.redaction, stripUsernames: e.target.checked },
                })
              }
              className="accent-[oklch(0.62_0.22_295)]"
            />
            <span>Redact OS usernames from EXIF / file metadata</span>
          </label>
        </div>
      </div>
    </div>
  );
};
