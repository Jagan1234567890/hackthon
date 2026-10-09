/**
 * KEYHOLE PLAIN-LANGUAGE COPY SYSTEM (Simple Mode)
 *
 * Implements Section 3 of KEYHOLE specification v3.
 * Single source of truth for all Simple mode strings, mappings, next-steps,
 * and glossary definitions.
 *
 * Sizing & Style Rules (Section 3.1):
 * - Active voice, second person, present tense.
 * - Maximum 18 words per sentence.
 * - Grade 8 reading level or below (Flesch-Kincaid <= 8.0).
 * - No exclamation marks. No apology. No hedging stacked three deep.
 * - Jargon allowed only when wrapped in a glossary token.
 */

import type { AuthenticityVerdict, C2PAStatus } from '../types/authenticity';
import type { TerminalVerdict } from '../types/recovery';

// ---------------------------------------------------------------------------
// Types & Contracts
// ---------------------------------------------------------------------------

export type SimpleConfidenceLevel = 'not sure' | 'probably' | 'fairly sure';

export interface NextStepItem {
  id: string;
  stepNumber: number;
  label: string;
  actionType: 'button' | 'link' | 'instruction';
  actionTarget?: string;
  buttonText?: string;
}

export interface PlainAuthenticityCopy {
  verdictLine: string;
  confidence: SimpleConfidenceLevel;
  confidenceText: string;
  whySentence: string;
  whatItMeans: string;
  nextSteps: NextStepItem[];
  mandatoryCaveat: string;
  supportNotice?: string;
}

export interface PlainRecoveryCopy {
  verdictLine: string;
  confidence: SimpleConfidenceLevel;
  confidenceText: string;
  whySentence: string;
  whatItMeans: string;
  nextSteps: NextStepItem[];
  mandatoryCaveat: string;
  timeEstimate?: string;
  downloadAvailable?: boolean;
  supportNotice?: string;
}

export interface PlainVaultCopy {
  statusLine: string;
  explanation: string;
  subNotice: string;
  nextSteps: NextStepItem[];
  mandatoryCaveat: string;
}

export interface GlossaryEntry {
  term: string;
  plainDefinition: string;
  technicalTerm: string;
}

// ---------------------------------------------------------------------------
// Glossary Dictionary (Section 3.6)
// ---------------------------------------------------------------------------

