import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileCode,
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileAudio,
  Languages,
  Clock,
  HardDrive,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Volume2,
  Smartphone,
} from 'lucide-react';
import { DetectionResult, SupportedLanguage } from '../types/index.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import { ForensicCharts } from './ForensicCharts.tsx';
import {
  convertBlobToWav,
  blobToBase64,
  getOptimalRecorderMimeType,
} from '../utils/audioEncoder.ts';
import { getApiUrl } from '../utils/api.ts';

interface DetectionStudioProps {
  onPredictionComplete?: (result: DetectionResult) => void;
  authToken?: string | null;
}

export const DetectionStudio: React.FC<DetectionStudioProps> = ({
  onPredictionComplete,
  authToken,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'base64' | 'record' | 'samples'>('samples');
  const [languageHint, setLanguageHint] = useState<string>('Auto-Detect');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64Input, setBase64Input] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<DetectionResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<any[]>([]);
  const [liveAudioLevels, setLiveAudioLevels] = useState<number[]>(new Array(20).fill(10));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load sample audio library from backend
  useEffect(() => {
    fetch(getApiUrl('/api/samples'))
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSamples(data);
        }
      })
      .catch((err) => console.log('Samples fetch error:', err));
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setError(null);
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Microphone recording with real-time audio visualization
  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Connect real-time Web Audio Analyser for live visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
        }
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateLevels = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          // Sample 24 frequency bars for visualizer
          const sampled = Array.from({ length: 24 }, (_, i) => {
            const val = dataArray[i * 2] || 0;
            return Math.max(10, Math.min(100, Math.round((val / 255) * 100)));
          });
          setLiveAudioLevels(sampled);
          animFrameRef.current = requestAnimationFrame(updateLevels);
        };
        updateLevels();
      }

      audioChunksRef.current = [];
      const mimeType = getOptimalRecorderMimeType();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        const effectiveMime = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const rawBlob = new Blob(audioChunksRef.current, { type: effectiveMime });

        // Normalize to standard 16kHz WAV for maximum acoustic forensic accuracy
        const normalizedWav = await convertBlobToWav(rawBlob);
        setRecordedBlob(normalizedWav);

        if (audioUrl && audioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl);
        }
        const url = URL.createObjectURL(normalizedWav);
        setAudioUrl(url);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setError('Microphone access was denied or is unavailable on this device. On iOS Safari, please check Settings > Safari > Microphone. On Chrome/Android, tap the site permissions icon in your address bar.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  // Submit file upload to API (with resilient multipart + base64 fallback)
  const analyzeFile = async () => {
    if (!selectedFile) {
      setError('Please select an audio file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Try Base64 JSON first as it is 100% resilient across mobile Safari & proxies
      const base64String = await blobToBase64(selectedFile);
      const res = await fetch(getApiUrl('/api/predict/base64'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({
          audio_base64: base64String,
          language_hint: languageHint !== 'Auto-Detect' ? languageHint : undefined,
          filename: selectedFile.name,
        }),
      });

      if (!res.ok) {
        // Fallback to multipart /api/predict
        const formData = new FormData();
        formData.append('audio_file', selectedFile);
        if (languageHint && languageHint !== 'Auto-Detect') {
          formData.append('language_hint', languageHint);
        }
        const fallbackRes = await fetch(getApiUrl('/api/predict'), {
          method: 'POST',
          headers,
          body: formData,
        });

        if (!fallbackRes.ok) {
          const errJson = await fallbackRes.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with status ${fallbackRes.status}`);
        }
        const result: DetectionResult = await fallbackRes.json();
        setCurrentResult(result);
        if (onPredictionComplete) onPredictionComplete(result);
        return;
      }

      const result: DetectionResult = await res.json();
      setCurrentResult(result);
      if (onPredictionComplete) onPredictionComplete(result);
    } catch (err: any) {
      console.error('File analysis error:', err);
      setError(err.message || 'Failed to analyze audio.');
    } finally {
      setLoading(false);
    }
  };

  // Specialized Analyzer for Microphone Recording (guaranteed mobile iOS & Android compatibility)
  const analyzeRecording = async () => {
    if (!recordedBlob) {
      setError('Please record your voice first before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert recorded WAV blob to Base64
      const base64Data = await blobToBase64(recordedBlob);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(getApiUrl('/api/predict/base64'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audio_base64: base64Data,
          language_hint: languageHint !== 'Auto-Detect' ? languageHint : undefined,
          filename: 'live_mic_recording.wav',
        }),
      });

      if (!res.ok) {
        // Fallback to /api/predict multipart
        const formData = new FormData();
        formData.append('audio_file', recordedBlob, 'live_mic_recording.wav');
        if (languageHint && languageHint !== 'Auto-Detect') {
          formData.append('language_hint', languageHint);
        }
        const fbHeaders: Record<string, string> = {};
        if (authToken) fbHeaders['Authorization'] = `Bearer ${authToken}`;

        const fbRes = await fetch(getApiUrl('/api/predict'), {
          method: 'POST',
          headers: fbHeaders,
          body: formData,
        });

        if (!fbRes.ok) {
          const errJson = await fbRes.json().catch(() => ({}));
          throw new Error(errJson.error || `Analysis failed with status ${fbRes.status}`);
        }

        const result: DetectionResult = await fbRes.json();
        setCurrentResult(result);
        if (onPredictionComplete) onPredictionComplete(result);
        return;
      }

      const result: DetectionResult = await res.json();
      setCurrentResult(result);
      if (onPredictionComplete) onPredictionComplete(result);
    } catch (err: any) {
      console.error('Recording analysis error:', err);
      setError(err.message || 'Failed to process voice recording.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Base64 to API
  const analyzeBase64 = async () => {
    if (!base64Input.trim()) {
      setError('Please enter a Base64-encoded audio string.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanBase64 = base64Input.replace(/^data:audio\/[^;]+;base64,/, '').trim();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(getApiUrl('/api/predict/base64'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          audio_base64: cleanBase64,
          language_hint: languageHint !== 'Auto-Detect' ? languageHint : undefined,
          filename: 'base64_payload.wav',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error (${res.status})`);
      }

      const result: DetectionResult = await res.json();
      setCurrentResult(result);

      // Create playback URL for base64
      const mime = base64Input.startsWith('data:audio')
        ? base64Input.split(';')[0].replace('data:', '')
        : 'audio/wav';
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(URL.createObjectURL(blob));

      if (onPredictionComplete) onPredictionComplete(result);
    } catch (err: any) {
      console.error('Base64 analysis error:', err);
      setError(err.message || 'Invalid Base64 audio payload.');
    } finally {
      setLoading(false);
    }
  };

  // Load a pre-packaged test sample
  const handleSelectSample = (sample: any) => {
    setError(null);
    setLanguageHint(sample.language);
    setBase64Input(sample.audioBase64);

    // Set audio playback
    const byteCharacters = atob(sample.audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(URL.createObjectURL(blob));

    // Automatically trigger analysis
    setLoading(true);
    fetch(getApiUrl('/api/predict/base64'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: sample.audioBase64,
        language_hint: sample.language,
        filename: `${sample.id}.wav`,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrentResult(data);
        if (onPredictionComplete) onPredictionComplete(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Language Selector */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-slate-900/90 border border-slate-700/60 rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 backdrop-blur-md shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Indic &amp; Global Biometric Voice Engine
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-slate-800/80 text-emerald-400 border border-slate-700/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                PostgreSQL Connected
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Voice &amp; Deepfake Speech Detection Lab
            </h2>
            <p className="text-sm text-slate-300/80 mt-1.5 max-w-2xl leading-relaxed">
              Extracts 13 MFCC coefficients, fundamental pitch jitter, spectral envelope, and neural vocoder phase signatures across Tamil, English, Hindi, Malayalam, and Telugu.
            </p>
          </div>

          {/* Language Hint Selection */}
          <div className="flex items-center gap-2.5 bg-slate-950/90 p-2.5 rounded-2xl border border-slate-700/70 shadow-lg backdrop-blur-md">
            <Languages className="w-4 h-4 text-indigo-400 ml-1.5" />
            <div className="text-xs font-medium text-slate-400">Language:</div>
            <select
              value={languageHint}
              onChange={(e) => setLanguageHint(e.target.value)}
              className="bg-slate-900/90 text-sm font-semibold text-slate-200 border border-slate-700/80 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-400 transition"
            >
              <option value="Auto-Detect">Auto-Detect Language</option>
              <option value="Tamil">Tamil (தமிழ்)</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Malayalam">Malayalam (മലയാളം)</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Input Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setInputMode('samples')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-medium text-sm transition ${
            inputMode === 'samples'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Preloaded Library
        </button>

        <button
          onClick={() => setInputMode('upload')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-medium text-sm transition ${
            inputMode === 'upload'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload MP3/Audio
        </button>

        <button
          onClick={() => setInputMode('base64')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-medium text-sm transition ${
            inputMode === 'base64'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Base64 Payload
        </button>

        <button
          onClick={() => setInputMode('record')}
          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-medium text-sm transition ${
            inputMode === 'record'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
              : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          Microphone Record
        </button>
      </div>

      {/* Input Panels */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Preloaded Samples Tab */}
        {inputMode === 'samples' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-base">
                  Pre-Packaged Multilingual Acoustic Library
                </h3>
                <p className="text-xs text-slate-400">
                  Instant 1-click verification of Human versus AI voice across Tamil, English, Hindi, Malayalam, and Telugu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {samples.map((sample) => {
                const isAiTruth = sample.groundTruth === 'AI-Generated';
                return (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-semibold text-sm text-slate-200 group-hover:text-indigo-400 transition">
                          {sample.title}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            isAiTruth
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {isAiTruth ? 'AI Generated' : 'Human Voice'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {sample.description}
                      </p>
                      <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-1">
                        "{sample.transcript}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900 text-[11px] text-slate-500">
                      <span>{sample.durationSeconds}s • {sample.audioFormat.toUpperCase()}</span>
                      <span className="text-indigo-400 group-hover:translate-x-1 transition flex items-center gap-1 font-medium">
                        Analyze Sample <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. File Upload Tab */}
        {inputMode === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-950/40 hover:bg-slate-950/80 transition cursor-pointer flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <FileAudio className="w-7 h-7" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Drag & drop your audio file here or click to browse'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports MP3, WAV, M4A, OGG, AAC (Max 30 MB) • Tamil, English, Hindi, Malayalam, Telugu
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready: {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex justify-end">
                <button
                  onClick={analyzeFile}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
                >
                  {loading ? 'Extracting Acoustic Features...' : 'Run Forensic Voice Analysis'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Base64 Tab */}
        {inputMode === 'base64' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Paste Base64 Audio Data (raw Base64 or <code className="text-indigo-400">data:audio/...;base64,...</code>)
              </label>
              <textarea
                rows={5}
                value={base64Input}
                onChange={(e) => setBase64Input(e.target.value)}
                placeholder="UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Accepted by the <code className="text-slate-400 font-mono">POST /api/predict/base64</code> API endpoint for programmatic integration.
              </p>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400 font-mono">
                {base64Input ? `${(base64Input.length / 1024).toFixed(1)} KB payload` : 'Empty payload'}
              </span>
              <button
                onClick={analyzeBase64}
                disabled={loading || !base64Input.trim()}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
              >
                {loading ? 'Decoding & Analyzing...' : 'Analyze Base64 Audio'}
              </button>
            </div>
          </div>
        )}

        {/* 4. Microphone Recording Tab */}
        {inputMode === 'record' && (
          <div className="text-center py-6 space-y-5">
            <div className="max-w-lg mx-auto space-y-4">
              {/* Record / Stop Button */}
              <div className="relative inline-block">
                {isRecording && (
                  <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-2xl ${
                    isRecording
                      ? 'bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-rose-600/50 ring-4 ring-rose-500/30'
                      : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-600/40 hover:shadow-indigo-600/60 ring-4 ring-indigo-500/20'
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-9 h-9 fill-current" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>

              {/* Status and Timer */}
              <div>
                {isRecording ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      REC 00:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}
                    </div>
                    <p className="text-sm font-semibold text-slate-100">
                      Recording your voice... Speak clearly
                    </p>
                    {/* Live Frequency Spectrum Visualizer */}
                    <div className="flex items-center justify-center gap-1 h-12 px-4 py-2 bg-slate-950/70 border border-slate-800/80 rounded-2xl max-w-xs mx-auto shadow-inner">
                      {liveAudioLevels.map((lvl, idx) => (
                        <div
                          key={idx}
                          className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 via-cyan-400 to-rose-400 transition-all duration-75"
                          style={{ height: `${Math.max(12, lvl)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : recordedBlob ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Audio Captured: {recordingSeconds || '1'}s • {((recordedBlob?.size || 0) / 1024).toFixed(1)} KB (16 kHz WAV)
                    </div>
                    <p className="text-sm font-semibold text-slate-100">
                      Voice recording ready for forensic inspection
                    </p>

                    {/* Inline Quick Audio Preview */}
                    {audioUrl && (
                      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 max-w-sm mx-auto shadow-lg backdrop-blur-md">
                        <div className="text-[11px] text-slate-400 mb-1.5 flex items-center justify-between px-1">
                          <span className="flex items-center gap-1.5">
                            <Volume2 className="w-3 h-3 text-indigo-400" />
                            <span>Preview Recording</span>
                          </span>
                          <span className="font-mono text-slate-400">16 kHz PCM</span>
                        </div>
                        <audio
                          controls
                          src={audioUrl}
                          className="w-full h-8 rounded-lg accent-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-bold text-slate-100">
                      Tap the Microphone to Record Voice
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Speak naturally in Tamil, English, Hindi, Malayalam, or Telugu. Our neural audio forensics model extracts authentic vocal cord jitter and acoustic prosody.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {recordedBlob && !isRecording && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={analyzeRecording}
                    disabled={loading}
                    className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2.5 active:scale-98"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-cyan-200" />
                        <span>Analyzing Glottal Features...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4.5 h-4.5 text-cyan-200" />
                        <span>Analyze My Recording</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRecordedBlob(null);
                      setRecordingSeconds(0);
                      if (audioUrl && audioUrl.startsWith('blob:')) {
                        URL.revokeObjectURL(audioUrl);
                      }
                      setAudioUrl(null);
                      setError(null);
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Record Again</span>
                  </button>
                </div>
              )}

              {/* Mobile Compatibility Badge */}
              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Mobile Optimized: iPhone (Safari), Android (Chrome) &amp; iPad compatible</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audio Stream Player */}
      {audioUrl && (
        <AudioPlayer
          src={audioUrl}
          waveform={currentResult?.acoustic_features.waveformEnvelope}
          title={currentResult ? `${currentResult.filename} (${currentResult.detected_language})` : 'Active Audio Sample'}
          isAI={currentResult ? currentResult.classification === 'AI-Generated' : undefined}
        />
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white">Extracting Acoustic &amp; Spectral Vectors...</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Computing 13 MFCC cepstral coefficients, F0 autocorrelation pitch jitter, Wiener flatness, and vocoder phase coherence metrics.
          </p>
        </div>
      )}

      {/* Real-time Classification Results Card */}
      {currentResult && !loading && (
        <div className="space-y-6">
          <div
            className={`border rounded-2xl p-6 shadow-2xl transition-all ${
              currentResult.classification === 'AI-Generated'
                ? 'bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border-rose-800/50 shadow-rose-950/30'
                : 'bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border-emerald-800/50 shadow-emerald-950/30'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Verdict Tag */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    currentResult.classification === 'AI-Generated'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {currentResult.classification === 'AI-Generated' ? (
                    <ShieldAlert className="w-8 h-8" />
                  ) : (
                    <ShieldCheck className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-mono text-slate-400">
                      Classification Verdict
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300">
                      DB Ref #{currentResult.id}
                    </span>
                  </div>
                  <h3
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 ${
                      currentResult.classification === 'AI-Generated'
                        ? 'text-rose-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {currentResult.classification}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Detected Language:{' '}
                    <span className="font-semibold text-slate-200">
                      {currentResult.detected_language}
                    </span>{' '}
                    ({(currentResult.language_confidence * 100).toFixed(0)}% rhythm match)
                  </p>
                </div>
              </div>

              {/* Confidence Gauge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 lg:border-l lg:border-slate-800 lg:pl-6">
                <div>
                  <span className="text-xs text-slate-400 block mb-1">
                    Decision Confidence
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {(currentResult.confidence_score * 100).toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Calibrated</span>
                  </div>
                </div>

                {/* AI vs Human Split Gauge */}
                <div className="w-full sm:w-56 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-rose-400">AI: {(currentResult.ai_probability * 100).toFixed(1)}%</span>
                    <span className="text-emerald-400">Human: {(currentResult.human_probability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${currentResult.ai_probability * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${currentResult.human_probability * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Metadata Footprint */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Duration: {currentResult.duration_seconds}s</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Sample Rate: {currentResult.sample_rate} Hz</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Languages className="w-4 h-4 text-indigo-400" />
                <span>Language: {currentResult.detected_language}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Persisted: Cloud SQL Postgres</span>
              </div>
            </div>
          </div>

          {/* Forensic Deep Inspection Charts */}
          <ForensicCharts
            features={currentResult.acoustic_features}
            explanation={currentResult.explanation}
            isAI={currentResult.classification === 'AI-Generated'}
            confidenceScore={currentResult.confidence_score}
          />
        </div>
      )}
    </div>
  );
};
