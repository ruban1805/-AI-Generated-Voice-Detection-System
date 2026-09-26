import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeAudioBuffer } from './src/services/audioDSPForetics.ts';
import {
  createPredictionRecord,
  getPredictionsHistory,
  getPredictionById,
  deletePredictionRecord,
  getModelBenchmarks,
} from './db/queries.ts';
import { SAMPLE_AUDIO_DATABASE } from './src/services/sampleLibrary.ts';
import { optionalAuth, type AuthRequest } from './src/middleware/auth.ts';
import { openApiSchema, swaggerHtml } from './src/services/apiDocs.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// CORS Preflight & Headers (essential for mobile WebKit, cross-origin iframes & preview URLs)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Body Parsers (support large audio files and Base64 audio payloads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for audio upload - permissive filter for mobile iOS/Android containers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Serve OpenAPI Specification JSON
app.get('/openapi.json', (_req, res) => {
  res.json(openApiSchema);
});

// Swagger UI Interactive API Documentation Route
app.get(['/docs', '/api/docs'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHtml);
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    system: 'VocalGuard AI-Generated Voice Detection System',
    timestamp: new Date().toISOString(),
    supported_languages: ['Tamil', 'English', 'Hindi', 'Malayalam', 'Telugu'],
    features: ['MFCC-13', 'Pitch-F0', 'Spectral Centroid', 'Rolloff', 'Flatness', 'Flux', 'ZCR', 'HNR'],
  });
});

// Preloaded Audio Samples
app.get('/api/samples', (_req, res) => {
  res.json(SAMPLE_AUDIO_DATABASE);
});

// Model Evaluation Benchmarks
app.get('/api/benchmarks', async (_req, res) => {
  try {
    const benchmarks = await getModelBenchmarks();
    res.json(benchmarks);
  } catch (error: any) {
    console.error('Error fetching benchmarks:', error);
    res.status(500).json({ error: 'Failed to fetch model benchmarks' });
  }
});

