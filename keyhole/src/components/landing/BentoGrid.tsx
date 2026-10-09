import React from 'react';
import { CardDark } from '@/components/ui/CardDark';
import {
  Cpu,
  FileCode2,
  KeyRound,
  ShieldAlert,
  Search,
  Binary,
  Layers,
  FileCheck2,
} from 'lucide-react';

const BENTO_CARDS = [
  {
    icon: Cpu,
    title: 'KDF & Iteration Audit',
    tag: 'CRYPTOGRAPHY',
    desc: 'Deep inspection of PBKDF2 iterations, Argon2id memory costs, and S2K count/specifiers to benchmark true cracking throughput.',
    accent: 'text-[oklch(0.62_0.22_295)]',
    badge: 'Argon2 / PBKDF2',
  },
  {
    icon: FileCode2,
    title: 'Known-Plaintext Recovery',
    tag: 'ATTACK SURFACE',
    desc: 'Exploits mathematical flaws in legacy ZipCrypto using bkcrack state reduction, restoring plaintext in minutes without cracking passphrases.',
    accent: 'text-[oklch(0.72_0.17_155)]',
    badge: 'bkcrack 1.5.0',
  },
  {
    icon: Binary,
    title: 'Native Hash Extraction',
    tag: 'INTEROPERABILITY',
    desc: 'Extracts exact Hashcat (-m) and John the Ripper hashes for VeraCrypt, Office agile encryption, PDF permissions, and LUKS1/2 headers.',
    accent: 'text-[oklch(0.75_0.14_210)]',
    badge: 'Hashcat / JtR',
  },
  {
    icon: KeyRound,
    title: 'Rule-Engine Candidate List',
    tag: 'HUMAN FACTOR',
    desc: 'Expands user-remembered roots with South-Asian patterns (Name@123), KoreKel mutations, and dive.rule permutations into a ranked Top 20.',
    accent: 'text-[oklch(0.78_0.15_85)]',
    badge: '20 Ranked Items',
  },
  {
    icon: ShieldAlert,
    title: 'Implementation Flaw Audit',
    tag: 'VULNERABILITIES',
    desc: 'Scans containers for reused IVs, CBC padding oracles, GCM nonce collisions (leaking Poly1305 key), and low-entropy PRNG seeds.',
    accent: 'text-[oklch(0.63_0.2_25)]',
    badge: 'CVE & Smell Audit',
  },
  {
    icon: Search,
    title: 'Keyfile & Memory Forensics',
    tag: 'STAGE 1 CHEAPEST',
    desc: 'Searches user-authorized workstations for shell history, ~/.netrc, KeePassXC residue, and mounted volume keys. Outperforms brute force.',
    accent: 'text-[oklch(0.62_0.22_295)]',
    badge: 'Local Residue',
  },
  {
    icon: Layers,
    title: 'Ransomware Decryptor Index',
    tag: 'INCIDENT TRIAGE',
    desc: 'Automated fingerprinting against No More Ransom, Emsisoft, and Kaspersky databases. Zero fake AI claims — straight honest triage.',
    accent: 'text-[oklch(0.72_0.17_155)]',
    badge: 'No More Ransom',
  },
  {
    icon: FileCheck2,
    title: 'Cryptographic Non-Mutation Ledger',
    tag: 'INTEGRITY GUARANTEE',
    desc: 'Enforces bit-identical work copies in /workspace/recovery/. Computes SHA-256 before and after every phase to prove absolute integrity.',
    accent: 'text-[oklch(0.75_0.14_210)]',
    badge: 'SHA-256 Verified',
  },
];

export const BentoGrid: React.FC = () => {
  return (
    <section id="formats-section" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="font-mono text-xs text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider mb-2">
          Forensic Architecture
        </div>
        <h2 className="h2-title font-bold mb-4">
          Never break a cipher. Break mistakes around it.
        </h2>
        <p className="text-sm md:text-base text-[oklch(0.66_0.015_280)] leading-relaxed">
          AES-256 and ChaCha20 are cryptographically impenetrable. KEYHOLE systematically audits the implementation smells, human passphrase biases, and leaked key materials that actually succeed in practice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {BENTO_CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <CardDark key={idx} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2.5 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/80%)] ${card.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] text-[oklch(0.55_0.01_280)] font-semibold uppercase tracking-wider">
                    {card.tag}
                  </span>
                </div>

                <h3 className="font-sans font-semibold text-base text-[oklch(0.985_0_0)] mb-2">
                  {card.title}
                </h3>
                <p className="text-xs text-[oklch(0.66_0.015_280)] leading-relaxed mb-4">
                  {card.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-[oklch(0.22_0.01_280/50%)] flex items-center justify-between">
                <span className="font-mono text-[11px] text-[oklch(0.62_0.22_295)] font-medium">
                  {card.badge}
                </span>
                <span className="text-[10px] text-[oklch(0.55_0.01_280)] font-mono">
                  Stage {idx % 6}
                </span>
              </div>
            </CardDark>
          );
        })}
      </div>
    </section>
  );
};
