import { RedactionConfig } from './ledger';

export interface ModelRegistryItem {
  id: string;
  name: string;
  version: string;
  weightsHash: string;
  vramUsageMB: number;
  domain: string;
  eerPublished: string;
  sourceUrl: string;
  enabled: boolean;
}

export interface KeyholeSettings {
  // Operational Thresholds
  falsePositiveTolerance: number; // 0.01 to 0.20 (strict vs relaxed)
  falseNegativeTolerance: number; // 0.01 to 0.20
  inconclusiveBufferBand: number; // e.g. 0.15 around decision boundary

  // Hardware Budget
  maxCpuWorkers: number;
  maxVramBudgetMB: number;
  offlineEnforced: boolean;

  // Vault Defaults
  defaultCipher: 'AES-256-GCM' | 'XChaCha20-Poly1305';
  targetKdfDurationMs: number; // 500ms to 1000ms
  keyguardTimeoutMinutes: number; // 15 mins default
  secureEraseOffer: boolean;

  // Privacy & Redaction
  redaction: RedactionConfig;

  // Models
  models: ModelRegistryItem[];
}

export const DEFAULT_SETTINGS: KeyholeSettings = {
  falsePositiveTolerance: 0.05,
  falseNegativeTolerance: 0.05,
  inconclusiveBufferBand: 0.15,
  maxCpuWorkers: 8,
  maxVramBudgetMB: 4096,
  offlineEnforced: true,
  defaultCipher: 'AES-256-GCM',
  targetKdfDurationMs: 750,
  keyguardTimeoutMinutes: 15,
  secureEraseOffer: true,
  redaction: {
    stripOriginalFilepaths: false,
    stripRawHashes: false,
    stripHostDeviceName: true,
    stripUsernames: true,
  },
  models: [
    {
      id: 'umeyama-gan-v2',
      name: 'Umeyama Diffusion/GAN Spectral Classifier',
      version: 'v2.4.1',
      weightsHash: 'sha256:8f4c9102b3c1a8e0f9b1836102df',
      vramUsageMB: 1250,
      domain: 'Synthetic Image Artifacts / Checkerboard FFT',
      eerPublished: '2.4% on FaceForensics++',
      sourceUrl: 'https://registry.keyhole.internal/models/umeyama-v2.onnx',
      enabled: true,
    },
    {
      id: 'dfdc-temporal-net',
      name: 'Temporal FaceForensics++ Spatiotemporal Transformer',
      version: 'v1.8.0',
      weightsHash: 'sha256:7194ab08cf3112d880459c23ea01',
      vramUsageMB: 2100,
      domain: 'Video Frame Coherence, Blink Dynamics, ID Drift',
      eerPublished: '3.1% on DFDC Test Set',
      sourceUrl: 'https://registry.keyhole.internal/models/temporal-dfdc.onnx',
      enabled: true,
    },
    {
      id: 'aasist-vocoder-audio',
      name: 'AASIST-L Graph Neural Anti-Spoofing Model',
      version: 'v3.0.0',
      weightsHash: 'sha256:49c118e7e3198f24419adba3770e',
      vramUsageMB: 740,
      domain: 'Neural Vocoder Seams & Voice Cloning Artifacts',
      eerPublished: '0.89% on ASVspoof 2021 Eval',
      sourceUrl: 'https://registry.keyhole.internal/models/aasist-audio.onnx',
      enabled: true,
    },
  ],
};
