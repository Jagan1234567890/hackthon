'use client';

import React, { useState } from 'react';
import { Navbar, AppSurface } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { BentoGrid } from '@/components/landing/BentoGrid';
import { Marquee } from '@/components/ui/Marquee';
import { MethodologyLadder } from '@/components/landing/MethodologyLadder';
import { EthicsPanel } from '@/components/landing/EthicsPanel';
import { FaqPricing } from '@/components/landing/FaqPricing';
import { Footer } from '@/components/landing/Footer';
import { SpotlightCanvas } from '@/components/ui/SpotlightCanvas';
import { AuthenticityConsole } from '@/components/screens/AuthenticityConsole';
import { VaultConsole } from '@/components/screens/VaultConsole';
import { RecoveryConsole } from '@/components/screens/RecoveryConsole';
import { LedgerConsole } from '@/components/screens/LedgerConsole';
import { SettingsConsole } from '@/components/screens/SettingsConsole';
import { KeyholeSettings, DEFAULT_SETTINGS } from '@/types/settings';
import { Shield, Lock, Wrench, Database } from 'lucide-react';

export default function KeyholeApp() {
  const [currentSurface, setCurrentSurface] = useState<AppSurface>('landing');
  const [settings, setSettings] = useState<KeyholeSettings>(DEFAULT_SETTINGS);

  return (
    <div className="min-h-screen bg-[oklch(0.02_0_0)] text-white relative font-sans flex flex-col selection:bg-[oklch(0.62_0.22_295/30%)] selection:text-white">
      {/* Kinetic Background & Cursor Spotlight */}
      <SpotlightCanvas />

      {/* Global Glass Nav */}
      <Navbar
        currentSurface={currentSurface}
        onNavigate={setCurrentSurface}
      />

      {/* 1. LANDING PAGE */}
      {currentSurface === 'landing' && (
        <div className="flex-1 flex flex-col">
          <main className="flex-1">
            <Hero
              onStartRecovery={() => setCurrentSurface('authenticity')}
              onReadMethod={() => {
                const el = document.getElementById('ladder-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Quick Surface Launch Pad */}
            <section className="py-8 px-4 max-w-5xl mx-auto w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setCurrentSurface('authenticity')}
                  className="glass p-4 rounded-xl border border-[oklch(0.22_0.01_280)] hover:border-[oklch(0.62_0.22_295)] text-left space-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Shield className="w-3.5 h-3.5 text-[oklch(0.72_0.17_155)]" />
                    <span>Half 1: Authenticity</span>
                  </div>
                  <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-sans">
                    C2PA provenance, FFT artifacts, blink coherence, audio seams.
                  </p>
                </button>

                <button
                  onClick={() => setCurrentSurface('vault')}
                  className="glass p-4 rounded-xl border border-[oklch(0.22_0.01_280)] hover:border-[oklch(0.62_0.22_295)] text-left space-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Lock className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
                    <span>Half 2: Vault Seal</span>
                  </div>
                  <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-sans">
                    AES-256-GCM streaming container with Argon2id hardness.
                  </p>
                </button>

                <button
                  onClick={() => setCurrentSurface('recovery')}
                  className="glass p-4 rounded-xl border border-[oklch(0.22_0.01_280)] hover:border-[oklch(0.62_0.22_295)] text-left space-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Wrench className="w-3.5 h-3.5 text-[oklch(0.78_0.15_85)]" />
                    <span>Recovery Ladder</span>
                  </div>
                  <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-sans">
                    Stages 0-6 cheapest-first triage for lost personal passphrases.
                  </p>
                </button>

                <button
                  onClick={() => setCurrentSurface('ledger')}
                  className="glass p-4 rounded-xl border border-[oklch(0.22_0.01_280)] hover:border-[oklch(0.62_0.22_295)] text-left space-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Database className="w-3.5 h-3.5 text-[oklch(0.75_0.14_210)]" />
                    <span>Case Ledger</span>
                  </div>
                  <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-sans">
                    Immutable SHA-256 Merkle chain linking every case report.
                  </p>
                </button>
              </div>
            </section>

            <div id="formats-section">
              <Marquee />
            </div>

            <BentoGrid />

            <div id="ladder-section">
              <MethodologyLadder />
            </div>

            <div id="ethics-section">
              <EthicsPanel />
            </div>

            <div id="faq-section">
              <FaqPricing onSelectTier={() => setCurrentSurface('authenticity')} />
            </div>
          </main>

          <Footer />
        </div>
      )}

      {/* 2. AUTHENTICITY CONSOLE */}
      {currentSurface === 'authenticity' && (
        <div className="flex-1 flex flex-col pt-16 h-screen overflow-hidden">
          <AuthenticityConsole settings={settings} />
        </div>
      )}

      {/* 3. VAULT CONSOLE */}
      {currentSurface === 'vault' && (
        <div className="flex-1 flex flex-col pt-16 h-screen overflow-hidden">
          <VaultConsole settings={settings} />
        </div>
      )}

      {/* 4. RECOVERY CONSOLE */}
      {currentSurface === 'recovery' && (
        <div className="flex-1 flex flex-col pt-16 h-screen overflow-hidden">
          <RecoveryConsole />
        </div>
      )}

      {/* 5. LEDGER CONSOLE */}
      {currentSurface === 'ledger' && (
        <div className="flex-1 flex flex-col pt-16 h-screen overflow-hidden">
          <LedgerConsole />
        </div>
      )}

      {/* 6. SETTINGS CONSOLE */}
      {currentSurface === 'settings' && (
        <div className="flex-1 flex flex-col pt-16 h-screen overflow-hidden">
          <SettingsConsole
            settings={settings}
            onUpdateSettings={setSettings}
          />
        </div>
      )}
    </div>
  );
}
