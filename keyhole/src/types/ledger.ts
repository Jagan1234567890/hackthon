export interface LedgerRecord {
  caseId: string;
  timestamp: string;
  kind: 'AUTHENTICITY_INSPECTION' | 'VAULT_SEAL' | 'VAULT_UNSEAL' | 'RECOVERY_LADDER';
  inputFilename: string;
  inputSha256: string;
  verdict: string;
  scoreOrConfidence: string;
  modelOrKdfInfo: string;
  evidenceChainHash: string; // SHA-256 over all findings and previous block hash
  previousRecordHash: string; // Merkle link to previous case
  redacted: boolean;
}

export interface RedactionConfig {
  stripOriginalFilepaths: boolean;
  stripRawHashes: boolean;
  stripHostDeviceName: boolean;
  stripUsernames: boolean;
}
