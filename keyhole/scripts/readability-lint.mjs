/**
 * Readability and Style Lint Script
 * Evaluates Flesch-Kincaid Grade Level, sentence word count (max 18 words),
 * and banned vocabulary check on Simple Mode copy strings.
 */

import {
  AUTHENTICITY_PLAIN_MAPPINGS,
  RECOVERY_PLAIN_MAPPINGS,
  VAULT_PLAIN_MAPPINGS,
  PROVENANCE_PLAIN_MAPPINGS,
  GLOSSARY_DICTIONARY,
} from '../src/lib/plainCopy.ts';

const BANNED_JARGON = [
  'kdf',
  'aead',
  'entropy',
  'nonce',
  'iteration',
  'plaintext',
  'ciphertext',
  'manifest',
  'provenance',
  'merkle',
  'keyspace',
  'throughput',
  'gpu-hours',
];

function countSyllables(word) {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;
  const replaced = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');
  const matches = replaced.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export function computeFleschKincaidGrade(text) {
  // Split into sentences
  const sentences = text
    .split(/[.?!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length === 0) return 0;

  const words = text
    .replace(/-/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim().replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return 0;

  const totalSyllables = words.reduce((acc, w) => acc + countSyllables(w), 0);

  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = totalSyllables / words.length;

  const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  return Math.max(0, Number(grade.toFixed(2)));
}

export function auditString(str, label) {
  const sentences = str
    .split(/[.?!]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const errors = [];

  for (const s of sentences) {
    const words = s.split(/\s+/).filter(Boolean);
    if (words.length > 18) {
      errors.push(`Sentence exceeds 18 words (${words.length} words): "${s}"`);
    }

    // Check for banned jargon
    for (const banned of BANNED_JARGON) {
      const regex = new RegExp(`\\b${banned}\\b`, 'i');
      if (regex.test(s)) {
        errors.push(`Contains banned jargon "${banned}" without glossary token: "${s}"`);
      }
    }
  }

  const fkGrade = computeFleschKincaidGrade(str);
  if (fkGrade > 8.0) {
    errors.push(`Flesch-Kincaid Grade exceeds 8.0 (Grade ${fkGrade}): "${str}"`);
  }

  return {
    label,
    text: str,
    grade: fkGrade,
    passed: errors.length === 0,
    errors,
  };
}

export function runFullReadabilityAudit() {
  const reports = [];

  // 1. Authenticity Mappings
  const authVerdicts = ['MANIPULATION-INDICATORS-DETECTED', 'INCONCLUSIVE', 'AUTHENTIC-CONSISTENT'];
  for (const v of authVerdicts) {
    const copy = AUTHENTICITY_PLAIN_MAPPINGS[v]();
    reports.push(auditString(copy.verdictLine, `Authenticity [${v}] verdictLine`));
    reports.push(auditString(copy.whySentence, `Authenticity [${v}] whySentence`));
    reports.push(auditString(copy.whatItMeans, `Authenticity [${v}] whatItMeans`));
    for (const step of copy.nextSteps) {
      reports.push(auditString(step.label, `Authenticity [${v}] nextStep #${step.stepNumber}`));
    }
  }

  // 2. Recovery Mappings
  const recVerdicts = ['RECOVERED', 'LIKELY RECOVERABLE', 'LONG SHOT', 'INFEASIBLE'];
  for (const v of recVerdicts) {
    const copy = RECOVERY_PLAIN_MAPPINGS[v]();
    reports.push(auditString(copy.verdictLine, `Recovery [${v}] verdictLine`));
    reports.push(auditString(copy.whySentence, `Recovery [${v}] whySentence`));
    reports.push(auditString(copy.whatItMeans, `Recovery [${v}] whatItMeans`));
    for (const step of copy.nextSteps) {
      reports.push(auditString(step.label, `Recovery [${v}] nextStep #${step.stepNumber}`));
    }
  }

  // 3. Vault Mappings
  const vaultKeys = ['sealed', 'tampered', 'keyRotation', 'forgotPassword'];
  for (const k of vaultKeys) {
    const copy = VAULT_PLAIN_MAPPINGS[k];
    reports.push(auditString(copy.statusLine, `Vault [${k}] statusLine`));
    reports.push(auditString(copy.explanation, `Vault [${k}] explanation`));
    for (const step of copy.nextSteps) {
      reports.push(auditString(step.label, `Vault [${k}] nextStep #${step.stepNumber}`));
    }
  }

  // 4. Provenance Mappings
  for (const [status, prov] of Object.entries(PROVENANCE_PLAIN_MAPPINGS)) {
    reports.push(auditString(prov.title, `Provenance [${status}] title`));
  }

  // 5. Glossary Verification
  const glossaryKeys = Object.keys(GLOSSARY_DICTIONARY);
  if (glossaryKeys.length < 20) {
    reports.push({
      label: 'Glossary completeness',
      text: `Glossary contains ${glossaryKeys.length} entries (minimum 20)`,
      grade: 0,
      passed: false,
      errors: ['Glossary has fewer than 20 terms'],
    });
  }

  return reports;
}

if (process.argv[1].endsWith('readability-lint.mjs')) {
  console.log('Running KEYHOLE Plain-Language Readability Lint...');
  const reports = runFullReadabilityAudit();
  const failed = reports.filter((r) => !r.passed);

  console.log(`Audited ${reports.length} plain-language copy strings.`);
  const avgGrade = (reports.reduce((acc, r) => acc + r.grade, 0) / reports.length).toFixed(2);
  console.log(`Average Flesch-Kincaid Grade: ${avgGrade} (Target: <= 8.0)`);

  if (failed.length > 0) {
    console.error(`FAILED: ${failed.length} strings failed readability criteria:`);
    for (const f of failed) {
      console.error(`- [${f.label}]: ${f.errors.join('; ')}`);
    }
    process.exit(1);
  } else {
    console.log('PASS: All plain copy strings strictly satisfy <= 18 words and Grade <= 8.0 rules.');
  }
}
