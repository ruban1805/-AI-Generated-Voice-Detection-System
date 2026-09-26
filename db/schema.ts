import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'predictions' table
export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid'),
  filename: text('filename').notNull(),
  audioFormat: text('audio_format').notNull(),
  fileSizeBytes: integer('file_size_bytes'),
  durationSeconds: text('duration_seconds'),
  sampleRate: integer('sample_rate'),
  detectedLanguage: text('detected_language').notNull(),
  languageConfidence: text('language_confidence'),
  classification: text('classification').notNull(), // 'AI-Generated' | 'Human-Generated'
  confidenceScore: text('confidence_score').notNull(), // e.g. "0.965"
  aiProbability: text('ai_probability').notNull(),
  humanProbability: text('human_probability').notNull(),
  acousticFeatures: text('acoustic_features'), // JSON stringified features (MFCCs, spectral, pitch, etc.)
  modelExplanation: text('model_explanation'),
  source: text('source'), // 'file_upload' | 'base64' | 'sample' | 'microphone'
  createdAt: timestamp('created_at').defaultNow(),
});

// Model benchmark metrics table
export const modelBenchmarks = pgTable('model_benchmarks', {
  id: serial('id').primaryKey(),
  datasetName: text('dataset_name').notNull(),
  language: text('language').notNull(),
  accuracy: text('accuracy').notNull(),
  precision: text('precision').notNull(),
  recall: text('recall').notNull(),
  f1Score: text('f1_score').notNull(),
  aucRoc: text('auc_roc').notNull(),
  sampleCount: integer('sample_count').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
