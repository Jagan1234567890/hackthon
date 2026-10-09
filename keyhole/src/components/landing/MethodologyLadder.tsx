import React from 'react';
import { Stepper } from '@/components/ui/Stepper';
import { StageExecution } from '@/types/recovery';

const DEMO_LADDER: StageExecution[] = [
  {
    id: 0,
    name: 'Triage & Integrity Verification',
    tag: 'STAGE 0',
    status: 'pass',
    durationMs: 14,
    stdout: [],
    command: 'sha256sum target.7z && file -bi target.7z && xxd -l 64 target.7z && ent target.7z',
    summary: 'Extract magic bytes (37 7a bc af), compute Shannon entropy (7.9942 bits/byte), confirm non-mutation.',
    findings: [
      'Original SHA-256 computed: e8f9...4b12',
      'Bit-identical copy created in /workspace/recovery/target.7z',
      'Shannon Entropy: 7.9942 bits/byte (High-entropy ciphertext confirmed)',
      'Magic bytes confirmed: 7-Zip Container (AES-256-CBC)',
    ],
  },
  {
    id: 1,
    name: 'Existing Key Material & Local Residue',
    tag: 'STAGE 1',
    status: 'pass',
    durationMs: 85,
    stdout: [],
    command: 'grep -rInE "(password|passphrase|keyfile|recovery)" ~/.bash_history ~/.aws /workspace/recovery/',
    summary: 'Scan authorized origin host for shell history, environment variables, and pre-encryption backups.',
    findings: [
      'Searched ~/.bash_history, ~/.netrc, ~/.aws/credentials',
      'No plaintext password leaks detected in open environment files',
      'Proceeding to Stage 2 format structural inspection',
    ],
  },
  {
    id: 2,
    name: 'Format-Specific Structural Inspection',
    tag: 'STAGE 2',
    status: 'pass',
    durationMs: 120,
    stdout: [],
    command: '7z l -slt target.7z | grep -E "(Method|Encrypted|Blocks)"',
    summary: 'Inspect container headers, verify cipher method, determine salt and KDF iteration count.',
    findings: [
      'Method: 7z AES-256-CBC with SHA-256 KDF',
      'KDF Cost: 2^19 (524,288 iterations)',
      'Format structure verified sound. Direct structural bypass unavailable.',
    ],
  },
  {
    id: 3,
    name: 'Weak-Crypto & Implementation Audit',
    tag: 'STAGE 3',
    status: 'pass',
    durationMs: 95,
    stdout: [],
    command: 'crypto-audit --scan-iv-reuse --check-gcm-nonces target.7z',
    summary: 'Audit for static initialization vectors, CBC padding oracle exposure, and PRNG seed predictability.',
    findings: [
      'IV distribution test: PASS (Randomness confirmed across blocks)',
      'No static IV or GCM nonce collisions detected',
      'Iterations high (524,288 iter) -> Brute-force restricted to targeted human-factor candidate search',
    ],
  },
  {
    id: 4,
    name: 'Human-Factor Candidate Generation',
    tag: 'STAGE 4',
    status: 'pass',
    durationMs: 45,
    stdout: [],
    command: 'john --wordlist=user_base.txt --rules=KoreKel --stdout > cand.txt',
    summary: 'Expand remembered roots with South-Asian pattern rules, leetspeak, and year permutations.',
    findings: [
      'Generated 20 ranked candidates based on user remembered terms and birth year suffixes',
      'Top Candidate: "Varun@2024!" (Confidence: 88%)',
      'Second Candidate: "varun123" (Confidence: 82%)',
    ],
  },
  {
    id: 5,
    name: 'Budgeted Offline Cracking Ladder',
    tag: 'STAGE 5',
    status: 'pass',
    durationMs: 18640,
    stdout: [],
    command: 'hashcat -m 11600 -a 0 target.hash cand.txt --status',
    summary: 'Execute P1 curated candidate pass with GPU throughput benchmarking and hard kill-criterion.',
    findings: [
      'Hashcat mode: 11600 (7-Zip)',
      'Speed: 420.5 kH/s (Local RTX compute)',
      'Match found on candidate #1 ("Varun@2024!") in 18.64s',
      'STATUS: RECOVERED',
    ],
  },
];

export const MethodologyLadder: React.FC = () => {
  return (
    <section id="ladder-section" className="py-20 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="font-mono text-xs text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider mb-2">
          Methodology Ladder
        </div>
        <h2 className="h2-title font-bold mb-4">
          Cheapest-first execution.
        </h2>
        <p className="text-sm md:text-base text-[oklch(0.66_0.015_280)] leading-relaxed">
          Every run ascends a strict 6-stage ladder. Stages that take milliseconds and zero GPU power run first. Heavy offline cracking is budgeted with strict kill criteria.
        </p>
      </div>

      <div className="glass-elevated rounded-2xl p-6 md:p-8 border border-[oklch(0.22_0.01_280/80%)] shadow-2xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[oklch(0.22_0.01_280/50%)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-[oklch(0.985_0_0)]">
              LADDER EXECUTION PIPELINE
            </span>
            <span className="text-xs text-[oklch(0.55_0.01_280)]">
              (Stages 0 through 5)
            </span>
          </div>
          <span className="font-mono text-xs text-[oklch(0.72_0.17_155)] font-semibold">
            6/6 STAGES PASS
          </span>
        </div>

        <Stepper stages={DEMO_LADDER} activeStageIndex={5} />
      </div>
    </section>
  );
};
