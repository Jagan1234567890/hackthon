import React from 'react';
import { ShieldCheck, Ban, CheckCircle2, AlertOctagon } from 'lucide-react';

export const EthicsPanel: React.FC = () => {
  return (
    <section id="ethics-section" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="font-mono text-xs text-[oklch(0.62_0.22_295)] font-semibold uppercase tracking-wider mb-2">
          Ethics &amp; Authorization
        </div>
        <h2 className="h2-title font-bold mb-4">
          Non-Negotiable Guardrails
        </h2>
        <p className="text-sm md:text-base text-[oklch(0.66_0.015_280)] leading-relaxed">
          KEYHOLE is an engineering forensic tool for legitimate file owners. It operates under strict cryptographic and ethical constraints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Permitted & Enforced Core Principles */}
        <div className="glass rounded-2xl p-6 md:p-8 border border-[oklch(0.72_0.17_155/35%)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[oklch(0.72_0.17_155/15%)] text-[oklch(0.72_0.17_155)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg text-[oklch(0.985_0_0)]">
                Guaranteed Protections
              </h3>
              <p className="text-xs text-[oklch(0.66_0.015_280)]">
                Cryptographic integrity and user privacy safeguards
              </p>
            </div>
          </div>

          <div className="space-y-3 font-sans text-xs text-[oklch(0.85_0.01_280)] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.17_155)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">100% Local Processing:</strong> Zero file content, ciphertexts, hashes, or candidate passphrases ever leave your browser or local host.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.17_155)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Non-Destructive Integrity Ledger:</strong> Analysis executes strictly on bit-identical copies. SHA-256 is verified before and after each phase.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[oklch(0.72_0.17_155)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Honest Math Over Fiction:</strong> Never fabricates &quot;AI decryption&quot;. Sound 256-bit ciphers are reported plainly as <span className="font-mono font-bold text-[oklch(0.63_0.2_25)]">INFEASIBLE</span>.
              </div>
            </div>
          </div>
        </div>

        {/* Explicit Refusals */}
        <div className="glass rounded-2xl p-6 md:p-8 border border-[oklch(0.63_0.2_25/35%)] space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[oklch(0.63_0.2_25/15%)] text-[oklch(0.63_0.2_25)]">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg text-[oklch(0.985_0_0)]">
                Absolute Refusals
              </h3>
              <p className="text-xs text-[oklch(0.66_0.015_280)]">
                KEYHOLE will immediately refuse and abort on the following
              </p>
            </div>
          </div>

          <div className="space-y-3 font-sans text-xs text-[oklch(0.85_0.01_280)] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-[oklch(0.63_0.2_25)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Third-Party &amp; Unauthorized Targets:</strong> Any target not owned or explicitly authorized by the requester.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-[oklch(0.63_0.2_25)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Malicious Exploits &amp; Anti-Forensics:</strong> Credential stuffing, keylogger development, memory scraping of external machines, or ransomware negotiation.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-[oklch(0.63_0.2_25)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Ransomware Scope Limits:</strong> Ransomware triage is strictly limited to family identification and published decryptor verification.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