export const GLOSSARY_DICTIONARY: Record<string, GlossaryEntry> = {
  metadata: {
    term: 'metadata',
    plainDefinition: 'Details stored inside a file, such as the camera model or when it was saved.',
    technicalTerm: 'Exif, IPTC, and XMP structured container headers',
  },
  'fingerprint (hash)': {
    term: 'fingerprint (hash)',
    plainDefinition: 'A unique code made from the file contents. If even one pixel changes, the code changes completely.',
    technicalTerm: 'Cryptographic SHA-256 / BLAKE3 message digest',
  },
  compression: {
    term: 'compression',
    plainDefinition: 'Shrinking a file so it sends faster. This often removes fine details and can look like editing.',
    technicalTerm: 'Lossy discrete cosine transform or modern video codecs (H.264, HEVC, AV1)',
  },
  KDF: {
    term: 'KDF',
    plainDefinition: 'A slow math function that turns your password into an encryption key so attackers cannot guess it quickly.',
    technicalTerm: 'Key Derivation Function (Argon2id, scrypt, or PBKDF2-HMAC-SHA512)',
  },
  'iteration count': {
    term: 'iteration count',
    plainDefinition: 'The number of times the math function repeats to make guessing your password harder.',
    technicalTerm: 'Computational cost rounds or Argon2 time cost parameter',
  },
  encryption: {
    term: 'encryption',
    plainDefinition: 'Scrambling your file so only someone with the correct password can read it.',
    technicalTerm: 'Authenticated symmetric ciphers (AES-256-GCM or XChaCha20-Poly1305)',
  },
  'key file': {
    term: 'key file',
    plainDefinition: 'A secret file on your drive that acts like a physical key to unlock your vault.',
    technicalTerm: 'High-entropy key material or hardware token secret',
  },
  nonce: {
    term: 'nonce',
    plainDefinition: 'A single-use number that ensures two identical files look completely different when locked.',
    technicalTerm: 'Cryptographic Number Used Once (96-bit or 192-bit initialization vector)',
  },
  padding: {
    term: 'padding',
    plainDefinition: 'Extra dummy bytes added to hide the exact size of your secret files.',
    technicalTerm: 'Power-of-two bucket padding or PKCS#7 block alignment',
  },
  entropy: {
    term: 'entropy',
    plainDefinition: 'A measure of randomness. Scrambled files have high entropy, while regular documents have low entropy.',
    technicalTerm: 'Shannon entropy in bits per byte (0.0 to 8.0)',
  },
  spectrogram: {
    term: 'spectrogram',
    plainDefinition: 'A visual chart of sound frequencies over time, showing voices and background noise.',
    technicalTerm: 'Short-Time Fourier Transform (STFT) time-frequency distribution',
  },
  frame: {
    term: 'frame',
    plainDefinition: 'A single still picture in a video sequence.',
    technicalTerm: 'Decoded video raster buffer in presentation timestamp order',
  },
  'lip sync': {
    term: 'lip sync',
    plainDefinition: 'How well mouth movements match the spoken audio track.',
    technicalTerm: 'Audio-visual temporal cross-correlation and phoneme-viseme alignment',
  },
  provenance: {
    term: 'provenance',
    plainDefinition: 'A digital record showing who created the file and whether it was changed.',
    technicalTerm: 'C2PA Coalition for Content Provenance and Authenticity claim',
  },
  C2PA: {
    term: 'C2PA',
    plainDefinition: 'An open standard for embedding tamper-proof creator signatures directly into media files.',
    technicalTerm: 'Cryptographically signed JUMBF manifest envelope and assertions',
  },
  'certificate chain': {
    term: 'certificate chain',
    plainDefinition: 'A sequence of digital badges proving the creator signature came from a verified company.',
    technicalTerm: 'X.509 Public Key Infrastructure (PKI) trust path',
  },
  'passphrase strength': {
    term: 'passphrase strength',
    plainDefinition: 'How hard it is for a computer to guess your password by trying many combinations.',
    technicalTerm: 'Information-theoretic entropy measured in bits',
  },
  'GPU-hours': {
    term: 'GPU-hours',
    plainDefinition: 'The time a powerful graphics card spends testing password guesses.',
    technicalTerm: 'Massively parallel hardware cracking resource consumption',
  },
  rule: {
    term: 'rule',
    plainDefinition: 'A pattern recipe that changes base words by adding numbers, capitals, or symbols.',
    technicalTerm: 'Hashcat or John the Ripper mutation rule',
  },
  wordlist: {
    term: 'wordlist',
    plainDefinition: 'A list of common words and names used to test possible passwords.',
    technicalTerm: 'Dictionary file for offline password auditing',
  },
  'mask attack': {
    term: 'mask attack',
    plainDefinition: 'Testing passwords that match a specific structure, like four letters followed by four numbers.',
    technicalTerm: 'Keyspace mask pattern search (such as ?u?l?l?l?d?d?d?d)',
  },
};

// ---------------------------------------------------------------------------
// Authenticity Mappings (Section 3.2)
// ---------------------------------------------------------------------------