// API Prediction: File Upload (MP3, WAV, etc.) & Universal Fallback
app.post(
  ['/api/predict', '/api/predict/'],
  optionalAuth,
  upload.any(),
  async (req: AuthRequest, res) => {
    try {
      // 1. Check if multipart audio file was provided
      let uploadedBuffer: Buffer | null = null;
      let filename = 'audio_recording.wav';
      let fileSize = 0;

      const files = req.files as Express.Multer.File[] | { [key: string]: Express.Multer.File[] } | undefined;
      let foundFile: Express.Multer.File | undefined;

      if (Array.isArray(files) && files.length > 0) {
        foundFile = files[0];
      } else if (files && typeof files === 'object') {
        const fileList = Object.values(files).flat();
        if (fileList.length > 0) {
          foundFile = fileList[0];
        }
      }

      if (foundFile) {
        uploadedBuffer = foundFile.buffer;
        filename = foundFile.originalname || filename;
        fileSize = foundFile.size;
      } else if (req.body?.audio_base64 && typeof req.body.audio_base64 === 'string') {
        // Fallback: Check if base64 audio payload was sent directly in JSON body
        const cleanBase64 = req.body.audio_base64.replace(/^data:[^;]+;base64,/, '').trim();
        uploadedBuffer = Buffer.from(cleanBase64, 'base64');
        filename = req.body.filename || filename;
        fileSize = uploadedBuffer.length;
      }

      if (!uploadedBuffer || uploadedBuffer.length === 0) {
        return res.status(400).json({ error: 'No audio data received. Please record or upload an audio file.' });
      }

      const languageHint = req.body?.language_hint && req.body.language_hint !== 'Auto-Detect'
        ? req.body.language_hint
        : undefined;

      // Extract acoustic and forensic features
      const result = analyzeAudioBuffer(uploadedBuffer, languageHint, filename);

      // Save to PostgreSQL
      let savedRecord = null;
      try {
        savedRecord = await createPredictionRecord({
          userUid: req.user?.uid || null,
          filename: filename,
          audioFormat: path.extname(filename).replace('.', '') || 'wav',
          fileSizeBytes: fileSize,
          durationSeconds: result.acousticFeatures.durationSeconds.toString(),
          sampleRate: result.acousticFeatures.sampleRate,
          detectedLanguage: result.detectedLanguage,
          languageConfidence: result.languageConfidence.toString(),
          classification: result.classification,
          confidenceScore: result.confidenceScore.toString(),
          aiProbability: result.aiProbability.toString(),
          humanProbability: result.humanProbability.toString(),
          acousticFeatures: JSON.stringify(result.acousticFeatures),
          modelExplanation: JSON.stringify(result.explanation),
          source: foundFile ? 'file_upload' : 'mobile_recording',
        });
      } catch (dbError) {
        console.error('Database save error (non-fatal):', dbError);
      }

      return res.json({
        id: savedRecord?.id || Math.floor(Math.random() * 100000),
        filename: filename,
        classification: result.classification,
        confidence_score: result.confidenceScore,
        ai_probability: result.aiProbability,
        human_probability: result.humanProbability,
        detected_language: result.detectedLanguage,
        language_confidence: result.languageConfidence,
        duration_seconds: result.acousticFeatures.durationSeconds,
        sample_rate: result.acousticFeatures.sampleRate,
        explanation: result.explanation,
        acoustic_features: result.acousticFeatures,
        created_at: savedRecord?.createdAt || new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Prediction error:', error);
      return res.status(500).json({ error: error.message || 'Error processing audio file' });
    }
  }
);

// API Prediction: Base64 Audio Input
app.post(['/api/predict/base64', '/api/predict/base64/'], optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { audio_base64, language_hint, filename } = req.body;

    if (!audio_base64 || typeof audio_base64 !== 'string') {
      return res.status(400).json({ error: 'Missing audio_base64 field in request body.' });
    }

    // Clean Base64 prefix if present (e.g. data:audio/mp3;base64, data:audio/wav;base64, etc.)
    const cleanBase64 = audio_base64.replace(/^data:[^;]+;base64,/, '').trim();
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Decoded audio buffer is empty.' });
    }

    const lang = language_hint && language_hint !== 'Auto-Detect' ? language_hint : undefined;
    const fname = filename || 'recording.wav';
    const result = analyzeAudioBuffer(audioBuffer, lang, fname);

    // Persist to PostgreSQL
    let savedRecord = null;
    try {
      savedRecord = await createPredictionRecord({
        userUid: req.user?.uid || null,
        filename: fname,
        audioFormat: 'wav',
        fileSizeBytes: audioBuffer.length,
        durationSeconds: result.acousticFeatures.durationSeconds.toString(),
        sampleRate: result.acousticFeatures.sampleRate,
        detectedLanguage: result.detectedLanguage,
        languageConfidence: result.languageConfidence.toString(),
        classification: result.classification,
        confidenceScore: result.confidenceScore.toString(),
        aiProbability: result.aiProbability.toString(),
        humanProbability: result.humanProbability.toString(),
        acousticFeatures: JSON.stringify(result.acousticFeatures),
        modelExplanation: JSON.stringify(result.explanation),
        source: 'mobile_recording_base64',
      });
    } catch (dbError) {
      console.error('Database save error (non-fatal):', dbError);
    }

    return res.json({
      id: savedRecord?.id || Math.floor(Math.random() * 100000),
      filename: fname,
      classification: result.classification,
      confidence_score: result.confidenceScore,
      ai_probability: result.aiProbability,
      human_probability: result.humanProbability,
      detected_language: result.detectedLanguage,
      language_confidence: result.languageConfidence,
      duration_seconds: result.acousticFeatures.durationSeconds,
      sample_rate: result.acousticFeatures.sampleRate,
      explanation: result.explanation,
      acoustic_features: result.acousticFeatures,
      created_at: savedRecord?.createdAt || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Base64 processing error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process Base64 audio' });
  }
});

// API: Get Prediction History from PostgreSQL
app.get('/api/history', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { language, classification, limit } = req.query;
    const history = await getPredictionsHistory({
      userUid: req.user?.uid,
      language: language as string,
      classification: classification as string,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    res.json(history);
  } catch (error: any) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve prediction history' });
  }
});

// API: Get Single Prediction Detail
app.get('/api/history/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prediction ID' });
    }
    const item = await getPredictionById(id);
    if (!item) {
      return res.status(404).json({ error: 'Prediction not found' });
    }
    return res.json(item);
  } catch (error: any) {
    console.error('Fetch detail error:', error);
    return res.status(500).json({ error: 'Failed to retrieve prediction details' });
  }
});

// API: Delete Prediction Record
app.delete('/api/history/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prediction ID' });
    }
    const deleted = await deletePredictionRecord(id);
    return res.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete prediction record' });
  }
});

// API: Catch-all JSON 404 handler for any unhandled /api routes
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found. Please check method or route path.' });
});

// Development vs Production Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VocalGuard Voice Detection Server active on http://0.0.0.0:${PORT}`);
    console.log(`Interactive API Docs available at http://0.0.0.0:${PORT}/docs`);
  });
}

startServer();
