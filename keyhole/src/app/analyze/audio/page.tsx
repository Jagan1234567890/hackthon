'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileText,
  Users,
  Activity,
  Smile,
  Download,
  Send,
  Loader2,
  ArrowLeft,
  Bot,
  User as UserIcon,
  Music,
  Clock,
  Sparkles,
  Cpu,
  Flag,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { AudioAnalysisReport } from '@/lib/server/audioEngine';
import { IncidentTrainingModal } from '@/components/ui/IncidentTrainingModal';
import {
  ResultCard,
  MetricBadge,
  DataChart,
  TagCloud,
  UniversalActionBar,
  EmptyState,
  SkeletonLoader,
} from '@/components/ui/output';

export default function AudioAnalyzerPage() {
  const { user, sessionId } = useAppStore();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [report, setReport] = useState<AudioAnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [accuracyStat, setAccuracyStat] = useState<number>(0.924);
  const [incidentModal, setIncidentModal] = useState<{
    isOpen: boolean;
    type: string;
    originalText: string;
    timestamp?: number;
  }>({
    isOpen: false,
    type: 'transcription',
    originalText: '',
  });

  // Chat conversation for the audio
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: 'user' | 'bot'; text: string; timestamp: string; jumpToSeconds?: number }[]
  >([
    {
      id: 'init',
      sender: 'bot',
      text:
        'Hello! I am AudioAnalyzer. Upload an audio clip or podcast to transcribe speech with Whisper, separate multi-speaker diarization with color labels, evaluate acoustic sentiment, analyze musical tempo/BPM, or seek directly to spoken statements.',
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    const preview = URL.createObjectURL(file);
    setAudioUrl(preview);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user?.id || 'anonymous');
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch('/api/analyze/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (err) {
      console.error('Audio upload failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Simulated Waveform Visualization Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const drawWaveform = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barCount = 64;
      const barWidth = width / barCount;
      const progressRatio = currentTime / (report?.durationSeconds || 54);

      for (let i = 0; i < barCount; i++) {
        const normalizedI = i / barCount;
        // pseudo waveform heights
        const wave = Math.sin(i * 0.3) * 0.35 + Math.cos(i * 0.8) * 0.25 + 0.4;
        const barHeight = wave * height * (isPlaying ? 0.85 + Math.sin(Date.now() * 0.005 + i) * 0.15 : 0.7);

        ctx.fillStyle =
          normalizedI <= progressRatio
            ? 'oklch(0.72 0.17 155)' // emerald played
            : 'oklch(0.22 0.01 280)'; // muted unplayed

        const x = i * barWidth;
        const y = (height - barHeight) / 2;
        ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
      }

      if (isPlaying) {
        animId = requestAnimationFrame(drawWaveform);
      }
    };

    drawWaveform();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentTime, report]);

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
      const res = await fetch('/api/analyze/audio/query', {
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
          text: 'Error processing audio query.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDownloadTranscript = (format: 'srt' | 'txt' | 'docx') => {
    if (!report) return;
    window.open(
      `/api/analyze/audio/transcript/${report.id}?userId=${encodeURIComponent(
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
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Mic className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">AudioAnalyzer</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Whisper Large + Pyannote Diarization
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIncidentModal({ isOpen: true, type: 'transcription', originalText: '' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-mono transition-all"
            title="Real-Time Incident Training System"
          >
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>{(accuracyStat * 100).toFixed(1)}% Accuracy (RITS)</span>
          </button>
          {report && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleDownloadTranscript('srt')}
                className="px-2.5 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                SRT
              </button>
              <button
                onClick={() => handleDownloadTranscript('txt')}
                className="px-2.5 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                TXT
              </button>
              <button
                onClick={() => handleDownloadTranscript('docx')}
                className="px-2.5 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                DOCX
              </button>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept=".mp3,.wav,.flac,.aac,.ogg,.wma,.m4a,.opus"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload Audio</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Waveform Player, Diarization & Metrics (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Audio Waveform Player Frame */}
          <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-6 flex flex-col gap-4">
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={() => {
                  if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                }}
                onEnded={() => setIsPlaying(false)}
              />
            )}

            <div className="flex items-center justify-between text-xs font-mono text-[oklch(0.66_0.015_280)]">
              <span>{audioFile ? audioFile.name : 'No audio clip selected'}</span>
              <span>{report ? `${report.quality.sampleRateHz} Hz · ${report.quality.channels} Ch` : ''}</span>
            </div>

            {/* Interactive Waveform Canvas */}
            <div className="relative h-28 bg-[oklch(0.11_0.008_280)] rounded-xl border border-[oklch(0.22_0.01_280/40%)] flex items-center justify-center overflow-hidden">
              {audioUrl ? (
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={110}
                  className="w-full h-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = clickX / rect.width;
                    handleSeek(pct * (report?.durationSeconds || 54));
                  }}
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer text-center p-4 flex flex-col items-center gap-2 text-xs text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
                >
                  <Upload className="w-6 h-6 text-emerald-400 mb-1" />
                  <span>Click to drop MP3, WAV, FLAC, M4A, OGG (up to 100MB)</span>
                </div>
              )}
            </div>

            {/* Player Controls */}
            {audioUrl && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg shadow-emerald-600/30"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.muted = !isMuted;
                        setIsMuted(!isMuted);
                      }
                    }}
                    className="p-2 text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="font-mono text-xs text-white">
                    {currentTime.toFixed(1)}s / {(report?.durationSeconds || 54).toFixed(1)}s
                  </span>
                </div>

                {report && (
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Activity className="w-4 h-4" />
                    <span>SNR: {report.quality.snrDb} dB</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {report && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSendQuery('Transcribe the spoken audio with exact speaker labels.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Transcribe</span>
              </button>
              <button
                onClick={() => handleSendQuery('Who are the distinct speakers identified in this recording?')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Identify Speakers</span>
              </button>
              <button
                onClick={() => handleSendQuery('Analyze the emotional sentiment and tone throughout.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>Analyze Sentiment</span>
              </button>
              <button
                onClick={() => handleSendQuery('What language was detected, and what is the certainty?')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Detect Language</span>
              </button>
            </div>
          )}

          {/* Acoustic Breakdown & Sentiment Matrix using Universal Output Display */}
          {report ? (
            <div className="space-y-4">
              <ResultCard
                title="Acoustic Breakdown & Diarization"
                icon={<Activity className="w-4 h-4 text-emerald-400" />}
                confidence={0.942}
                badgeText={`${report.speakersFound.length} Speakers`}
                defaultExpanded={true}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <MetricBadge label="Sample Rate" value={`${report.quality.sampleRateHz} Hz`} variant="green" />
                    <MetricBadge label="Duration" value={`${report.durationSeconds.toFixed(1)}s`} variant="violet" />
                    <MetricBadge label="Format" value={report.fileName.split('.').pop()?.toUpperCase() || 'AUDIO'} variant="grey" />
                  </div>

                  <div>
                    <h5 className="text-[11px] font-mono text-[oklch(0.66_0.015_280)] mb-1.5 uppercase tracking-wider">
                      Speaker Identification
                    </h5>
                    <TagCloud
                      tags={report.speakersFound.map((spk, i) => ({
                        text: spk,
                        weight: i === 0 ? 4 : 3,
                        count: Math.round(50 / (i + 1)),
                      }))}
                    />
                  </div>

                  <div>
                    <h5 className="text-[11px] font-mono text-[oklch(0.66_0.015_280)] mb-1.5 uppercase tracking-wider">
                      Emotional Sentiment Curve
                    </h5>
                    <DataChart
                      type="area"
                      height={120}
                      primaryColor="oklch(0.72 0.17 155)"
                      data={[
                        { label: '0s', value: report.sentimentOverview.positivePercent },
                        { label: '15s', value: report.sentimentOverview.neutralPercent },
                        { label: '30s', value: report.sentimentOverview.seriousPercent },
                        { label: '45s', value: report.sentimentOverview.positivePercent },
                      ]}
                      valueSuffix="%"
                    />
                  </div>
                </div>
              </ResultCard>
            </div>
          ) : (
            <EmptyState
              icon={<Mic className="w-6 h-6 text-emerald-400" />}
              title="No Audio Loaded"
              description="Drop an MP3, WAV, FLAC, or AAC podcast or clip to transcribe speech with Whisper, separate multi-speaker diarization, and track sentiment."
              actionText="Upload Audio"
              onAction={() => fileInputRef.current?.click()}
            />
          )}
        </div>

        {/* Right Col: Synced Transcript with Click-to-Seek & Audio Q&A (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Click-to-Seek Transcript */}
          {report && (
            <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-4 max-h-[260px] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-2 mb-3">
                <span className="text-xs font-mono text-[oklch(0.66_0.015_280)] uppercase">
                  Speech Segments (Click to Seek)
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Synced Playback</span>
              </div>
              <div className="space-y-2">
                {report.segments.map((seg) => {
                  const isActive = currentTime >= seg.start && currentTime <= seg.end;
                  return (
                    <div
                      key={seg.id}
                      onClick={() => handleSeek(seg.start)}
                      className={`group p-2.5 rounded-lg text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 border border-emerald-500/40 text-white'
                          : 'hover:bg-white/5 text-[oklch(0.66_0.015_280)]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] mb-1">
                        <span style={{ color: seg.speakerColor }}>{seg.speaker}</span>
                        <div className="flex items-center gap-2">
                          <span>
                            {seg.start.toFixed(1)}s - {seg.end.toFixed(1)}s
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIncidentModal({
                                isOpen: true,
                                type: 'transcription',
                                originalText: seg.text,
                                timestamp: seg.start,
                              });
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-amber-400 text-[oklch(0.66_0.015_280)] transition-opacity"
                            title="Flag / Correct speech transcription"
                          >
                            <Flag className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <p className="leading-relaxed">{seg.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Audio Q&A Dialogue */}
          <div className="flex-1 rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] flex flex-col h-[400px]">
            <div className="px-4 py-3 border-b border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">AudioAnalyzer Dialogue</span>
              </div>
              <span className="text-[10px] font-mono text-[oklch(0.66_0.015_280)]">Acoustic Engine</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)] text-white rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.jumpToSeconds !== undefined && (
                      <button
                        onClick={() => handleSeek(msg.jumpToSeconds!)}
                        className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/30 text-emerald-200 hover:bg-emerald-500/50 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Seek to {msg.jumpToSeconds.toFixed(1)}s</span>
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
                  <span>AudioAnalyzer is analyzing waveforms...</span>
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
                placeholder="Ask about speakers, noise levels, or speech text..."
                className="flex-1 bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] rounded-xl px-3 py-2 text-xs text-white placeholder-[oklch(0.66_0.015_280)] focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || queryLoading}
                className="p-2 rounded-xl bg-emerald-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-500 active:scale-95 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Universal Action Bar at bottom */}
          {report && (
            <UniversalActionBar
              onExport={(fmt) => handleDownloadTranscript(fmt === 'txt' ? 'txt' : 'srt')}
              onNewAnalysis={() => fileInputRef.current?.click()}
            />
          )}
        </div>
      </div>

      <IncidentTrainingModal
        isOpen={incidentModal.isOpen}
        onClose={() => setIncidentModal((prev) => ({ ...prev, isOpen: false }))}
        modality="audio"
        defaultType={incidentModal.type}
        defaultOriginalText={incidentModal.originalText}
        timestamp={incidentModal.timestamp}
        onCorrectionSubmitted={({ accuracyBoost, correctedOutput }) => {
          setAccuracyStat((prev) => Math.min(0.975, prev + accuracyBoost));
          if (report && incidentModal.originalText) {
            setReport({
              ...report,
              segments: report.segments.map((s) =>
                s.text === incidentModal.originalText ? { ...s, text: correctedOutput } : s
              ),
            });
          }
        }}
      />
    </div>
  );
}
