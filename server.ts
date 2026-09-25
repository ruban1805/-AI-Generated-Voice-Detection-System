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
} from './src/db/predictions.ts';
import { SAMPLE_AUDIO_DATABASE } from './src/services/sampleLibrary.ts';
import { optionalAuth, AuthRequest } from './src/middleware/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body Parsers (support large audio files and Base64 audio payloads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer memory storage for audio upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter: (_req, file, cb) => {
    // Accept standard audio formats
    if (file.mimetype.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Please upload an MP3, WAV, M4A, or OGG audio file.'));
    }
  },
});

// OpenAPI 3.0 Specification Schema
const openApiSchema = {
  openapi: '3.0.3',
  info: {
    title: 'VocalGuard - Multilingual AI Voice Detection API',
    version: '2.0.0',
    description:
      'FastAPI-compatible REST API for biometric audio forensic analysis and synthetic deepfake speech detection. Supports Tamil, English, Hindi, Malayalam, and Telugu audio via binary file upload and Base64 encoding.',
    contact: {
      name: 'VocalGuard Security & Forensics Team',
      url: 'https://github.com/vocalguard',
    },
  },
  servers: [{ url: '/', description: 'Active Server' }],
  paths: {
    '/api/predict': {
      post: {
        summary: 'Detect AI vs Human Voice (File Upload)',
        description: 'Upload an MP3, WAV, or OGG audio file for acoustic feature extraction and synthetic voice classification.',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  audio_file: { type: 'string', format: 'binary', description: 'Audio file (MP3, WAV, OGG, etc.)' },
                  language_hint: {
                    type: 'string',
                    enum: ['Tamil', 'English', 'Hindi', 'Malayalam', 'Telugu', 'Auto-Detect'],
                    default: 'Auto-Detect',
                    description: 'Optional expected language',
                  },
                },
                required: ['audio_file'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Successful Analysis', content: { 'application/json': { schema: { $ref: '#/components/schemas/DetectionResponse' } } } },
          400: { description: 'Bad Request / Invalid Audio' },
          500: { description: 'Internal Processing Error' },
        },
      },
    },
    '/api/predict/base64': {
      post: {
        summary: 'Detect AI vs Human Voice (Base64 JSON)',
        description: 'Submit Base64-encoded audio (with or without data URI prefix) for classification.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  audio_base64: { type: 'string', description: 'Raw Base64 string or data:audio/...;base64 string' },
                  language_hint: { type: 'string', enum: ['Tamil', 'English', 'Hindi', 'Malayalam', 'Telugu', 'Auto-Detect'] },
                  filename: { type: 'string', default: 'audio_payload.wav' },
                },
                required: ['audio_base64'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Successful Analysis', content: { 'application/json': { schema: { $ref: '#/components/schemas/DetectionResponse' } } } },
          400: { description: 'Bad Request' },
        },
      },
    },
    '/api/history': {
      get: {
        summary: 'Get Prediction History',
        description: 'Fetch historical prediction logs persisted in PostgreSQL.',
        parameters: [
          { name: 'language', in: 'query', schema: { type: 'string' }, description: 'Filter by language' },
          { name: 'classification', in: 'query', schema: { type: 'string' }, description: 'Filter by AI-Generated or Human-Generated' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Maximum records to return' },
        ],
        responses: {
          200: { description: 'List of predictions' },
        },
      },
    },
    '/api/benchmarks': {
      get: {
        summary: 'Model Evaluation Benchmarks',
        description: 'Retrieve model evaluation metrics across Tamil, English, Hindi, Malayalam, and Telugu.',
        responses: {
          200: { description: 'Evaluation benchmarks' },
        },
      },
    },
    '/api/samples': {
      get: {
        summary: 'Get Sample Test Library',
        description: 'List pre-packaged Human and AI audio clips for instant testing.',
        responses: {
          200: { description: 'Preloaded sample clips' },
        },
      },
    },
  },
  components: {
    schemas: {
      DetectionResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          filename: { type: 'string' },
          classification: { type: 'string', enum: ['AI-Generated', 'Human-Generated'] },
          confidence_score: { type: 'number' },
          ai_probability: { type: 'number' },
          human_probability: { type: 'number' },
          detected_language: { type: 'string' },
          language_confidence: { type: 'number' },
          duration_seconds: { type: 'number' },
          sample_rate: { type: 'integer' },
          explanation: { type: 'object' },
          acoustic_features: { type: 'object' },
        },
      },
    },
  },
};

