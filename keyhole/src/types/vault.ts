export type CipherSuite = 'AES-256-GCM' | 'XChaCha20-Poly1305';

export type KdfAlgorithm = 'Argon2id' | 'scrypt' | 'PBKDF2-HMAC-SHA512';

export interface KdfParameters {
  algorithm: KdfAlgorithm;
  memoryKiB: number; // e.g. 65536 (64MB)
  iterations: number; // e.g. 3 for Argon2id, 600000 for PBKDF2
  parallelism: number; // e.g. 4
  saltHex: string;
}

export interface KeyholeHeader {
  magic: string; // "KEYH" (0x4B455948)
  version: number; // 1
  containerId: string; // UUID v4
  cipher: CipherSuite;
  kdf: KdfParameters;
  chunkSizeBytes: number; // 65536
  totalPlaintextBytes: number;
  totalChunks: number;
  wrappedDekHex: string; // DEK wrapped by derived Master Key via AES-KW or AEAD
  wrappedDekNonceHex: string;
  merkleRootHash: string; // SHA-256 root over chunk tags
}

export interface ChunkVerification {
  chunkIndex: number;
  offsetStart: number;
  offsetEnd: number;
  tagValid: boolean;
  sha256: string;
  errorDetail?: string;
}

export interface SealedFileEntry {
  path: string;
  sizeBytes: number;
  sha256Original: string;
  modifiedTimestamp: string;
}

export interface VaultStoreItem {
  id: string;
  name: string;
  sizeBytes: number;
  sealedAt: string;
  cipher: CipherSuite;
  kdfAlgorithm: KdfAlgorithm;
  kdfIterations: number;
  chunkCount: number;
  integrityStatus: 'VERIFIED' | 'TAMPER_DETECTED' | 'UNCHECKED';
  tamperChunkIndex?: number;
  blobData?: Uint8Array;
}
