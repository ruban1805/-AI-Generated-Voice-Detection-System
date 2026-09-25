import React, { useState } from 'react';
import { AcousticFeatures } from '../types/index.ts';
import { Activity, Zap, ShieldAlert, Cpu, BarChart2, Radio } from 'lucide-react';

interface ForensicChartsProps {
  features: AcousticFeatures;
  explanation: {
    verdictSummary: string;
    keyFindings: string[];
    riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
    modelArchitecture: string;
  };
  isAI: boolean;
  confidenceScore: number;
}

export const ForensicCharts: React.FC<ForensicChartsProps> = ({
  features,
  explanation,
  isAI,
  confidenceScore,
}) => {
  const [activeTab, setActiveTab] = useState<'mfcc' | 'pitch' | 'spectral' | 'artifacts'>('artifacts');

  const { pitch, spectral, mfcc, syntheticMarkers } = features;

  const getHeatmapColor = (val: number) => {
    // Val typically ranges from -40 to +40
    const norm = Math.max(0, Math.min(1, (val + 30) / 60));
    if (norm < 0.25) return 'bg-blue-900';
    if (norm < 0.5) return 'bg-cyan-700';
    if (norm < 0.75) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Explainability Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white">Forensic Signal &amp; Acoustic Analysis</h3>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Multidimensional acoustic extraction including MFCCs, fundamental pitch ($F_0$), and neural vocoder artifacts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${getRiskBadgeColor(explanation.riskLevel)}`}>
            {explanation.riskLevel} Synthetic Risk
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
            Confidence: {(confidenceScore * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Forensic Verdict & XAI Bullet Insights */}
      <div className={`p-4 rounded-xl border ${
        isAI
          ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
          : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-black/40 mt-0.5">
            {isAI ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <Zap className="w-5 h-5 text-emerald-400" />}
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="font-semibold text-sm">
              {explanation.verdictSummary}
            </h4>
            <div className="space-y-1.5 pt-1">
              {explanation.keyFindings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isAI ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                  <span>{finding}</span>
                </div>
              ))}
            </div>
            <div className="pt-2 text-[11px] text-slate-400 font-mono">
              Model Ensemble: {explanation.modelArchitecture}
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Inspection Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('artifacts')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'artifacts'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Vocoder &amp; Synthesis Markers
        </button>

        <button
          onClick={() => setActiveTab('pitch')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'pitch'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Pitch ($F_0$) &amp; Glottal Jitter
        </button>

        <button
          onClick={() => setActiveTab('mfcc')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'mfcc'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          MFCC Spectrum (13 Coefficients)
        </button>

        <button
          onClick={() => setActiveTab('spectral')}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
            activeTab === 'spectral'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Spectral Characteristics
        </button>
      </div>

      {/* Sub-Tab 1: Synthetic Markers */}
      {activeTab === 'artifacts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Vocoder Phase Artifacts</span>
                <span className="font-mono text-slate-200">{syntheticMarkers.vocoderArtifactScore}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    syntheticMarkers.vocoderArtifactScore > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${syntheticMarkers.vocoderArtifactScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                High-frequency phase incoherence typical of HiFi-GAN, MelGAN, or WaveNet.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Pitch Smoothness Anomaly</span>
                <span className="font-mono text-slate-200">{syntheticMarkers.pitchSmoothnessAnomaly}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    syntheticMarkers.pitchSmoothnessAnomaly > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${syntheticMarkers.pitchSmoothnessAnomaly}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Absence of physiological micro-tremor in vocal cord oscillations.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Spectral Discontinuity</span>
                <span className="font-mono text-slate-200">{syntheticMarkers.spectralDiscontinuityScore}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    syntheticMarkers.spectralDiscontinuityScore > 50 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${syntheticMarkers.spectralDiscontinuityScore}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Frame-tiling boundary glitches from mel-spectrogram upsampling.
              </p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Digital Silence Floor</span>
                <span className="font-mono text-slate-200">{syntheticMarkers.silenceFloorAnomaly}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    syntheticMarkers.silenceFloorAnomaly > 40 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${syntheticMarkers.silenceFloorAnomaly}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Absence of natural room reverberation / presence of digital zeroing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Pitch & Glottal Dynamics */}
      {activeTab === 'pitch' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400">Mean Pitch ($F_0$)</span>
              <p className="text-lg font-bold font-mono text-white mt-1">{pitch.meanHz} Hz</p>
              <span className="text-[11px] text-slate-500">Range: {pitch.minHz} – {pitch.maxHz} Hz</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400">Pitch Jitter</span>
              <p className={`text-lg font-bold font-mono mt-1 ${pitch.jitterPercent < 0.4 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {pitch.jitterPercent}%
              </p>
              <span className="text-[11px] text-slate-500">Normal Human: 0.6% – 1.8%</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400">Pitch Std. Dev</span>
              <p className="text-lg font-bold font-mono text-white mt-1">{pitch.stdDevHz} Hz</p>
              <span className="text-[11px] text-slate-500">Intonation contour spread</span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <span className="text-xs text-slate-400">Voiced Ratio</span>
              <p className="text-lg font-bold font-mono text-white mt-1">{(pitch.voicedFramesRatio * 100).toFixed(0)}%</p>
              <span className="text-[11px] text-slate-500">Phonetic voicing percentage</span>
            </div>
          </div>

          {/* Pitch Contour Line Visualization */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Fundamental Pitch Track ($F_0$ Contour over Time)</span>
              <span className="text-[11px] font-mono text-indigo-400">Autocorrelation Peak Detection</span>
            </div>
            <div className="h-32 flex items-end gap-1.5 pt-4 px-2 bg-slate-900/50 rounded-lg">
              {pitch.pitchContour.map((val, idx) => {
                const heightPct = Math.max(15, Math.min(95, ((val - pitch.minHz) / Math.max(1, pitch.maxHz - pitch.minHz)) * 80 + 15));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full rounded-t-sm bg-indigo-500 hover:bg-indigo-400 transition-all duration-100"
                      style={{ height: `${heightPct}%` }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 hidden group-hover:block text-[10px] font-mono bg-slate-800 text-white px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                      {val} Hz
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: MFCC Heatmap & Bar Charts */}
      {activeTab === 'mfcc' && (
        <div className="space-y-4">
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Mel-Frequency Cepstral Coefficients (13-Coefficient Time-Frequency Heatmap)</span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-blue-900 inline-block" /> Low Energy
                <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> High Energy
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-1">
              {mfcc.heatmap.map((row, cIdx) => (
                <div key={cIdx} className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-500 w-12 text-right pr-1">
                    MFCC {cIdx}
                  </span>
                  <div className="flex-1 flex gap-0.5 sm:gap-1 h-3 sm:h-4">
                    {row.map((cell, fIdx) => (
                      <div
                        key={fIdx}
                        className={`flex-1 rounded-xs transition-colors ${getHeatmapColor(cell)}`}
                        title={`MFCC ${cIdx}, Frame ${fIdx}: ${cell}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Average MFCC Coefficients Bar Chart */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 block mb-3">Mean MFCC Spectrum ($c_0$ to $c_{12}$)</span>
            <div className="grid grid-cols-13 gap-1 h-24 items-end">
              {mfcc.meanCoefficients.map((coef, i) => {
                const isNegative = coef < 0;
                const barHeight = Math.min(100, Math.abs(coef) * 2.5 + 10);
                return (
                  <div key={i} className="flex flex-col items-center justify-end h-full">
                    <div
                      className={`w-full rounded-sm ${isNegative ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ height: `${barHeight}%` }}
                      title={`c${i}: ${coef}`}
                    />
                    <span className="text-[9px] font-mono text-slate-500 mt-1">c{i}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Spectral Characteristics */}
      {activeTab === 'spectral' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs text-slate-400">Spectral Centroid</span>
            <p className="text-base font-bold font-mono text-white mt-1">{spectral.centroidHz} Hz</p>
            <span className="text-[10px] text-slate-500">Spectral center of mass</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs text-slate-400">Spectral Rolloff (85%)</span>
            <p className="text-base font-bold font-mono text-white mt-1">{spectral.rolloffHz} Hz</p>
            <span className="text-[10px] text-slate-500">High-frequency cutoff</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs text-slate-400">Wiener Flatness</span>
            <p className="text-base font-bold font-mono text-white mt-1">{spectral.flatness}</p>
            <span className="text-[10px] text-slate-500">Tone vs White Noise</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs text-slate-400">Spectral Flux</span>
            <p className="text-base font-bold font-mono text-white mt-1">{spectral.flux}</p>
            <span className="text-[10px] text-slate-500">Frame transition rate</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs text-slate-400">Zero-Crossing Rate</span>
            <p className="text-base font-bold font-mono text-white mt-1">{spectral.zcr}</p>
            <span className="text-[10px] text-slate-500">Sign flips per sample</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <span className="text-xs text-slate-400">Harmonic-to-Noise</span>
            <p className="text-base font-bold font-mono text-white mt-1">{spectral.hnrDb} dB</p>
            <span className="text-[10px] text-slate-500">Glottal periodicity</span>
          </div>
        </div>
      )}
    </div>
  );
};