export const AUTHENTICITY_PLAIN_MAPPINGS: Record<AuthenticityVerdict, (strongestSignal?: string) => PlainAuthenticityCopy> = {
  'MANIPULATION-INDICATORS-DETECTED': (strongestSignal) => ({
    verdictLine: 'This looks edited or computer-made.',
    confidence: 'fairly sure',
    confidenceText: 'Fairly sure',
    whySentence: strongestSignal
      ? translateSignalToPlain(strongestSignal)
      : 'The person in the video never blinks. The face lighting does not match the room.',
    whatItMeans: 'Do not share this further, and do not treat it as real.',
    nextSteps: [
      {
        id: 'step-hold',
        stepNumber: 1,
        label: "Don't pass it on yet.",
        actionType: 'instruction',
      },
      {
        id: 'step-origin',
        stepNumber: 2,
        label: 'Check where it first appeared online.',
        actionType: 'button',
        buttonText: 'Check origin',
        actionTarget: 'origin-lookup',
      },
      {
        id: 'step-preserve',
        stepNumber: 3,
        label: 'If someone uses this to trick you, keep this page and the file. It beats a screenshot.',
        actionType: 'instruction',
      },
      {
        id: 'step-expert',
        stepNumber: 4,
        label: 'For serious cases, ask an expert to check it.',
        actionType: 'instruction',
      },
    ],
    mandatoryCaveat:
      'Generalization across unseen generators and codecs is limited. A high human-risk decision needs human expert review.',
    supportNotice:
      'If this is being used to hurt someone, the original file and this report are worth keeping. A lawyer or the police can read this page.',
  }),

  INCONCLUSIVE: (strongestSignal) => ({
    verdictLine: "We can't tell for sure.",
    confidence: 'not sure',
    confidenceText: 'Not sure',
    whySentence: strongestSignal
      ? 'Some signs point to editing. But app compression can cause the same thing.'
      : 'Some signs point to editing. But a messaging app compressed the file, which causes the same signs.',
    whatItMeans: 'Treat it as unverified rather than fake.',
    nextSteps: [
      {
        id: 'step-original',
        stepNumber: 1,
        label: 'Ask the sender for the original file.',
        actionType: 'instruction',
      },
      {
        id: 'step-reupload',
        stepNumber: 2,
        label: 'Try the full-quality version here.',
        actionType: 'button',
        buttonText: 'Drop full quality',
        actionTarget: 'drop-zone',
      },
      {
        id: 'step-detail',
        stepNumber: 3,
        label: 'Run the checks listed in the technical detail.',
        actionType: 'button',
        buttonText: 'View checks',
        actionTarget: 'tech-accordion',
      },
    ],
    mandatoryCaveat:
      'Some signs could also be caused by compression. Absence of evidence is not evidence of absence.',
    supportNotice:
      'If this is being used to hurt someone, the original file and this report are worth keeping. A lawyer or the police can read this page.',
  }),

  'AUTHENTIC-CONSISTENT': () => ({
    verdictLine: "We don't see signs of editing.",
    confidence: 'probably',
    confidenceText: 'Probably',
    whySentence: 'The light, sensor noise, and small details all match a real camera.',
    whatItMeans: 'The photo from your camera looks untouched and clean.',
    nextSteps: [
      {
        id: 'step-keep-meta',
        stepNumber: 1,
        label: 'Keep your original file. The saved details are the most useful part.',
        actionType: 'instruction',
      },
      {
        id: 'step-screening',
        stepNumber: 2,
        label: 'Need certainty? This is a screening tool, not a lab.',
        actionType: 'instruction',
      },
    ],
    mandatoryCaveat:
      'This is a good sign, not a guarantee. Our tests can miss some edits.',
  }),
};

// ---------------------------------------------------------------------------
// Provenance Mappings (Section 3.2)
// ---------------------------------------------------------------------------

export const PROVENANCE_PLAIN_MAPPINGS: Record<C2PAStatus, { title: string; explanation: string; action: string }> = {
  'VERIFIED AUTHENTIC': {
    title: 'We found a verified origin record on this file.',
    explanation: 'The camera or software signed this file when creating it. The signature matches.',
    action: 'You can verify the creator identity in the technical detail.',
  },
  'NO PROVENANCE DATA — NEITHER CONFIRMS NOR REFUTES': {
    title: "There's no built-in record of where this came from.",
    explanation: "That's normal for most files. It doesn't mean anything is wrong, and it doesn't prove anything either.",
    action: 'Examine the visual signals below to check for editing.',
  },
  'MANIFEST STRIPPED': {
    title: 'The built-in origin record is missing or broken.',
    explanation: 'Social media or messaging apps often strip origin records to save bandwidth.',
    action: 'Ask the sender for the original uncompressed camera file.',
  },
  'MANIFEST INVALID': {
    title: 'The built-in origin record is missing or broken.',
    explanation: 'The file contents do not match the digital signature attached to it.',
    action: 'Treat this file with caution and request an untampered copy.',
  },
};

// ---------------------------------------------------------------------------
// Recovery Mappings (Section 3.3)
// ---------------------------------------------------------------------------

