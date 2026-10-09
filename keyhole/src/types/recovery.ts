export type RecoveryMode = 'A' | 'B' | 'C' | 'D';

export interface RecoveryModeInfo {
  id: RecoveryMode;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  supportedFormats: string[];
  vectors: string[];
}

export const RECOVERY_MODES: Record<RecoveryMode, RecoveryModeInfo> = {
  A: {
    id: 'A',
    name: 'Format Unlock',
    badge: 'Mode A: Documents & Archives',
    tagline: 'Encrypted archives, PDFs, Office documents and disk images',
    description: 'Specialized parsing for legacy vs modern ciphers (ZipCrypto vs AES-256, RC4-HMAC vs AES-256/SHA-512, PDF owner permissions).',
    supportedFormats: ['ZIP', '7z', 'RAR', 'PDF', 'DOCX', 'XLSX', 'DMG', 'ISO'],
    vectors: ['Legacy ZipCrypto known-plaintext (bkcrack)', 'PDF permission-stripping (qpdf)', 'Office hash extraction (msoffcrypto-tool)', 'Weak password dictionary pass'],
  },
  B: {
    id: 'B',
    name: 'Lost Personal Passphrase',
    badge: 'Mode B: Full Volume & Keys',
    tagline: 'VeraCrypt, LUKS1/2, GPG, age, BitLocker, SSH keys, backup vaults',
    description: 'Header analysis, iteration count audit, personal passphrase human-factor generator, and budgeted offline cracking ladder.',
    supportedFormats: ['VeraCrypt', 'LUKS', 'GPG', 'age', 'BitLocker', 'SSH Key', 'iOS/Android Backup'],
    vectors: ['Header KDF iteration benchmarking', 'Targeted human wordlist & regex expansion', 'P1-P4 offline cracking budget', 'Local keyfile / memory residue audit'],
  },
  C: {
    id: 'C',
    name: 'Ransomware Triage',
    badge: 'Mode C: Ransomware Incident',
    tagline: 'Family fingerprinting, known decryptor lookup, bad-RNG / key-reuse audit',
    description: 'Honest cryptographic audit against published decryptors (No More Ransom / Emsisoft / Kaspersky). Never fabricates "AI decryption".',
    supportedFormats: ['LockBit', 'BlackCat', 'WannaCry', 'Phobos', 'STOP/Djvu', 'Conti', 'Babuk'],
    vectors: ['Public signature & ransom-note fingerprinting', 'No More Ransom index query', 'Stream cipher nonce-reuse audit', 'Hardcoded/seeded PRNG analysis'],
  },
  D: {
    id: 'D',
    name: 'Corruption vs Encryption',
    badge: 'Mode D: Structural Carving',
    tagline: 'Damaged headers, mismatched extensions, bad CRC, carved unencrypted streams',
    description: 'Distinguishes true high-entropy ciphertext from truncated containers, wrong file signatures, and uncompressed embedded streams.',
    supportedFormats: ['Truncated Containers', 'Bad CRC Archives', 'Zero-Entropy Padding', 'Raw Streams'],
    vectors: ['Shannon entropy window scanning', 'Container header reconstruction', 'Photorec / Foremost stream carving', 'Magic byte reconciliation'],
  },
};

export type StageStatus = 'queued' | 'running' | 'pass' | 'fail' | 'skipped';

export interface StageExecution {
  id: number;
  name: string;
  tag: string;
  status: StageStatus;
  durationMs: number;
  stdout: string[];
  command: string;
  summary: string;
  findings: string[];
}

export interface Candidate {
  id: string;
  passphrase: string;
  confidence: number;
  source: string;
  rationale: string;
  tested: boolean;
  success?: boolean;
}

export type TerminalVerdict = 'RECOVERED' | 'LIKELY RECOVERABLE' | 'LONG SHOT' | 'INFEASIBLE';

export interface RecoveryVerdictData {
  verdict: TerminalVerdict;
  probability: number;
  headline: string;
  reason: string;
  recoveredPassphrase?: string;
  passphraseMasked?: boolean;
  timeElapsed: string;
  totalCandidates: number;
  nextPassCost?: string;
  killCriterionNote?: string;
  evidence: {
    command: string;
    output: string;
    conclusion: string;
  }[];
  recoveryPlan: {
    step: number;
    title: string;
    command: string;
    timeCost: string;
    risk: string;
  }[];
  topCandidates: Candidate[];
  effortTable: {
    pass: string;
    tool: string;
    keyspace: string;
    gpuHours: string;
    successRate: string;
  }[];
  prevention: string[];
  ethicsNote: string;
}

export interface AnalyzedFile {
  file: File;
  name: string;
  size: number;
  sha256: string;
  entropy: number;
  first64Hex: string;
  detectedMime: string;
  containerType: string;
  cipher: string;
  kdf: string;
  iterations: number;
  saltHex?: string;
  isLegacyWeak: boolean;
}

export interface UserAnswers {
  rememberedWords: string;
  approxLength: string;
  specialChars: string;
  datesOrYears: string;
  ownMachine: boolean;
  hasGpu: boolean;
  gpuModel: string;
  cpuCores: number;
  successBar: 'all' | 'one' | 'any';
}
