export type SupportedLanguage = 'Tamil' | 'English' | 'Hindi' | 'Malayalam' | 'Telugu';

export interface AcousticFeatures {
  durationSeconds: number;
  sampleRate: number;
  numFrames: number;
  pitch: {
    meanHz: number;
    minHz: number;
    maxHz: number;
    stdDevHz: number;
    jitterPercent: number;
    voicedFramesRatio: number;
    pitchContour: number[];
  };
  spectral: {
    centroidHz: number;
    rolloffHz: number;
    flatness: number;
    flux: number;
    zcr: number;
    energyRms: number;
    hnrDb: number;
  };
  mfcc: {
    meanCoefficients: number[];
    deltaMean: number[];
    heatmap: number[][];
  };
  syntheticMarkers: {
    vocoderArtifactScore: number;
    pitchSmoothnessAnomaly: number;
    spectralDiscontinuityScore: number;
    silenceFloorAnomaly: number;
    highFreqPhaseCoherence: number;
  };
  waveformEnvelope: number[];
}

export interface DetectionResult {
  id?: number;
  filename: string;
  classification: 'AI-Generated' | 'Human-Generated';
  confidence_score: number;
  ai_probability: number;
  human_probability: number;
  detected_language: SupportedLanguage;
  language_confidence: number;
  duration_seconds: number;
  sample_rate: number;
  created_at?: string;
  explanation: {
    verdictSummary: string;
    keyFindings: string[];
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    modelArchitecture: string;
  };
  acoustic_features: AcousticFeatures;
}

export interface PredictionHistoryItem {
  id: number;
  userUid?: string | null;
  filename: string;
  audioFormat: string;
  fileSizeBytes?: number;
  durationSeconds?: string;
  sampleRate?: number;
  detectedLanguage: SupportedLanguage;
  languageConfidence?: string;
  classification: 'AI-Generated' | 'Human-Generated';
  confidenceScore: string;
  aiProbability: string;
  humanProbability: string;
  acousticFeatures?: string;
  modelExplanation?: string;
  source?: string;
  createdAt?: string;
}

export interface ModelBenchmark {
  id: number;
  datasetName: string;
  language: string;
  accuracy: string;
  precision: string;
  recall: string;
  f1Score: string;
  aucRoc: string;
  sampleCount: number;
  createdAt?: string;
}
