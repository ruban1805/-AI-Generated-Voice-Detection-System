import React, { useState } from 'react';
import {
  Code,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Play,
  FileCode,
  Sparkles,
} from 'lucide-react';

export const ApiDocumentation: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<'upload' | 'base64'>('base64');
  const [activeLang, setActiveLang] = useState<'curl' | 'python' | 'javascript'>('curl');
  const [copied, setCopied] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  const curlBase64 = `curl -X POST "${baseUrl}/api/predict/base64" \\
  -H "Content-Type: application/json" \\
  -d '{
    "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA...",
    "language_hint": "Tamil",
    "filename": "speech_sample.wav"
  }'`;

  const curlUpload = `curl -X POST "${baseUrl}/api/predict" \\
  -F "audio_file=@/path/to/recording.mp3" \\
  -F "language_hint=Auto-Detect"`;

  const pythonBase64 = `import requests

url = "${baseUrl}/api/predict/base64"
payload = {
    "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA...",
    "language_hint": "Hindi",
    "filename": "speech_sample.wav"
}
response = requests.post(url, json=payload)
data = response.json()

print(f"Classification: {data['classification']}")
print(f"Confidence: {data['confidence_score'] * 100:.1f}%")
print(f"Detected Language: {data['detected_language']}")`;

  const pythonUpload = `import requests

url = "${baseUrl}/api/predict"
with open("speech.mp3", "rb") as f:
    files = {"audio_file": ("speech.mp3", f, "audio/mpeg")}
    data = {"language_hint": "English"}
    response = requests.post(url, files=files, data=data)

print(response.json())`;

  const jsBase64 = `const response = await fetch("${baseUrl}/api/predict/base64", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    audio_base64: "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA...",
    language_hint: "Telugu",
    filename: "speech_sample.wav"
  })
});

const result = await response.json();
console.log(result.classification, result.confidence_score);`;

  const getCodeSnippet = () => {
    if (activeEndpoint === 'base64') {
      if (activeLang === 'curl') return curlBase64;
      if (activeLang === 'python') return pythonBase64;
      return jsBase64;
    } else {
      if (activeLang === 'curl') return curlUpload;
      if (activeLang === 'python') return pythonUpload;
      return `const formData = new FormData();
formData.append("audio_file", fileInput.files[0]);
formData.append("language_hint", "Auto-Detect");

const res = await fetch("${baseUrl}/api/predict", {
  method: "POST",
  body: formData
});
const data = await res.json();`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLiveTest = async () => {
    setLoadingTest(true);
    setApiResponse(null);

    try {
      // Test the base64 endpoint with a minimal dummy audio payload
      const dummyBase64 = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      const res = await fetch('/api/predict/base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio_base64: dummyBase64,
          language_hint: 'English',
          filename: 'api_test_payload.wav',
        }),
      });

      const json = await res.json();
      setApiResponse(JSON.stringify(json, null, 2));
    } catch (err: any) {
      setApiResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoadingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Swagger UI Link */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">FastAPI-Compatible REST API</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Programmatic endpoints for Base64 payloads and binary audio uploads with OpenAPI 3.0 specification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Open Interactive Swagger UI
          </a>
        </div>
      </div>

      {/* Endpoint Selector */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveEndpoint('base64')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeEndpoint === 'base64'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          POST /api/predict/base64 (JSON)
        </button>

        <button
          onClick={() => setActiveEndpoint('upload')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition ${
            activeEndpoint === 'upload'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          POST /api/predict (Multipart Form)
        </button>
      </div>

      {/* Code Snippet Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                activeLang === 'curl' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveLang('python')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                activeLang === 'python' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveLang('javascript')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition ${
                activeLang === 'javascript' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              JavaScript
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLiveTest}
              disabled={loadingTest}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <Play className="w-3 h-3 fill-current" />
              {loadingTest ? 'Executing...' : 'Try It Out'}
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto">
          <code>{getCodeSnippet()}</code>
        </pre>
      </div>

      {/* Live Response Panel */}
      {apiResponse && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live API Response (Status: 200 OK)</span>
            </div>
            <button
              onClick={() => setApiResponse(null)}
              className="text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-80 p-2">
            <code>{apiResponse}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
