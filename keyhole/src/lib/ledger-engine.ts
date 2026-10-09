import { LedgerRecord, RedactionConfig } from '@/types/ledger';
import { calculateSha256 } from './recovery-engine';

const LEDGER_STORAGE_KEY = 'keyhole_immutable_ledger_v1';

// Initial Genesis Block
const GENESIS_RECORD: LedgerRecord = {
  caseId: 'case-genesis-0000',
  timestamp: '2026-01-01T00:00:00.000Z',
  kind: 'AUTHENTICITY_INSPECTION',
  inputFilename: 'genesis_policy.c2pa',
  inputSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  verdict: 'GENESIS_ANCHOR',
  scoreOrConfidence: '1.00',
  modelOrKdfInfo: 'KEYHOLE Hardware Enclave Root',
  evidenceChainHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  previousRecordHash: '0000000000000000000000000000000000000000000000000000000000000000',
  redacted: false,
};

/**
 * Loads the current ledger from localStorage or seeds with initial authentic cases.
 */
export function getLedgerRecords(): LedgerRecord[] {
  if (typeof window === 'undefined') return [GENESIS_RECORD];
  const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
  if (!stored) {
    const seeded = [
      GENESIS_RECORD,
      {
        caseId: 'case-auth-9281a',
        timestamp: '2026-10-08T18:42:10.000Z',
        kind: 'AUTHENTICITY_INSPECTION' as const,
        inputFilename: 'press_briefing_statement.mp4',
        inputSha256: '4a89fb10928e02d8471c229ea019284719284710293847192847192847102938',
        verdict: 'AUTHENTIC-CONSISTENT',
        scoreOrConfidence: '0.18 (Uncertainty: 0.12 - 0.24)',
        modelOrKdfInfo: 'Umeyama v2.4 + ArcFace-100 + SyncNet',
        evidenceChainHash: '8b72a1048f9102c8172948271049284719284710293847192847192847102938',
        previousRecordHash: GENESIS_RECORD.evidenceChainHash,
        redacted: false,
      },
      {
        caseId: 'case-vault-3190b',
        timestamp: '2026-10-09T09:14:02.000Z',
        kind: 'VAULT_SEAL' as const,
        inputFilename: 'q3_investigation_notes.docx',
        inputSha256: '9102837461928374619283746192837461928374619283746192837461928374',
        verdict: 'SEALED_CONTAINER_CREATED',
        scoreOrConfidence: 'AES-256-GCM / 64KB Chunks',
        modelOrKdfInfo: 'Argon2id (64MB, 3 iter, 4 lanes)',
        evidenceChainHash: 'f491823746192837461928374619283746192837461928374619283746192837',
        previousRecordHash: '8b72a1048f9102c8172948271049284719284710293847192847192847102938',
        redacted: false,
      },
    ];
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [GENESIS_RECORD];
  }
}

/**
 * Appends a new case to the immutable ledger with cryptographic linking.
 */
export async function appendLedgerRecord(
  kind: LedgerRecord['kind'],
  inputFilename: string,
  inputSha256: string,
  verdict: string,
  scoreOrConfidence: string,
  modelOrKdfInfo: string
): Promise<LedgerRecord> {
  const current = getLedgerRecords();
  const lastRecord = current[current.length - 1] || GENESIS_RECORD;
  const caseId = `case-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const timestamp = new Date().toISOString();

  // Compute block hash: SHA-256(prevHash || caseId || timestamp || inputSha256 || verdict)
  const enc = new TextEncoder();
  const blockPayload = `${lastRecord.evidenceChainHash}:${caseId}:${timestamp}:${inputSha256}:${verdict}:${modelOrKdfInfo}`;
  const evidenceChainHash = await calculateSha256(enc.encode(blockPayload).buffer as ArrayBuffer);

  const newRecord: LedgerRecord = {
    caseId,
    timestamp,
    kind,
    inputFilename,
    inputSha256,
    verdict,
    scoreOrConfidence,
    modelOrKdfInfo,
    evidenceChainHash,
    previousRecordHash: lastRecord.evidenceChainHash,
    redacted: false,
  };

  const updated = [...current, newRecord];
  if (typeof window !== 'undefined') {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(updated));
  }
  return newRecord;
}

/**
 * Re-verifies ledger integrity by recomputing every block hash in the chain.
 */
export async function verifyLedgerChain(): Promise<{
  isValid: boolean;
  totalBlocks: number;
  brokenBlockIndex?: number;
}> {
  const records = getLedgerRecords();
  const enc = new TextEncoder();

  for (let i = 1; i < records.length; i++) {
    const prev = records[i - 1];
    const curr = records[i];

    if (curr.previousRecordHash !== prev.evidenceChainHash) {
      return { isValid: false, totalBlocks: records.length, brokenBlockIndex: i };
    }

    const payload = `${prev.evidenceChainHash}:${curr.caseId}:${curr.timestamp}:${curr.inputSha256}:${curr.verdict}:${curr.modelOrKdfInfo}`;
    const expected = await calculateSha256(enc.encode(payload).buffer as ArrayBuffer);

    if (expected !== curr.evidenceChainHash) {
      return { isValid: false, totalBlocks: records.length, brokenBlockIndex: i };
    }
  }

  return { isValid: true, totalBlocks: records.length };
}

/**
 * Applies privacy redaction to a record before export.
 */
export function applyRedaction(record: LedgerRecord, config: RedactionConfig): LedgerRecord {
  return {
    ...record,
    inputFilename: config.stripOriginalFilepaths ? 'REDACTED_ORIGINAL_FILENAME' : record.inputFilename,
    inputSha256: config.stripRawHashes ? `${record.inputSha256.slice(0, 8)}...[REDACTED]` : record.inputSha256,
    redacted: true,
  };
}
