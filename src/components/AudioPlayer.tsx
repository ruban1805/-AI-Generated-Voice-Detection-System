import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  waveform?: number[];
  title?: string;
  isAI?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  waveform = [],
  title,
  isAI,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.log('Playback error:', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeBars = waveform.length > 0 ? waveform : Array.from({ length: 48 }, (_, i) => 0.15 + 0.35 * Math.sin(i * 0.4));
  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-lg backdrop-blur-md">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-200 truncate max-w-xs md:max-w-md">
              {title || 'Audio Stream Preview'}
            </h4>
            <p className="text-xs text-slate-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        {isAI !== undefined && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              isAI
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isAI ? 'Synthetic Signature' : 'Natural Organic'}
          </span>
        )}
      </div>

      {/* Waveform Bar Visualizer */}
      <div className="h-12 flex items-center gap-0.5 sm:gap-1 px-1 py-1 bg-slate-950/60 rounded-lg overflow-hidden my-2">
        {activeBars.map((val, idx) => {
          const isPlayed = idx / activeBars.length <= progressRatio;
          const barHeight = Math.max(12, Math.min(100, Math.round(val * 100)));
          return (
            <div
              key={idx}
              className="flex-1 rounded-sm transition-all duration-150"
              style={{
                height: `${barHeight}%`,
                backgroundColor: isPlayed
                  ? isAI
                    ? '#f43f5e'
                    : '#10b981'
                  : '#334155',
                opacity: isPlayed ? 1 : 0.45,
              }}
            />
          );
        })}
      </div>

      {/* Seekbar & Controls */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition active:scale-95"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button
          onClick={handleReset}
          className="p-2 text-slate-400 hover:text-slate-200 transition"
          title="Restart"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />

        <span className="text-xs font-mono text-slate-400 min-w-10 text-right">
          {formatTime(currentTime)}
        </span>
      </div>
    </div>
  );
};