export const RECOVERY_PLAIN_MAPPINGS: Record<TerminalVerdict, (details?: { count?: number; total?: number; timeEst?: string; sha256?: string }) => PlainRecoveryCopy> = {
  RECOVERED: (details) => ({
    verdictLine: "It's open. Here's your file.",
    confidence: 'fairly sure',
    confidenceText: 'Fairly sure',
    whySentence: 'The password matched the security tag on your file.',
    whatItMeans: 'You can now download and view your original data.',
    downloadAvailable: true,
    nextSteps: [
      {
        id: 'step-dl',
        stepNumber: 1,
        label: 'Download your unlocked file to a safe folder.',
        actionType: 'button',
        buttonText: 'Download file',
        actionTarget: 'download-recovered',
      },
      {
        id: 'step-backup',
        stepNumber: 2,
        label: 'Save the password in a trusted password manager.',
        actionType: 'instruction',
      },
    ],
    mandatoryCaveat:
      `We kept the original file untouched. Its fingerprint matches: ${details?.sha256 ? details.sha256.slice(0, 16) + '...' : 'Verified'}.`,
  }),

  'LIKELY RECOVERABLE': (details) => ({
    verdictLine: 'We can probably get this, but it takes time.',
    confidence: 'probably',
    confidenceText: 'Probably',
    whySentence: 'Your password matches common patterns. The computer can test them quickly.',
    whatItMeans: 'Letting the test run has a good chance of unlocking your file.',
    timeEstimate: details?.timeEst || 'Roughly 2 to 6 hours on this computer, maybe less.',
    nextSteps: [
      {
        id: 'step-start-run',
        stepNumber: 1,
        label: 'Start the recovery run now.',
        actionType: 'button',
        buttonText: 'Start search',
        actionTarget: 'start-recovery-run',
      },
      {
        id: 'step-power',
        stepNumber: 2,
        label: "Don't close your laptop lid. It can run in the background.",
        actionType: 'instruction',
      },
    ],
    mandatoryCaveat:
      'We test guesses on your machine only. Nothing leaves your computer.',
  }),

  'LONG SHOT': () => ({
    verdictLine: "It's unlikely we can guess this password.",
    confidence: 'not sure',
    confidenceText: 'Low chance',
    whySentence: 'The password looks long and random, and the lock is a good one with no shortcut.',
    whatItMeans: 'Brute-force guessing will take years. Searching your records is far faster.',
    nextSteps: [
      {
        id: 'step-cloud-trash',
        stepNumber: 1,
        label: 'Check cloud drive trash and version history for an earlier copy.',
        actionType: 'instruction',
      },
      {
        id: 'step-email-search',
        stepNumber: 2,
        label: 'Search your email for notes sent around the time you locked it.',
        actionType: 'instruction',
      },
      {
        id: 'step-other-pc',
        stepNumber: 3,
        label: 'Check another computer or phone where you might have saved the password.',
        actionType: 'instruction',
      },
      {
        id: 'step-note',
        stepNumber: 4,
        label: 'Look for a printed recovery sheet or paper notebook.',
        actionType: 'instruction',
      },
    ],
    mandatoryCaveat:
      'Sound encryption cannot be broken by guessing. A backup is your best option.',
  }),

  INFEASIBLE: () => ({
    verdictLine: 'There is no way to open this without the password, and we cannot help with that.',
    confidence: 'fairly sure',
    confidenceText: 'Certain',
    whySentence: 'The file uses strong modern locks. No clues or key files exist.',
    whatItMeans: 'This is a strength, not a fault. The same property protects your other files.',
    nextSteps: [
      {
        id: 'step-backup-restore',
        stepNumber: 1,
        label: 'Try a backup, then reformat and restore if you have a disk image.',
        actionType: 'instruction',
      },
      {
        id: 'step-archive',
        stepNumber: 2,
        label: 'Keep the locked file in case you remember the password later.',
        actionType: 'instruction',
      },
    ],
    mandatoryCaveat:
      'No computer can break modern encryption without the key. Be wary of paid scams offering to crack it.',
  }),
};

// ---------------------------------------------------------------------------
// Vault Plain Mappings (Section 3.4)
// ---------------------------------------------------------------------------

