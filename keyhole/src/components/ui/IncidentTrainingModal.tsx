'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Send,
  Loader2,
  TrendingUp,
  Cpu,
  History,
  ShieldAlert,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';

export interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  modality: 'image' | 'video' | 'audio';
  defaultType?: string;
  defaultOriginalText?: string;
  timestamp?: number;
  onCorrectionSubmitted?: (data: {
    applied: boolean;
    accuracyBoost: number;
    correctedOutput: string;
  }) => void;
}

export function IncidentTrainingModal({
  isOpen,
  onClose,
  modality,
  defaultType = 'general',
  defaultOriginalText = '',
  timestamp,
  onCorrectionSubmitted,
}: IncidentModalProps) {
  const { user, sessionId } = useAppStore();
  const [analysisType, setAnalysisType] = useState(defaultType);
  const [originalOutput, setOriginalOutput] = useState(defaultOriginalText);
  const [correctedOutput, setCorrectedOutput] = useState('');
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('moderate');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    accuracyBoost: number;
    message: string;
  } | null>(null);
  const [recentIncidents, setRecentIncidents] = useState<Array<{
    incidentId: string;
    analysisType: string;
    originalOutput: string;
    correctedOutput: string;
    recordedAt: string;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  useEffect(() => {
    if (defaultOriginalText) {
      setOriginalOutput(defaultOriginalText);
    }
  }, [defaultOriginalText]);

  useEffect(() => {
    if (defaultType) {
      setAnalysisType(defaultType);
    }
  }, [defaultType]);

  // Load session incidents when modal opens
  useEffect(() => {
    if (isOpen && sessionId) {
      const uid = user?.id || 'guest-session';
      fetch(`/api/analyze/incident?userId=${encodeURIComponent(uid)}&sessionId=${encodeURIComponent(sessionId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.incidents) {
            setRecentIncidents(data.incidents);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, sessionId, user?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalOutput.trim() || !correctedOutput.trim()) return;

    setLoading(true);
    setSuccessResult(null);

    const uid = user?.id || 'guest-session';

    try {
      const res = await fetch('/api/analyze/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          sessionId: sessionId || 'temp-session',
          analysisType,
          originalOutput,
          correctedOutput,
          audioTimestamp: modality === 'audio' ? timestamp : undefined,
          frameTimestamp: modality === 'video' ? timestamp : undefined,
          severity,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const boost = data.immediateAccuracyDelta || 0.015;
        setSuccessResult({
          accuracyBoost: boost,
          message: data.trainingFeedback?.userActionableSummary || 'In-session prompt modifier successfully updated.',
        });
        if (onCorrectionSubmitted) {
          onCorrectionSubmitted({
            applied: true,
            accuracyBoost: boost,
            correctedOutput,
          });
        }
        // Update recent list
        setRecentIncidents((prev) => [
          {
            incidentId: 'inc_' + Date.now(),
            analysisType,
            originalOutput,
            correctedOutput,
            recordedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setCorrectedOutput('');
      }
    } catch (err) {
      console.error('Failed to submit incident:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-2xl border border-[oklch(0.25_0.03_295)] bg-[oklch(0.06_0.01_280)] text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[oklch(0.18_0.01_280)] flex items-center justify-between bg-[oklch(0.08_0.015_295)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.62_0.22_295/20%)] border border-[oklch(0.62_0.22_295/40%)] flex items-center justify-center text-[oklch(0.62_0.22_295)]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <span>Real-Time Incident Training (RITS)</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Target &gt;90%
                </span>
              </h3>
              <p className="text-xs text-[oklch(0.66_0.015_280)]">
                Flag model mistakes to calibrate immediate in-session inference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[oklch(0.66_0.015_280)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[oklch(0.18_0.01_280)] px-6 pt-2 gap-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('submit')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'submit'
                ? 'border-[oklch(0.62_0.22_295)] text-white font-semibold'
                : 'border-transparent text-[oklch(0.66_0.015_280)] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Submit Correction</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[oklch(0.62_0.22_295)] text-white font-semibold'
                : 'border-transparent text-[oklch(0.66_0.015_280)] hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Session Corrections ({recentIncidents.length})</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'submit' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {successResult && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Correction Accepted & Live</div>
                    <p className="mt-0.5">{successResult.message}</p>
                    <div className="mt-1 font-mono text-[11px] text-emerald-400">
                      Estimated Accuracy Delta: +{(successResult.accuracyBoost * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[oklch(0.7_0.01_280)] mb-1">
                    Error Category
                  </label>
                  <select
                    value={analysisType}
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="w-full bg-[oklch(0.12_0.01_280)] border border-[oklch(0.22_0.01_280)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                  >
                    {modality === 'image' && (
                      <>
                        <option value="object_detection">Object Detection / Bounding Box</option>
                        <option value="ocr">OCR Text Recognition</option>
                        <option value="classification">Visual Classification</option>
                      </>
                    )}
                    {modality === 'video' && (
                      <>
                        <option value="transcription">Whisper Subtitle / Speech</option>
                        <option value="scene_detection">Scene / Keyframe Detection</option>
                        <option value="classification">Video Event Classification</option>
                      </>
                    )}
                    {modality === 'audio' && (
                      <>
                        <option value="transcription">Speech-to-Text / Whisper</option>
                        <option value="speaker_diarization">Speaker Diarization / Attribution</option>
                        <option value="sentiment">Sentiment / Tone Analysis</option>
                        <option value="language_detection">Language Detection</option>
                      </>
                    )}
                    <option value="general">General AI Hallucination</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[oklch(0.7_0.01_280)] mb-1">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as 'minor' | 'moderate' | 'major')}
                    className="w-full bg-[oklch(0.12_0.01_280)] border border-[oklch(0.22_0.01_280)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                  >
                    <option value="minor">Minor (slight typo / punctuation)</option>
                    <option value="moderate">Moderate (wrong entity / word)</option>
                    <option value="major">Major (hallucinated sentence / misattribution)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[oklch(0.7_0.01_280)] mb-1">
                  Original (Incorrect) AI Output
                </label>
                <textarea
                  rows={2}
                  value={originalOutput}
                  onChange={(e) => setOriginalOutput(e.target.value)}
                  placeholder="Paste or type the text/element that the AI got wrong..."
                  className="w-full bg-[oklch(0.12_0.01_280)] border border-[oklch(0.22_0.01_280)] rounded-lg px-3 py-2 text-xs text-white placeholder-[oklch(0.5_0.01_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[oklch(0.7_0.01_280)] mb-1">
                  Ground Truth (Corrected) Output
                </label>
                <textarea
                  rows={2}
                  value={correctedOutput}
                  onChange={(e) => setCorrectedOutput(e.target.value)}
                  placeholder="Provide the exact correct transcription, speaker label, or object description..."
                  className="w-full bg-[oklch(0.12_0.01_280)] border border-[oklch(0.22_0.01_280)] rounded-lg px-3 py-2 text-xs text-white placeholder-[oklch(0.5_0.01_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between font-mono">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[oklch(0.62_0.22_295)]" />
                  <span>In-Session Prompt Modifier Active</span>
                </div>
                <span className="text-emerald-400 font-bold">+1.5% Estimated Impact</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[oklch(0.66_0.015_280)] hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !originalOutput.trim() || !correctedOutput.trim()}
                  className="px-4 py-2 rounded-xl bg-[oklch(0.62_0.22_295)] hover:bg-[oklch(0.58_0.24_295)] text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Incident...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Correction & Train</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {recentIncidents.length === 0 ? (
                <div className="text-center py-8 text-xs text-[oklch(0.55_0.01_280)]">
                  No corrections recorded in this session yet. Use the form to submit one!
                </div>
              ) : (
                recentIncidents.map((inc, i) => (
                  <div
                    key={inc.incidentId || i}
                    className="p-3 rounded-xl bg-[oklch(0.1_0.008_280)] border border-[oklch(0.2_0.01_280)] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[oklch(0.6_0.01_280)]">
                      <span className="uppercase text-purple-300 font-semibold">{inc.analysisType}</span>
                      <span>{new Date(inc.recordedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="line-through text-red-300/80 bg-red-950/20 px-2 py-1 rounded">
                      {inc.originalOutput}
                    </div>
                    <div className="text-emerald-300 bg-emerald-950/20 px-2 py-1 rounded font-medium">
                      ✓ {inc.correctedOutput}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