// Serve OpenAPI Specification JSON
app.get('/openapi.json', (_req, res) => {
  res.json(openApiSchema);
});

// Swagger UI Interactive API Documentation Route
app.get(['/docs', '/api/docs'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>VocalGuard API Documentation & Explorer</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui.css">
  <style>
    body { margin: 0; background: #0f172a; font-family: system-ui, sans-serif; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui { background: #0f172a; color: #e2e8f0; }
    .swagger-ui .info .title { color: #38bdf8; }
    .swagger-ui .scheme-container { background: #1e293b; }
    .swagger-ui .opblock { border-radius: 8px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
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

// API Prediction: File Upload (MP3, WAV, etc.)
app.post(
  '/api/predict',
  optionalAuth,
  upload.fields([
    { name: 'audio_file', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  async (req: AuthRequest, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedFile = files?.audio_file?.[0] || files?.file?.[0];

      if (!uploadedFile) {
        return res.status(400).json({ error: 'No audio file provided. Please upload an audio file.' });
      }

      const languageHint = req.body.language_hint && req.body.language_hint !== 'Auto-Detect'
        ? req.body.language_hint
        : undefined;

      // Extract acoustic and forensic features
      const result = analyzeAudioBuffer(uploadedFile.buffer, languageHint, uploadedFile.originalname);

      // Save to PostgreSQL
      let savedRecord = null;
      try {
        savedRecord = await createPredictionRecord({
          userUid: req.user?.uid || null,
          filename: uploadedFile.originalname || 'uploaded_audio.mp3',
          audioFormat: path.extname(uploadedFile.originalname || 'mp3').replace('.', '') || 'mp3',
          fileSizeBytes: uploadedFile.size,
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
          source: 'file_upload',
        });
      } catch (dbError) {
        console.error('Database save error (non-fatal):', dbError);
      }

      return res.json({
        id: savedRecord?.id || Math.floor(Math.random() * 100000),
        filename: uploadedFile.originalname,
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
app.post('/api/predict/base64', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { audio_base64, language_hint, filename } = req.body;

    if (!audio_base64 || typeof audio_base64 !== 'string') {
      return res.status(400).json({ error: 'Missing audio_base64 field in request body.' });
    }

    // Clean Base64 prefix if present (e.g. data:audio/mp3;base64,...)
    const cleanBase64 = audio_base64.replace(/^data:audio\/[^;]+;base64,/, '').trim();
    const audioBuffer = Buffer.from(cleanBase64, 'base64');

    if (audioBuffer.length === 0) {
      return res.status(400).json({ error: 'Decoded audio buffer is empty.' });
    }

    const lang = language_hint && language_hint !== 'Auto-Detect' ? language_hint : undefined;
    const result = analyzeAudioBuffer(audioBuffer, lang, filename || 'base64_audio_sample.wav');

    // Persist to PostgreSQL
    let savedRecord = null;
    try {
      savedRecord = await createPredictionRecord({
        userUid: req.user?.uid || null,
        filename: filename || 'base64_audio_sample.wav',
        audioFormat: 'base64',
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
        source: 'base64',
      });
    } catch (dbError) {
      console.error('Database save error (non-fatal):', dbError);
    }

    return res.json({
      id: savedRecord?.id || Math.floor(Math.random() * 100000),
      filename: filename || 'base64_audio_sample.wav',
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
