// OpenAPI 3.0 Specification Schema
export const openApiSchema = {
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

// Swagger UI Interactive API Documentation Page
export const swaggerHtml = `<!DOCTYPE html>
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
</html>`;
