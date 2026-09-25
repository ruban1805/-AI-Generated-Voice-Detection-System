import React from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  GitBranch,
  ShieldCheck,
  CheckCircle,
  Database,
} from 'lucide-react';

export const ArchitectureInfo: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white">System Architecture &amp; Forensic Methodology</h2>
        <p className="text-xs text-slate-400 mt-1">
          Technical specifications of the multi-stage DSP pipeline, acoustic feature representation, and multilingual phonetic modeling.
        </p>
      </div>

      {/* 5-Stage Pipeline Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h4 className="font-semibold text-white text-sm">Audio Ingestion</h4>
          <p className="text-xs text-slate-400">
            Accepts binary MP3/WAV uploads and Base64 payloads. Downmixes to mono PCM Float32 and resamples to 16,000 Hz.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h4 className="font-semibold text-white text-sm">DSP Preprocessing</h4>
          <p className="text-xs text-slate-400">
            Pre-emphasis filter ($y[n] = x[n] - 0.97 x[n-1]$), Hann window framing (25ms window, 10ms hop), Radix-2 FFT.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h4 className="font-semibold text-white text-sm">Feature Extraction</h4>
          <p className="text-xs text-slate-400">
            Computes 13 MFCCs, F0 pitch contour, pitch jitter, spectral centroid, 85% rolloff, Wiener flatness, and flux.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
            04
          </div>
          <h4 className="font-semibold text-white text-sm">Forensic ML Ensemble</h4>
          <p className="text-xs text-slate-400">
            Dual-branch classifier cross-referencing biometric pitch stability against vocoder phase incoherence.
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
            05
          </div>
          <h4 className="font-semibold text-white text-sm">PostgreSQL Storage</h4>
          <p className="text-xs text-slate-400">
            Cloud SQL stores prediction audit logs, confidence scores, detected language, and full acoustic vectors.
          </p>
        </div>
      </div>

      {/* Language Acoustic Profiles */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base">
          Multilingual Phonetic &amp; Prosodic Profiles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-indigo-400 text-sm mb-1">Tamil (தமிழ்)</h4>
            <p className="text-xs text-slate-300">
              Characterized by distinct retroflex consonants (/ʈ/, /ɖ/, /ɭ/), balanced vowel quantity without vowel reduction, and consistent syllable timing.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-indigo-400 text-sm mb-1">English</h4>
            <p className="text-xs text-slate-300">
              Stress-timed rhythm with pronounced vowel reduction to schwa (/ə/), high zero-crossing rates during sibilant fricatives (/s/, /z/, /θ/).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-indigo-400 text-sm mb-1">Hindi (हिन्दी)</h4>
            <p className="text-xs text-slate-300">
              Features a 4-way contrast in plosives (unvoiced unaspirated, unvoiced aspirated, voiced unaspirated, voiced aspirated) yielding high high-frequency burst energy.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-indigo-400 text-sm mb-1">Malayalam (മലയാളം)</h4>
            <p className="text-xs text-slate-300">
              Rich dental and alveolar distinctions, high geminate consonant duration, and pronounced nasalization reflected in MFCC-2 and MFCC-4.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-indigo-400 text-sm mb-1">Telugu (తెలుగు)</h4>
            <p className="text-xs text-slate-300">
              Known as "the Italian of the East" due to virtually all words ending in open vowels, resulting in smooth harmonic energy and resonant glottal pulses.
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <h4 className="font-semibold text-emerald-400 text-sm mb-1">Neural Vocoder Defense</h4>
            <p className="text-xs text-slate-300">
              Neutralizes modern HiFi-GAN, VITS, XTTS, and ElevenLabs generators by detecting phase approximation errors above 4 kHz and micro-pitch over-smoothing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
