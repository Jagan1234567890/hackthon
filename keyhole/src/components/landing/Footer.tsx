'use client';

import React, { useState } from 'react';
import { KeyRound, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 600);
  };

  return (
    <footer className="border-t border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.02_0_0)] pt-16 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
        {/* Brand Column */}
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[oklch(0.62_0.22_295)] p-0.5 flex items-center justify-center shadow-[0_0_12px_oklch(0.62_0.22_295/50%)]">
              <KeyRound className="w-4 h-4 text-white" />
            </div>
            <span className="font-sans font-bold text-sm tracking-tight text-white">
              KEYHOLE
            </span>
          </div>
          <p className="text-xs text-[oklch(0.66_0.015_280)] leading-relaxed">
            Applied cryptography and digital forensics engine for authorized recovery of lost personal data and format unlocking.
          </p>
          <div className="font-mono text-[10px] text-[oklch(0.55_0.01_280)]">
            v2.4.0-forensic-release &bull; 0 Bytes Uploaded
          </div>
        </div>

        {/* Column 2: Engine Vectors */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Vectors
          </div>
          <ul className="space-y-2 text-xs text-[oklch(0.66_0.015_280)]">
            <li><a href="#formats-section" className="hover:text-white transition-colors">ZipCrypto bkcrack</a></li>
            <li><a href="#formats-section" className="hover:text-white transition-colors">VeraCrypt Header Audit</a></li>
            <li><a href="#formats-section" className="hover:text-white transition-colors">Office ECMA-376 Extractor</a></li>
            <li><a href="#formats-section" className="hover:text-white transition-colors">PDF Security Handler R=4..6</a></li>
            <li><a href="#formats-section" className="hover:text-white transition-colors">Ransomware Decryptors</a></li>
          </ul>
        </div>

        {/* Column 3: Guardrails */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Guardrails
          </div>
          <ul className="space-y-2 text-xs text-[oklch(0.66_0.015_280)]">
            <li><a href="#ethics-section" className="hover:text-white transition-colors">Authorization Gating</a></li>
            <li><a href="#ethics-section" className="hover:text-white transition-colors">Zero-Telemetry Policy</a></li>
            <li><a href="#ethics-section" className="hover:text-white transition-colors">Non-Mutation Ledger</a></li>
            <li><a href="#ethics-section" className="hover:text-white transition-colors">Refusal Taxonomy</a></li>
            <li><a href="#ladder-section" className="hover:text-white transition-colors">Cheapest-First Pipeline</a></li>
          </ul>
        </div>

        {/* Column 4: Newsletter */}
        <div className="space-y-3">
          <div className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Forensic Dispatches
          </div>
          <p className="text-xs text-[oklch(0.66_0.015_280)]">
            Monthly applied cryptanalysis updates and newly published free decryptors.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== 'idle') setStatus('idle');
                }}
                placeholder="engineer@domain.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/80%)] text-xs text-white placeholder-[oklch(0.45_0.01_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)] font-mono transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-[oklch(0.62_0.22_295)] text-white hover:bg-[oklch(0.68_0.22_295)] transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Subscribe"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            {status === 'success' && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[oklch(0.72_0.17_155)] animate-in fade-in duration-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Subscribed to Forensic Dispatches.</span>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-[oklch(0.63_0.2_25)] animate-in fade-in duration-200">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Please provide a valid email address.</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Mandatory Disclaimer & Copyright */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-[oklch(0.18_0.01_280/60%)] flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-[oklch(0.55_0.01_280)] font-sans">
        <div className="max-w-2xl leading-normal">
          <strong className="text-[oklch(0.78_0.01_280)]">Disclaimer:</strong> KEYHOLE is not a hacking tool or unauthorized cracking utility. It is designed solely for authorized forensic recovery and security auditing on systems and files you own or have explicit legal authority to inspect.
        </div>
        <div className="font-mono text-[11px] text-[oklch(0.45_0.01_280)] shrink-0">
          © 2026 KEYHOLE Cryptographic Forensics. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
