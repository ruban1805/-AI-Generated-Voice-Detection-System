import { db } from './index.ts';
import { predictions, modelBenchmarks } from './schema.ts';
import { eq, desc, and } from 'drizzle-orm';

export interface InsertPredictionParams {
  userUid?: string | null;
  filename: string;
  audioFormat: string;
  fileSizeBytes?: number;
  durationSeconds?: string;
  sampleRate?: number;
  detectedLanguage: string;
  languageConfidence?: string;
  classification: 'AI-Generated' | 'Human-Generated';
  confidenceScore: string;
  aiProbability: string;
  humanProbability: string;
  acousticFeatures?: string;
  modelExplanation?: string;
  source?: string;
}

export async function createPredictionRecord(params: InsertPredictionParams) {
  try {
    const result = await db
      .insert(predictions)
      .values({
        userUid: params.userUid || null,
        filename: params.filename,
        audioFormat: params.audioFormat,
        fileSizeBytes: params.fileSizeBytes || null,
        durationSeconds: params.durationSeconds || null,
        sampleRate: params.sampleRate || null,
        detectedLanguage: params.detectedLanguage,
        languageConfidence: params.languageConfidence || null,
        classification: params.classification,
        confidenceScore: params.confidenceScore,
        aiProbability: params.aiProbability,
        humanProbability: params.humanProbability,
        acousticFeatures: params.acousticFeatures || null,
        modelExplanation: params.modelExplanation || null,
        source: params.source || 'file_upload',
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database insert prediction failed:', error);
    throw new Error('Failed to record prediction in database', { cause: error });
  }
}

export async function getPredictionsHistory(options?: {
  userUid?: string;
  language?: string;
  classification?: string;
  limit?: number;
}) {
  try {
    const conditions = [];

    if (options?.userUid) {
      conditions.push(eq(predictions.userUid, options.userUid));
    }
    if (options?.language && options.language !== 'all') {
      conditions.push(eq(predictions.detectedLanguage, options.language));
    }
    if (options?.classification && options.classification !== 'all') {
      conditions.push(eq(predictions.classification, options.classification));
    }

    const query = db
      .select()
      .from(predictions)
      .orderBy(desc(predictions.createdAt))
      .limit(options?.limit || 50);

    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }

    return await query;
  } catch (error) {
    console.error('Database query predictions failed:', error);
    throw new Error('Failed to query predictions from database', { cause: error });
  }
}

export async function getPredictionById(id: number) {
  try {
    const result = await db
      .select()
      .from(predictions)
      .where(eq(predictions.id, id))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error('Database query prediction by id failed:', error);
    throw new Error('Failed to fetch prediction details', { cause: error });
  }
}

export async function deletePredictionRecord(id: number) {
  try {
    const result = await db
      .delete(predictions)
      .where(eq(predictions.id, id))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error('Database delete prediction failed:', error);
    throw new Error('Failed to delete prediction record', { cause: error });
  }
}

export async function getModelBenchmarks() {
  try {
    return await db.select().from(modelBenchmarks);
  } catch (error) {
    console.error('Database query model benchmarks failed:', error);
    throw new Error('Failed to fetch model benchmarks', { cause: error });
  }
}
