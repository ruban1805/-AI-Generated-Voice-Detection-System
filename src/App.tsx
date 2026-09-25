/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Database,
  Award,
  Terminal,
  Info,
  LogIn,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { DetectionStudio } from './components/DetectionStudio.tsx';
import { DatabaseHistory } from './components/DatabaseHistory.tsx';
import { ModelEvaluation } from './components/ModelEvaluation.tsx';
import { ApiDocumentation } from './components/ApiDocumentation.tsx';
import { ArchitectureInfo } from './components/ArchitectureInfo.tsx';
import { DynamicAudioBackground } from './components/DynamicAudioBackground.tsx';
import { CustomCursor } from './components/CustomCursor.tsx';
import { DetectionResult } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<'detector' | 'history' | 'evaluation' | 'api' | 'architecture'>('detector');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      const token = await res.user.getIdToken();
      setIdToken(token);
    } catch (err: any) {
      console.error('Firebase Auth sign-in error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIdToken(null);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handlePredictionComplete = (_result: DetectionResult) => {
    setHistoryRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      {/* Precision Forensic Custom Cursor */}
      <CustomCursor />

      {/* Dynamic Animated Acoustic Waves & Particle Background */}
      <DynamicAudioBackground />

      {/* Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white">
                  VocalGuard<span className="text-indigo-400">.ai</span>
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Forensic DSP v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Multilingual AI Voice Detection • Tamil • English • Hindi • Malayalam • Telugu
              </p>
            </div>
          </div>

          {/* User Profile / Google Sign-in */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PostgreSQL Active</span>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 pr-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs font-medium text-slate-300 hidden sm:inline max-w-[120px] truncate">
                  {currentUser.displayName || currentUser.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-rose-400 transition"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto mt-3 pt-2 border-t border-slate-800/40 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('detector')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'detector'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Detection Studio
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Database History
          </button>

          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'evaluation'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Model Benchmarks
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'api'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            FastAPI Playground
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Acoustic Forensics Specs
          </button>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8">
        {activeTab === 'detector' && (
          <DetectionStudio
            authToken={idToken}
            onPredictionComplete={handlePredictionComplete}
          />
        )}

        {activeTab === 'history' && (
          <DatabaseHistory
            authToken={idToken}
            refreshTrigger={historyRefreshKey}
          />
        )}

        {activeTab === 'evaluation' && <ModelEvaluation />}

        {activeTab === 'api' && <ApiDocumentation />}

        {activeTab === 'architecture' && <ArchitectureInfo />}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>VocalGuard Forensic Speech Intelligence • Real-World Academic &amp; Production Ready</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>PostgreSQL: Cloud SQL</span>
            <span>Auth: Firebase OAuth</span>
            <span>Languages: Ta • En • Hi • Ml • Te</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
