'use client';

import React from 'react';
import { PillBadge } from '@/components/ui/PillBadge';
import { TiltCard } from '@/components/ui/TiltCard';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onStartRecovery: () => void;
  onReadMethod: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartRecovery, onReadMethod }) => {
  return (
    <section className="relative pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col items-center text-center z-10">
      {/* Eyebrow Live Badge */}
      <div className="mb-6">
        <PillBadge withDot variant="primary">
          LOCAL-ONLY ENGINE &bull; NO UPLOADS
        </PillBadge>
      </div>

      {/* Hero Headline */}
      <h1 className="hero-title max-w-4xl font-bold tracking-tight mb-6">
        Get the files back.
      </h1>

      {/* Subtitle mentioning all 4 modes */}
      <p className="text-base md:text-lg text-[oklch(0.66_0.015_280)] max-w-2xl leading-relaxed mb-8">
        Desktop-class cryptographic forensics for legitimate key recovery. Audits <strong className="text-[oklch(0.985_0_0)] font-medium">Format Unlocks</strong> (PDF/ZIP/Office), reconstructs <strong className="text-[oklch(0.985_0_0)] font-medium">Lost Personal Passphrases</strong> (VeraCrypt/LUKS/GPG), triages <strong className="text-[oklch(0.985_0_0)] font-medium">Ransomware</strong>, and resolves <strong className="text-[oklch(0.985_0_0)] font-medium">Corruption vs Encryption</strong>.
      </p>

      {/* Dual CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
        <button
          onClick={onStartRecovery}
          className="btn-primary px-8 py-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shadow-2xl cursor-pointer"
        >
          <span>Start Recovery</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onReadMethod}
          className="btn-ghost px-6 py-3.5 rounded-xl text-sm font-medium text-[oklch(0.85_0.01_280)] cursor-pointer"
        >
          Read the Method
        </button>
      </div>

      {/* Live Telemetry Floating Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl w-full mb-16">
        <div className="glass rounded-xl p-3 border border-[oklch(0.22_0.01_280/60%)] flex flex-col items-center">
          <span className="font-mono text-xs font-semibold text-[oklch(0.62_0.22_295)]">&lt; 14ms</span>
          <span className="text-[11px] text-[oklch(0.55_0.01_280)] mt-0.5">Local Header Parse</span>
        </div>
        <div className="glass rounded-xl p-3 border border-[oklch(0.22_0.01_280/60%)] flex flex-col items-center">
          <span className="font-mono text-xs font-semibold text-[oklch(0.72_0.17_155)]">0 BYTES</span>
          <span className="text-[11px] text-[oklch(0.55_0.01_280)] mt-0.5">Uploaded Off-Device</span>
        </div>
        <div className="glass rounded-xl p-3 border border-[oklch(0.22_0.01_280/60%)] flex flex-col items-center">
          <span className="font-mono text-xs font-semibold text-[oklch(0.75_0.14_210)]">6-STAGE</span>
          <span className="text-[11px] text-[oklch(0.55_0.01_280)] mt-0.5">Cheapest-First Ladder</span>
        </div>
        <div className="glass rounded-xl p-3 border border-[oklch(0.22_0.01_280/60%)] flex flex-col items-center">
          <span className="font-mono text-xs font-semibold text-[oklch(0.78_0.15_85)]">100% HONEST</span>
          <span className="text-[11px] text-[oklch(0.55_0.01_280)] mt-0.5">No &quot;AI Decryption&quot;</span>
        </div>
      </div>

      {/* Interactive 3D Perspective Tilted Dashboard Mock Card */}
      <div className="w-full max-w-5xl">
        <TiltCard maxTilt={4} className="cursor-pointer" onClick={onStartRecovery}>
          <div className="glass-elevated rounded-2xl border border-[oklch(0.25_0.02_295/50%)] p-4 md:p-6 shadow-[0_20px_60px_-15px_oklch(0.62_0.22_295/20%)] text-left">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-4 border-b border-[oklch(0.22_0.01_280/50%)] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[oklch(0.63_0.2_25/80%)]" />
                <div className="w-3 h-3 rounded-full bg-[oklch(0.78_0.15_85/80%)]" />
                <div className="w-3 h-3 rounded-full bg-[oklch(0.72_0.17_155/80%)]" />
                <span className="font-mono text-xs text-[oklch(0.66_0.015_280)] ml-2">
                  KEYHOLE &bull; target_vault_backup.7z (SHA256: e8f9...4b12)
                </span>
              </div>
              <PillBadge withDot variant="success">
                RECOVERY READY
              </PillBadge>
            </div>

            {/* Mock Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Mock Rail */}
              <div className="p-4 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-3 font-mono text-xs">
                <div className="text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider text-[10px]">
                  Header Telemetry
                </div>
                <div className="text-[oklch(0.85_0.01_280)] flex justify-between">
                  <span className="text-[oklch(0.55_0.01_280)]">Format:</span> 7-Zip AES-256-CBC
                </div>
                <div className="text-[oklch(0.85_0.01_280)] flex justify-between">
                  <span className="text-[oklch(0.55_0.01_280)]">Entropy:</span> 7.9942 bits/byte
                </div>
                <div className="text-[oklch(0.85_0.01_280)] flex justify-between">
                  <span className="text-[oklch(0.55_0.01_280)]">Iterations:</span> 524,288 (SHA-256)
                </div>
                <div className="pt-2 border-t border-[oklch(0.18_0.01_280)]">
                  <span className="text-[oklch(0.72_0.17_155)] font-semibold">
                    ✓ Non-mutation proof verified
                  </span>
                </div>
              </div>

              {/* Center Mock Inspector */}
              <div className="p-4 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-2.5 font-mono text-xs">
                <div className="text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider text-[10px]">
                  Passphrase Candidates (Pass 1)
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/50%)]">
                  <span className="text-white font-semibold">Varun@2024!</span>
                  <span className="text-[oklch(0.72_0.17_155)] font-bold">88% Conf</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[oklch(0.06_0.005_280)]">
                  <span className="text-[oklch(0.75_0.01_280)]">varun123</span>
                  <span className="text-[oklch(0.66_0.015_280)]">82% Conf</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[oklch(0.06_0.005_280)]">
                  <span className="text-[oklch(0.75_0.01_280)]">V@run#2024</span>
                  <span className="text-[oklch(0.66_0.015_280)]">74% Conf</span>
                </div>
              </div>

              {/* Right Mock Output */}
              <div className="p-4 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.18_0.01_280)] space-y-2 font-mono text-xs">
                <div className="text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider text-[10px]">
                  Verdict Projection
                </div>
                <div className="text-sm font-bold text-[oklch(0.72_0.17_155)]">
                  RECOVERED (94.2% Est.)
                </div>
                <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-sans leading-normal">
                  Matching HMAC key recovered via Pass 1 rule-expanded wordlist within 18.6 seconds.
                </p>
                <div className="mt-3 text-[10px] text-[oklch(0.62_0.22_295)] font-semibold inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Click to launch interactive console
                </div>
              </div>
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
};
