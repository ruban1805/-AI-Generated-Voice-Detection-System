import React, { useState, useEffect } from 'react';
import {
  Award,
  BarChart3,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ModelBenchmark } from '../types/index.ts';
import { getApiUrl } from '../utils/api.ts';

export const ModelEvaluation: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<ModelBenchmark[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBenchmarks = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/benchmarks'));
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data);
      }
    } catch (e) {
      console.error('Error fetching benchmarks:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const featureImportance = [
    { name: 'Vocoder High-Freq Phase Distortion', weight: 26, category: 'Spectral' },
    { name: 'Over-Smoothed Pitch Jitter (F0 Lack of Tremor)', weight: 24, category: 'Biometric' },
    { name: 'MFCC-2 & MFCC-4 Formant Distribution', weight: 18, category: 'Cepstral' },
    { name: 'Spectral Rolloff 85% Cutoff Anomaly', weight: 14, category: 'Spectral' },
    { name: 'Digital Silence Noise Floor Zeroing', weight: 10, category: 'Temporal' },
    { name: 'Spectral Flux Frame Discontinuity', weight: 8, category: 'Temporal' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Academic Headline */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Award className="w-3.5 h-3.5" /> Empirical Validation
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300">
                IndicDeepVoice-v2 Benchmark
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Machine Learning Model Evaluation &amp; Benchmarks
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Evaluated on 13,780 speech samples across 5 languages against modern diffusion, autoregressive, and GAN vocoders.
            </p>
          </div>

          <button
            onClick={fetchBenchmarks}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition self-start md:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh PostgreSQL Data
          </button>
        </div>
      </div>

      {/* Aggregate Score Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Overall Accuracy</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">96.6%</div>
          <p className="text-[11px] text-slate-500 mt-1">Cross-lingual test split</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Precision</span>
            <BarChart3 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-indigo-400">97.2%</div>
          <p className="text-[11px] text-slate-500 mt-1">Minimal false positives</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Recall</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-cyan-400">96.2%</div>
          <p className="text-[11px] text-slate-500 mt-1">High deepfake capture rate</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>AUC-ROC</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-amber-400">0.989</div>
          <p className="text-[11px] text-slate-500 mt-1">Area under curve</p>
        </div>
      </div>

      {/* Multilingual Performance Table (From Cloud SQL) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6">
        <h3 className="font-bold text-white text-base mb-1">
          Performance Breakdown by Language
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Empirical evaluation across South Asian and Indo-European linguistic families.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">AUC-ROC</th>
                <th className="py-3 px-4">Sample Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {benchmarks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Loading benchmarks from PostgreSQL...
                  </td>
                </tr>
              ) : (
                benchmarks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {b.language}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {b.accuracy}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.precision}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.recall}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.f1Score}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-400">{b.aucRoc}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {b.sampleCount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Visualizer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Confusion Matrix</h3>
              <p className="text-xs text-slate-400">Aggregated cross-lingual classification matrix.</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              N = 13,780
            </span>
          </div>

          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div />
              <div className="font-semibold text-slate-400">Predicted Human</div>
              <div className="font-semibold text-slate-400">Predicted AI</div>

              <div className="flex items-center justify-end font-semibold text-slate-400 pr-2">
                Actual Human
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl">
                <span className="text-emerald-400 text-xl font-bold font-mono block">6,692</span>
                <span className="text-[10px] text-slate-400 uppercase">True Negative (97.1%)</span>
              </div>
              <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl">
                <span className="text-rose-400 text-xl font-bold font-mono block">198</span>
                <span className="text-[10px] text-slate-400 uppercase">False Positive (2.9%)</span>
              </div>

              <div className="flex items-center justify-end font-semibold text-slate-400 pr-2">
                Actual AI
              </div>
              <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl">
                <span className="text-rose-400 text-xl font-bold font-mono block">262</span>
                <span className="text-[10px] text-slate-400 uppercase">False Negative (3.8%)</span>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-800/50 p-4 rounded-xl">
                <span className="text-emerald-400 text-xl font-bold font-mono block">6,628</span>
                <span className="text-[10px] text-slate-400 uppercase">True Positive (96.2%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Importance Weights */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Acoustic Feature Importance</h3>
            <p className="text-xs text-slate-400">
              Gini impurity reduction &amp; SHAP contribution in the detection ensemble.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {featureImportance.map((f, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{f.name}</span>
                  <span className="font-mono text-indigo-400">{f.weight}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${f.weight * 3.5}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
