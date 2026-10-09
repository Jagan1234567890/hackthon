'use client';

import React, { useState } from 'react';
import { PillBadge } from '@/components/ui/PillBadge';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

const FAQS = [
  {
    q: 'Can KEYHOLE decrypt any encrypted file with AI?',
    a: 'No. Sound cryptographic ciphers (such as AES-256-GCM or ChaCha20-Poly1305 with random 256-bit keys) are mathematically impossible to break by AI or brute force. KEYHOLE recovers files by targeting implementation mistakes (ZipCrypto flaws, low KDF iterations, IV reuse), leaked key residue, and human passphrase biases.',
  },
  {
    q: 'Does my file or its hash get uploaded to a cloud server?',
    a: 'Never. KEYHOLE processes headers, hashes, and candidate testing 100% locally in your browser sandbox using the WebCrypto API or through local command execution on your own machine. A persistent "0 BYTES UPLOADED" status is strictly maintained.',
  },
  {
    q: 'What is the "Cheapest-First" methodology ladder?',
    a: 'It is a 6-stage escalation sequence. Stages 0-3 check file magic bytes, Shannon entropy, shell history, and known container weaknesses within milliseconds. Only when inexpensive vectors fail does KEYHOLE allocate GPU offline cracking budgets with strict kill criteria.',
  },
  {
    q: 'How does KEYHOLE handle ransomware-encrypted files?',
    a: 'KEYHOLE identifies the ransomware family signature and queries verified public decryptor indices (No More Ransom, Emsisoft, Kaspersky). If no free decryptor exists and the cipher is sound, it honestly reports INFEASIBLE.',
  },
];

const PRICING_TIERS = [
  {
    name: 'Community / Local',
    price: '$0',
    period: 'forever',
    desc: 'Self-hosted local engine for personal recovery and format audits.',
    features: [
      '100% Client-Side WebCrypto Engine',
      'Stages 0 to 4 Triage & Candidates',
      'Format & Shannon Entropy Analyzer',
      'Native Hashcat & JtR Hash Exporter',
      'Local JSON & Text Forensic Reports',
    ],
    highlight: false,
    cta: 'Use Free Console',
  },
  {
    name: 'Forensic Lab Pro',
    price: '$49',
    period: 'per seat / mo',
    desc: 'Automated offline cracking harness, custom wordlists, and GPU orchestration.',
    features: [
      'Everything in Community',
      'Automated P1-P4 Offline Cracking Ladder',
      'Deep South-Asian & Custom Rule Engine',
      'bkcrack & msoffcrypto-tool Integration',
      'Bit-Identical Copy Non-Mutation Ledger',
      'Priority Offline Decryptor Database',
    ],
    highlight: true,
    badge: 'MOST USED',
    cta: 'Start Pro Trial',
  },
  {
    name: 'Enterprise Incident',
    price: '$299',
    period: 'per node / mo',
    desc: 'Air-gapped server deployments, multi-GPU cluster support, and compliance logging.',
    features: [
      'Everything in Forensic Lab Pro',
      'Air-gapped Appliance Image (Docker / ISO)',
      'Multi-GPU Slurm / Hashcat Cluster Support',
      'Chain-of-Custody Cryptographic Signatures',
      'Custom Enterprise Vault Handlers',
      'Dedicated Forensic Engineering Support',
    ],
    highlight: false,
    cta: 'Contact Enterprise',
  },
];

export const FaqPricing: React.FC<{ onSelectTier?: () => void }> = ({ onSelectTier }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      {/* FAQ Accordion */}
      <div className="max-w-4xl mx-auto mb-28">
        <div className="text-center mb-12">
          <div className="font-mono text-xs text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider mb-2">
            Questions &amp; Transparency
          </div>
          <h2 className="h2-title font-bold mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-[oklch(0.66_0.015_280)]">
            Everything you need to know about legitimate cryptographic recovery.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                onClick={() => toggleFaq(idx)}
                className="glass rounded-xl p-5 border border-[oklch(0.22_0.01_280/70%)] cursor-pointer transition-all hover:border-[oklch(0.4_0.12_295/50%)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-sans font-semibold text-sm text-[oklch(0.985_0_0)]">
                    {faq.q}
                  </span>
                  <span className="text-[oklch(0.62_0.22_295)] shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </div>
                {isOpen && (
                  <p className="mt-3 pt-3 border-t border-[oklch(0.22_0.01_280/40%)] text-xs text-[oklch(0.66_0.015_280)] leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pricing Section */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="font-mono text-xs text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider mb-2">
            Licensing
          </div>
          <h2 className="h2-title font-bold mb-3">
            Engineered for practitioners.
          </h2>
          <p className="text-sm text-[oklch(0.66_0.015_280)]">
            Transparent pricing for individual engineers, forensics labs, and security teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PRICING_TIERS.map((tier, idx) => {
            return (
              <div
                key={idx}
                className={`rounded-2xl p-6 md:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                  tier.highlight
                    ? 'glass-elevated border-2 border-[oklch(0.62_0.22_295)] shadow-[0_0_40px_-10px_oklch(0.62_0.22_295/30%)] scale-[1.02]'
                    : 'glass border border-[oklch(0.22_0.01_280/80%)]'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <PillBadge withDot variant="primary">
                      {tier.badge}
                    </PillBadge>
                  </div>
                )}

                <div>
                  <div className="font-sans font-bold text-lg text-white mb-1">
                    {tier.name}
                  </div>
                  <p className="text-xs text-[oklch(0.66_0.015_280)] mb-6 min-h-[36px]">
                    {tier.desc}
                  </p>

                  <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-[oklch(0.22_0.01_280/60%)]">
                    <span className="font-mono text-3xl font-bold text-white">
                      {tier.price}
                    </span>
                    <span className="text-xs font-mono text-[oklch(0.55_0.01_280)]">
                      / {tier.period}
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-8">
                    {tier.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2 text-xs text-[oklch(0.85_0.01_280)]">
                        <Check className="w-4 h-4 text-[oklch(0.72_0.17_155)] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={onSelectTier}
                  className={`w-full py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    tier.highlight
                      ? 'btn-primary'
                      : 'btn-ghost text-white'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