export const VAULT_PLAIN_MAPPINGS = {
  sealed: {
    statusLine: 'Your file is locked.',
    explanation: 'Only your password opens it. We have no copy and nobody can reset it.',
    subNotice: 'This is the safest way to store sensitive information.',
    nextSteps: [
      {
        id: 'v-keep-pass',
        stepNumber: 1,
        label: 'Save your password in a secure password manager right now.',
        actionType: 'instruction' as const,
      },
      {
        id: 'v-test-unlock',
        stepNumber: 2,
        label: 'Test opening the file before you remove the first copy.',
        actionType: 'button' as const,
        buttonText: 'Test unlock',
        actionTarget: 'test-unlock',
      },
    ],
    mandatoryCaveat: 'We have no master key. If you forget your password, the data cannot be recovered.',
  },

  tampered: {
    statusLine: 'This file has been changed since we sealed it. We will not open it until you know why.',
    explanation: 'Blocks inside the file do not match the security seal.',
    subNotice: 'Opening a tampered file could be dangerous.',
    nextSteps: [
      {
        id: 'v-compare-hash',
        stepNumber: 1,
        label: 'Compare the fingerprint with the one you saved.',
        actionType: 'button' as const,
        buttonText: 'Compare fingerprint',
        actionTarget: 'compare-fingerprint',
      },
      {
        id: 'v-restore-copy',
        stepNumber: 2,
        label: 'Restore an untampered copy from your backup drive.',
        actionType: 'instruction' as const,
      },
    ],
    mandatoryCaveat: 'The security tag failed. The file was altered or damaged in storage.',
  },

  keyRotation: {
    statusLine: 'We re-wrapped the key.',
    explanation: 'Your password still works, and we did not need to touch the files themselves.',
    subNotice: 'Key rotation protects your vault without slow re-encryption.',
    nextSteps: [
      {
        id: 'v-continue',
        stepNumber: 1,
        label: 'Your vault is ready for continued use.',
        actionType: 'instruction' as const,
      },
    ],
    mandatoryCaveat: 'The data contents remain bit-for-bit identical.',
  },

  forgotPassword: {
    statusLine: 'Lost the password? Try these five things before we start guessing.',
    explanation: 'Memory searches and notes find lost passwords much faster than brute force.',
    subNotice: 'Take five minutes to review your records first.',
    nextSteps: [
      {
        id: 'fp-1',
        stepNumber: 1,
        label: 'Check your password manager trash or history.',
        actionType: 'instruction' as const,
      },
      {
        id: 'fp-2',
        stepNumber: 2,
        label: 'Search your email for registration notes.',
        actionType: 'instruction' as const,
      },
      {
        id: 'fp-3',
        stepNumber: 3,
        label: 'Check written notes in your desk or notebook.',
        actionType: 'instruction' as const,
      },
      {
        id: 'fp-4',
        stepNumber: 4,
        label: 'Test variations of passwords you used around that date.',
        actionType: 'instruction' as const,
      },
      {
        id: 'fp-5',
        stepNumber: 5,
        label: 'Ask anyone who shared the project with you.',
        actionType: 'instruction' as const,
      },
    ],
    mandatoryCaveat: 'We never upload your password guesses. Everything runs locally on your computer.',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Translates raw technical signal strings into plain language sentences (Section 3.2).
 * Enforces <= 18 words per sentence and Grade <= 8 vocabulary.
 */
export function translateSignalToPlain(signalName: string): string {
  const lower = signalName.toLowerCase();

  if (lower.includes('blink') || lower.includes('eye')) {
    return 'The person in the video never blinks naturally.';
  }
  if (lower.includes('noise') || lower.includes('prnu')) {
    return 'The camera sensor noise does not match a real phone or lens.';
  }
  if (lower.includes('frequency') || lower.includes('fft') || lower.includes('checkerboard')) {
    return 'The picture has repeating grid patterns typical of computer generation.';
  }
  if (lower.includes('lip') || lower.includes('sync')) {
    return 'The mouth movements do not match the spoken words.';
  }
  if (lower.includes('vocoder') || lower.includes('audio') || lower.includes('seam')) {
    return 'The voice has unnatural cuts and sharp frequency cliffs.';
  }
  if (lower.includes('lighting') || lower.includes('shadow') || lower.includes('specular')) {
    return 'The shadows on the face do not match the room lights.';
  }
  if (lower.includes('photoshop') || lower.includes('software')) {
    return 'The file contains traces from editing software.';
  }
  return 'Several visual checks point to computer generation.';
}
