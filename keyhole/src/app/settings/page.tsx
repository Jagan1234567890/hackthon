'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Shield,
  Bot,
  Database,
  Trash2,
  Lock,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
  LogOut,
  Brain,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { ModelTrainingModal } from '@/components/ui/ModelTrainingModal';

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    sessionId,
    theme,
    soundEnabled,
    setUser,
    toggleTheme,
    toggleSound,
    logout,
    clearMessages,
  } = useAppStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [selectedModel, setSelectedModel] = useState<'gpt-4' | 'gpt-4o' | 'claude-3.5-sonnet' | 'llava'>('gpt-4o');
  const [temperature, setTemperature] = useState<number>(0.3);
  const [maxTokens, setMaxTokens] = useState<number>(2048);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.7);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [purgingTemp, setPurgingTemp] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState<string | null>(null);
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);

  // Sync state when user is loaded
  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          preferences: {
            theme,
            soundEnabled,
            selectedModel,
            temperature,
            maxTokens,
            confidenceThreshold,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser({
            ...user!,
            fullName: data.user.full_name,
          });
        }
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePurgeTemporaryStorage = async () => {
    if (!sessionId) return;
    setPurgingTemp(true);
    setPurgeSuccess(null);

    try {
      const res = await fetch('/api/cleanup-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        clearMessages();
        sessionStorage.clear();
        setPurgeSuccess(
          `Purged ${data.cleanedKeyCount ?? 0} Redis keys and ${data.cleanedFilesCount ?? 0} temporary files. Clean slate restored!`
        );
      }
    } catch (err) {
      console.error('Cleanup error:', err);
    } finally {
      setPurgingTemp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[oklch(0.02_0_0)] text-white">
      {/* Top Header */}
      <header className="border-b border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280)]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-xs text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
              <span>User &amp; System Settings</span>
            </h1>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Section 1: User Profile & Identity (Persistent Storage) */}
        <section className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-[oklch(0.62_0.22_295)]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Persistent Identity Profile</h2>
                <p className="text-xs text-[oklch(0.66_0.015_280)]">
                  Survives browser closure · Stored permanently in database
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Verified User
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.66_0.015_280)] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/60%)] text-white text-sm focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                placeholder="Ada Lovelace"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[oklch(0.66_0.015_280)] mb-1.5">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || 'analyst@keyhole.local'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/40%)] text-[oklch(0.66_0.015_280)] text-sm cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[oklch(0.66_0.015_280)] mb-1.5">
                  Auth Provider
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-[oklch(0.04_0_0)] border border-[oklch(0.22_0.01_280/40%)] text-[oklch(0.66_0.015_280)] text-sm capitalize font-mono">
                  {user?.authProvider || 'local'} OAuth
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[oklch(0.62_0.22_295)] to-purple-600 text-white text-xs font-semibold hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {savingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Profile Changes</span>
              </button>
              {profileSuccess && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Changes saved to database!</span>
                </span>
              )}
            </div>
          </form>
        </section>

        {/* Section 2: AI Bot Models & Hyperparameters (90% Accuracy Calibration) */}
        <section className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">AI Engine &amp; Model Orchestration</h2>
                <p className="text-xs text-[oklch(0.66_0.015_280)]">
                  Configurable model backends with Chain-of-Thought reasoning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTrainingOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[oklch(0.62_0.22_295)] hover:bg-[oklch(0.58_0.24_295)] text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Train to Perfection</span>
              </button>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                Target &gt;90% Accuracy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.66_0.015_280)] mb-1.5">
                Core Model Backend
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/60%)] text-white text-sm focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
              >
                <option value="gpt-4o">GPT-4o (OpenAI Multimodal - Fast &amp; High Accuracy)</option>
                <option value="gpt-4">GPT-4 Turbo / Vision (Deep Reasoning)</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet Vision (Anthropic Forensic)</option>
                <option value="llava">LLaVA 1.6 (Open-Weights Vision)</option>
              </select>
              <p className="text-[11px] text-[oklch(0.66_0.015_280)] mt-1.5">
                Powers SiteAssistant, ImageAnalyzer OCR, and VideoAnalyzer scene breakdowns.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[oklch(0.66_0.015_280)]">
                  Temperature
                </label>
                <span className="text-xs font-mono text-purple-300">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-[oklch(0.66_0.015_280)] font-mono mt-1">
                <span>0.0 (Deterministic / Forensic)</span>
                <span>0.3 (Recommended)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[oklch(0.66_0.015_280)]">
                  Confidence Calibration Threshold
                </label>
                <span className="text-xs font-mono text-emerald-400">
                  {(confidenceThreshold * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <p className="text-[11px] text-[oklch(0.66_0.015_280)] mt-1">
                Responses scoring below 70% confidence trigger explicit clarifying questions.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[oklch(0.66_0.015_280)]">
                  Max Output Tokens
                </label>
                <span className="text-xs font-mono text-white">{maxTokens} tokens</span>
              </div>
              <input
                type="range"
                min="512"
                max="4096"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-[oklch(0.66_0.015_280)] font-mono mt-1">
                <span>512</span>
                <span>2048 (Default)</span>
                <span>4096</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Dual-Storage & Session Clean-Slate Inspector */}
        <section className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Dual-Storage Privacy Model</h2>
                <p className="text-xs text-[oklch(0.66_0.015_280)]">
                  Strict boundary between permanent user credentials and ephemeral interaction data
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Clean-Slate Protocol
            </span>
          </div>

          <div className="space-y-6">
            {/* Live Session Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)]">
                <span className="text-xs font-mono text-[oklch(0.66_0.015_280)]">Active Session ID</span>
                <div className="text-sm font-mono font-bold text-purple-300 truncate mt-1">
                  {sessionId || 'Unassigned'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)]">
                <span className="text-xs font-mono text-[oklch(0.66_0.015_280)]">Redis TTL Duration</span>
                <div className="text-sm font-mono font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>2 Hours (auto-expiring)</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)]">
                <span className="text-xs font-mono text-[oklch(0.66_0.015_280)]">Tab Close Destruction</span>
                <div className="text-sm font-mono font-bold text-amber-400 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>sendBeacon /api/cleanup</span>
                </div>
              </div>
            </div>

            {/* Comparison Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-[oklch(0.22_0.01_280/50%)] rounded-xl overflow-hidden">
                <thead className="bg-[oklch(0.11_0.008_280)] text-[oklch(0.66_0.015_280)] font-mono uppercase">
                  <tr>
                    <th className="p-3">Data Classification</th>
                    <th className="p-3">Storage Location</th>
                    <th className="p-3">Retention Policy</th>
                    <th className="p-3">On Tab Close</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[oklch(0.22_0.01_280/40%)] font-sans">
                  <tr>
                    <td className="p-3 font-medium text-white">Account, Email, Auth Provider</td>
                    <td className="p-3 font-mono text-purple-300">PostgreSQL (Users Table)</td>
                    <td className="p-3 text-[oklch(0.66_0.015_280)]">Persistent (Survives Close)</td>
                    <td className="p-3 text-emerald-400 font-mono">Preserved</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-white">Refresh Tokens (7 Days)</td>
                    <td className="p-3 font-mono text-purple-300">Sessions DB + httpOnly Cookie</td>
                    <td className="p-3 text-[oklch(0.66_0.015_280)]">7 Days auto-refresh</td>
                    <td className="p-3 text-emerald-400 font-mono">Preserved</td>
                  </tr>
                  <tr className="bg-red-500/5">
                    <td className="p-3 font-medium text-white">Chat Conversations</td>
                    <td className="p-3 font-mono text-amber-300">Redis (temp:*:chat_history) &amp; sessionStorage</td>
                    <td className="p-3 text-[oklch(0.66_0.015_280)]">2 Hours TTL</td>
                    <td className="p-3 text-red-400 font-mono font-semibold">DESTROYED</td>
                  </tr>
                  <tr className="bg-red-500/5">
                    <td className="p-3 font-medium text-white">Uploaded Media (Images/Videos/Audio)</td>
                    <td className="p-3 font-mono text-amber-300">/tmp/chatbot-uploads &amp; Redis</td>
                    <td className="p-3 text-[oklch(0.66_0.015_280)]">2 Hours TTL + 30m Cron</td>
                    <td className="p-3 text-red-400 font-mono font-semibold">DELETED IMMEDIATELY</td>
                  </tr>
                  <tr className="bg-red-500/5">
                    <td className="p-3 font-medium text-white">Analysis Reports &amp; Bot State</td>
                    <td className="p-3 font-mono text-amber-300">Redis (temp:*:analysis_results)</td>
                    <td className="p-3 text-[oklch(0.66_0.015_280)]">2 Hours TTL</td>
                    <td className="p-3 text-red-400 font-mono font-semibold">FLUSHED</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Manual Purge Trigger */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <div>
                <h3 className="text-sm font-semibold text-red-300">Manual Ephemeral Purge</h3>
                <p className="text-xs text-[oklch(0.66_0.015_280)] mt-0.5">
                  Immediately destroy all temporary media files, chat logs, and Redis keys for this session.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePurgeTemporaryStorage}
                disabled={purgingTemp}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs font-semibold transition-all disabled:opacity-50 shrink-0 shadow-lg shadow-red-600/20"
              >
                {purgingTemp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Purge Temporary Session Data Now</span>
              </button>
            </div>

            {purgeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{purgeSuccess}</span>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: Interface & Notification Preferences */}
        <section className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Interface &amp; Notification Preferences</h2>
                <p className="text-xs text-[oklch(0.66_0.015_280)]">
                  Persisted client preferences for audio chimes and themes
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)] flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Theme Mode</span>
                <span className="text-xs text-[oklch(0.66_0.015_280)]">
                  Current: {theme === 'dark' ? 'Hyper-Dark Void' : 'Clean Light'}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] text-white hover:bg-white/10 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)] flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Sound Notifications</span>
                <span className="text-xs text-[oklch(0.66_0.015_280)]">
                  Audio chime on bot incoming responses
                </span>
              </div>
              <button
                onClick={toggleSound}
                className={`p-2.5 rounded-xl border transition-colors ${
                  soundEnabled
                    ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] text-[oklch(0.66_0.015_280)]'
                }`}
                title="Toggle Sound"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </section>
      </main>

      <ModelTrainingModal
        isOpen={isTrainingOpen}
        onClose={() => setIsTrainingOpen(false)}
      />
    </div>
  );
}
