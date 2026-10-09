export type MediaType = 'PHOTO' | 'VIDEO' | 'AUDIO';

export type SignalVerdict = 'PASS' | 'FAIL' | 'INCONCLUSIVE';

export interface ForensicSignal {
  id: string;
  category: 'METADATA' | 'PROVENANCE' | 'FREQUENCY_NOISE' | 'TEMPORAL' | 'AUDIO_SPECTRAL' | 'LEARNED_MODEL';
  name: string;
  verdict: SignalVerdict;
  score: number; // 0.0 (fully authentic) to 1.0 (anomalous / synthetic)
  weight: number;
  explanation: string;
  rawMetric?: string;
  commandOrTool: string;
}

export type C2PAStatus =
  | 'VERIFIED AUTHENTIC'
  | 'MANIFEST STRIPPED'
  | 'MANIFEST INVALID'
  | 'NO PROVENANCE DATA — NEITHER CONFIRMS NOR REFUTES';

export interface C2PAManifest {
  status: C2PAStatus;
  issuerIdentity?: string;
  claimGenerator?: string;
  signatureValid: boolean;
  ingredients: {
    title: string;
    format: string;
    hashMatched: boolean;
  }[];
  assertionsCount: number;
  tamperDetails?: string;
}

export interface FrameAnalysis {
  frameIndex: number;
  timestampSec: number;
  anomalyScore: number; // 0.0 to 1.0
  blinkRateEAR?: number;
  headPoseDeviationDeg?: number;
  idEmbeddingDrift?: number;
  heatmapBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    intensity: number;
  };
}

export type AuthenticityVerdict =
  | 'AUTHENTIC-CONSISTENT'
  | 'INCONCLUSIVE'
  | 'MANIPULATION-INDICATORS-DETECTED';

export interface AuthenticityResult {
  caseId: string;
  filename: string;
  mediaType: MediaType;
  fileSizeBytes: number;
  sha256: string;
  analyzedAt: string;
  verdict: AuthenticityVerdict;
  calibratedScore: number; // 0.0 to 1.0 (manipulation likelihood)
  uncertaintyBand: {
    lower: number;
    upper: number;
  };
  provenance: C2PAManifest;
  signals: ForensicSignal[];
  timeline: FrameAnalysis[];
  counterEvidence: {
    explanation: string;
    likelihood: 'HIGH' | 'MODERATE' | 'LOW';
    plausibilityReason: string;
  }[];
  loadedModels: {
    name: string;
    version: string;
    weightsHash: string;
    domain: string;
    score: number;
  }[];
  disclaimer: string;
}
