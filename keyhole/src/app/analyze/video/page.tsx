'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Video,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileText,
  Download,
  Clock,
  Sparkles,
  Send,
  Loader2,
  Layers,
  ArrowLeft,
  Bot,
  User as UserIcon,
  ShieldAlert,
  Film,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { VideoAnalysisReport, VideoScene } from '@/lib/server/videoEngine';

export default function VideoAnalyzerPage() {
  const { user, sessionId } = useAppStore();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [report, setReport] = useState<VideoAnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Chat conversation for the video
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: 'user' | 'bot'; text: string; timestamp: string; jumpToSeconds?: number }[]
  >([
    {
      id: 'init',
      sender: 'bot',
      text:
        'Hello! I am VideoAnalyzer. Upload a video file to generate speech transcripts with timestamps, detect scene changes, inspect keyframes, verify content safety, or ask timestamp-linked questions about actions in the video.',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    const preview = URL.createObjectURL(file);
    setVideoUrl(preview);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user?.id || 'anonymous');
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch('/api/analyze/video/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Video upload failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSendQuery = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user' as const,
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setQueryLoading(true);

    try {
      const res = await fetch('/api/analyze/video/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          sessionId,
          analysisId: report?.id || '',
          question: q,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = data.botMessage;
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: botMsg.content,
            jumpToSeconds: data.jumpToSeconds,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);

        if (data.jumpToSeconds !== undefined) {
          handleSeek(data.jumpToSeconds);
        }
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'bot_err',
          sender: 'bot',
          text: 'Error processing query. Please check your network connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDownloadTranscript = (format: 'srt' | 'vtt' | 'txt') => {
    if (!report) return;
    window.open(
      `/api/analyze/video/transcript/${report.id}?userId=${encodeURIComponent(
        user?.id || 'anonymous'
      )}&sessionId=${encodeURIComponent(sessionId)}&format=${format}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-[oklch(0.02_0_0)] text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280)]/80 backdrop-blur-xl px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-[oklch(0.62_0.22_295)]">
              <Video className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">VideoAnalyzer</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
              Whisper Audio + Frame Vision
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {report && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadTranscript('srt')}
                className="px-2.5 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                SRT
              </button>
              <button
                onClick={() => handleDownloadTranscript('vtt')}
                className="px-2.5 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                VTT
              </button>
              <button
                onClick={() => handleDownloadTranscript('txt')}
                className="px-2.5 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                TXT
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept=".mp4,.avi,.mov,.mkv,.webm,.flv,.wmv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload Video</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Player, Timeline, Scenes & Frames (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Video Player Box */}
          <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-center p-6 flex flex-col items-center gap-3 hover:text-purple-300 transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                    <Film className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-medium">Click to upload MP4, MOV, WebM (up to 500MB)</p>
                  <p className="text-xs text-[oklch(0.66_0.015_280)]">
                    Automatic keyframe sampling & Whisper audio transcription
                  </p>
                </div>
              )}
            </div>

            {/* Custom Playback Controls & Timeline Scrubber */}
            {videoUrl && (
              <div className="p-4 bg-[oklch(0.11_0.008_280)] border-t border-[oklch(0.22_0.01_280/40%)] space-y-3">
                {/* Timeline Scrubber with Scene Markers */}
                <div className="relative w-full">
                  <input
                    type="range"
                    min="0"
                    max={report?.durationSeconds || 48}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  {/* Scene Marker Notches */}
                  {report?.scenes.map((s) => (
                    <div
                      key={s.sceneId}
                      style={{ left: `${(s.startTime / (report?.durationSeconds || 48)) * 100}%` }}
                      className="absolute top-3 w-1.5 h-1.5 rounded-full bg-purple-400 -translate-x-1/2 cursor-pointer"
                      title={`Scene ${s.sceneId}: ${s.startTime}s`}
                      onClick={() => handleSeek(s.startTime)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[oklch(0.66_0.015_280)]">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="p-1 hover:text-white transition-colors">
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-1 hover:text-white transition-colors"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="font-mono text-white">
                      {currentTime.toFixed(1)}s / {(report?.durationSeconds || 48).toFixed(1)}s
                    </span>
                  </div>

                  {report && (
                    <div className="flex items-center gap-2 font-mono">
                      <span>{report.resolution}</span>
                      <span>·</span>
                      <span>{report.fps} FPS</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          {report && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendQuery('Provide an executive summary of this video.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Summarize</span>
              </button>
              <button
                onClick={() => handleSendQuery('Show the full spoken audio transcript.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Transcribe</span>
              </button>
              <button
                onClick={() => handleSendQuery('List all detected scenes and transitions.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Extract Scenes</span>
              </button>
              <button
                onClick={() => handleDownloadTranscript('srt')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Generate Subtitles</span>
              </button>
            </div>
          )}

          {/* Extracted Key Frames Gallery */}
          {report && (
            <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-4">
              <span className="text-xs uppercase font-mono tracking-wider text-[oklch(0.66_0.015_280)] block mb-3">
                Extracted Keyframe Sample Gallery ({report.keyframes.length})
              </span>
              <div className="grid grid-cols-3 gap-3">
                {report.keyframes.map((kf, i) => (
                  <div
                    key={i}
                    onClick={() => handleSeek(kf.timestamp)}
                    className="group cursor-pointer rounded-xl overflow-hidden border border-[oklch(0.22_0.01_280)] relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={kf.url} alt={kf.label} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 px-2 py-1 text-[10px] font-mono flex items-center justify-between">
                      <span className="text-white truncate">{kf.label}</span>
                      <Play className="w-2.5 h-2.5 text-purple-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Synced Transcript & Timestamp Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Synced Transcript Panel */}
          {report && (
            <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-4 max-h-[260px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-2 mb-3">
                <span className="text-xs font-mono text-[oklch(0.66_0.015_280)] uppercase">
                  Synced Whisper Transcript
                </span>
                <span className="text-[10px] font-mono text-purple-400">Click to Seek</span>
              </div>
              <div className="space-y-2">
                {report.transcript.map((t) => {
                  const isActive = currentTime >= t.start && currentTime <= t.end;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSeek(t.start)}
                      className={`p-2 rounded-lg text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-purple-500/20 border border-purple-500/40 text-white'
                          : 'hover:bg-white/5 text-[oklch(0.66_0.015_280)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] mb-0.5">
                        <span className="text-purple-400">
                          {t.start.toFixed(1)}s - {t.end.toFixed(1)}s
                        </span>
                        <span>{(t.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <p className="leading-relaxed">{t.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timestamp-Linked Dialogue Box */}
          <div className="flex-1 rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] flex flex-col h-[400px]">
            <div className="px-4 py-3 border-b border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white">VideoAnalyzer Q&A</span>
              </div>
              <span className="text-[10px] font-mono text-[oklch(0.66_0.015_280)]">Timeline Synced</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-tr-none'
                        : 'bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)] text-white rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.jumpToSeconds !== undefined && (
                      <button
                        onClick={() => handleSeek(msg.jumpToSeconds!)}
                        className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/30 text-purple-200 hover:bg-purple-500/50 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Jump to {msg.jumpToSeconds.toFixed(1)}s</span>
                      </button>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
              {queryLoading && (
                <div className="flex items-center gap-2 text-xs text-[oklch(0.66_0.015_280)]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>VideoAnalyzer is evaluating timestamps...</span>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="p-3 border-t border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask what happens at 0:15 or summarize scene 2..."
                className="flex-1 bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] rounded-xl px-3 py-2 text-xs text-white placeholder-[oklch(0.66_0.015_280)] focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || queryLoading}
                className="p-2 rounded-xl bg-purple-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
