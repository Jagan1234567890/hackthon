'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, Shield, Lock, Wrench, Database, Settings, ArrowUpRight } from 'lucide-react';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { clsx } from 'clsx';

export type AppSurface = 'landing' | 'authenticity' | 'vault' | 'recovery' | 'ledger' | 'settings';

interface NavbarProps {
  currentSurface: AppSurface;
  onNavigate: (surface: AppSurface) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSurface, onNavigate }) => {
  return (
    <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <nav className="glass pointer-events-auto rounded-full px-4 py-2 flex items-center justify-between gap-4 md:gap-8 border border-[oklch(0.22_0.01_280/80%)] shadow-2xl max-w-5xl w-full">
        {/* Logo Glyph */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[oklch(0.68_0.22_295)] to-[oklch(0.45_0.2_295)] p-0.5 flex items-center justify-center shadow-[0_0_14px_oklch(0.62_0.22_295/50%)] group-hover:scale-105 transition-transform">
            <KeyRound className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-xs tracking-tight text-white leading-tight">
              KEYHOLE
            </span>
            <span className="font-mono text-[8px] text-[oklch(0.62_0.22_295)] uppercase font-semibold">
              Forensics &amp; Vault
            </span>
          </div>
        </div>

        {/* Six Main Surfaces */}
        <div className="flex items-center gap-1 text-xs font-mono font-medium">
          <button
            onClick={() => onNavigate('authenticity')}
            className={clsx(
              'px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5',
              currentSurface === 'authenticity'
                ? 'bg-[oklch(0.62_0.22_295)] text-white font-bold shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Authenticity</span>
          </button>

          <button
            onClick={() => onNavigate('vault')}
            className={clsx(
              'px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5',
              currentSurface === 'vault'
                ? 'bg-[oklch(0.62_0.22_295)] text-white font-bold shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vault</span>
          </button>

          <button
            onClick={() => onNavigate('recovery')}
            className={clsx(
              'px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5',
              currentSurface === 'recovery'
                ? 'bg-[oklch(0.62_0.22_295)] text-white font-bold shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Recovery</span>
          </button>

          <button
            onClick={() => onNavigate('ledger')}
            className={clsx(
              'px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5',
              currentSurface === 'ledger'
                ? 'bg-[oklch(0.62_0.22_295)] text-white font-bold shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ledger</span>
          </button>

          <button
            onClick={() => onNavigate('settings')}
            className={clsx(
              'px-2.5 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5',
              currentSurface === 'settings'
                ? 'bg-[oklch(0.62_0.22_295)] text-white font-bold shadow-sm'
                : 'text-[oklch(0.66_0.015_280)] hover:text-white'
            )}
            title="Model Registry & Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Auth & Mode Toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono font-medium text-[oklch(0.66_0.015_280)] hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>Dashboard</span>
          </Link>

          <Link
            href="/login"
            className="px-3 py-1.5 rounded-full text-xs font-mono font-medium text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
          >
            <span>Login</span>
          </Link>

          <Link
            href="/signup"
            className="px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-[oklch(0.62_0.22_295)] hover:brightness-110 text-white transition-all shadow-sm"
          >
            <span>Sign Up</span>
          </Link>

          <ModeToggle />
        </div>
      </nav>
    </header>
  );
};
