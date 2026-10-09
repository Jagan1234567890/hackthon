'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  ImageIcon,
  Sparkles,
  FileText,
  Eye,
  Palette,
  Shield,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Send,
  Loader2,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { ImageAnalysisReport, BoundingBox } from '@/lib/server/imageEngine';

export default function ImageAnalyzerPage() {
  const { user, sessionId } = useAppStore();

  const [uploadedImages, setUploadedImages] = useState<
    { file: File; previewUrl: string; report?: ImageAnalysisReport }[]
  >([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);

  // Chat conversation for the selected image
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: 'user' | 'bot'; text: string; confidence?: number; timestamp: string }[]
  >([
    {
      id: 'init',
      sender: 'bot',
      text:
        'Hello! I am ImageAnalyzer. Upload an image above to extract text (OCR), detect objects with bounding boxes, inspect color palettes, evaluate sharpness, or ask me detailed questions about visual elements.',
      confidence: 0.95,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentItem = uploadedImages[selectedIdx];
  const currentReport = currentItem?.report;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setLoading(true);
    const newItems = [...uploadedImages];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || 'anonymous');
      formData.append('sessionId', sessionId);

      try {
        const res = await fetch('/api/analyze/image/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newItems.push({
            file,
            previewUrl,
            report: data.report,
          });
        }
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    setUploadedImages(newItems);
    setSelectedIdx(newItems.length - 1);
    setLoading(false);
  };

  const handleQuickAction = async (prompt: string) => {
    setInputQuery(prompt);
    await handleSendQuery(prompt);
  };

  const handleSendQuery = async (queryOverride?: string) => {
    const q = queryOverride || inputQuery;
    if (!q.trim()) return;

    const userMsg = {
      id: 'usr_' + Date.now(),
      sender: 'user' as const,
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!queryOverride) setInputQuery('');
    setQueryLoading(true);

    try {
      const res = await fetch('/api/analyze/image/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          sessionId,
          analysisId: currentReport?.id || '',
          question: q,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: data.botMessage.content,
            confidence: data.confidence,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'bot_err',
          sender: 'bot',
          text: 'Error processing question. Please verify your connection.',
          confidence: 0.5,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDownloadReport = (format: 'json' | 'pdf') => {
    if (!currentReport) return;
    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentReport, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${currentReport.id}_report.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      window.print();
    }
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
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm">ImageAnalyzer</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              Vision Model 93.2%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentReport && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadReport('json')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => handleDownloadReport('pdf')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[oklch(0.22_0.01_280)] bg-[oklch(0.11_0.008_280)] text-xs text-white hover:bg-white/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF Report</span>
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.svg"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold transition-all shadow-lg shadow-blue-600/20"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload Image</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Image Canvas & Annotations (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Main Visualizer Frame */}
          <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] overflow-hidden flex flex-col h-[520px] relative">
            {/* Canvas Toolbar */}
            <div className="px-4 py-2.5 border-b border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)] flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[oklch(0.66_0.015_280)] truncate max-w-[200px]">
                  {currentItem ? currentItem.file.name : 'No image loaded'}
                </span>
                {currentReport && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    {currentReport.dimensions.width}x{currentReport.dimensions.height}
                  </span>
                )}
              </div>

              {currentItem && (
                <div className="flex items-center gap-2 text-[oklch(0.66_0.015_280)]">
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                      showBoundingBoxes
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'hover:bg-white/10'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Boxes</span>
                  </button>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                    className="p-1 hover:text-white transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono">{(zoomLevel * 100).toFixed(0)}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                    className="p-1 hover:text-white transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(1)}
                    className="p-1 hover:text-white transition-colors"
                    title="Reset Zoom"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Image Canvas / Drop Zone */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center p-4 bg-black/40">
              {currentItem ? (
                <div
                  className="relative inline-block transition-transform duration-150"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentItem.previewUrl}
                    alt={currentItem.file.name}
                    className="max-h-[440px] w-auto object-contain rounded-lg shadow-xl"
                  />

                  {/* Bounding Box Overlays */}
                  {showBoundingBoxes &&
                    currentReport?.objects.map((obj, i) => {
                      const [top, left, bottom, right] = obj.box;
                      return (
                        <div
                          key={i}
                          style={{
                            top: `${top}%`,
                            left: `${left}%`,
                            width: `${right - left}%`,
                            height: `${bottom - top}%`,
                          }}
                          className="absolute border-2 border-purple-400 bg-purple-500/20 pointer-events-none rounded"
                        >
                          <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-600 text-white shadow whitespace-nowrap">
                            {obj.label} ({(obj.confidence * 100).toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full border-2 border-dashed border-[oklch(0.22_0.01_280/80%)] rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all p-6 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Drop high-resolution image or click to browse
                    </p>
                    <p className="text-xs text-[oklch(0.66_0.015_280)] mt-1">
                      Supports JPG, PNG, WebP, GIF, BMP, TIFF, SVG up to 25MB (4096×4096)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          {currentItem && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAction('Provide a detailed description of this image.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Describe</span>
              </button>
              <button
                onClick={() => handleQuickAction('Extract all visible text (OCR) verbatim.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Extract Text</span>
              </button>
              <button
                onClick={() => handleQuickAction('List all detected objects with confidence scores.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Detect Objects</span>
              </button>
              <button
                onClick={() => handleQuickAction('Analyze dominant colors and extract the palette.')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.08_0.005_280)] hover:bg-white/10 text-xs text-white transition-colors"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span>Analyze Colors</span>
              </button>
            </div>
          )}

          {/* Session Upload History (Temporary) */}
          {uploadedImages.length > 1 && (
            <div className="rounded-xl border border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280)] p-3">
              <span className="text-xs font-mono text-[oklch(0.66_0.015_280)] uppercase mb-2 block">
                Session Image Queue ({uploadedImages.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {uploadedImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIdx(idx)}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      selectedIdx === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.previewUrl} alt="queue" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Analysis Summary & Conversational Vision Chat (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Forensic Results Panel */}
          {currentReport ? (
            <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[oklch(0.22_0.01_280/40%)] pb-3">
                <span className="text-xs uppercase font-mono tracking-wider text-[oklch(0.66_0.015_280)]">
                  Forensic Vision Extract
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  Calibrated Confidence: {(currentReport.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div>
                <h4 className="text-xs font-mono text-[oklch(0.66_0.015_280)] mb-1">Classification</h4>
                <div className="text-sm font-semibold text-white">{currentReport.classification}</div>
              </div>

              <div>
                <h4 className="text-xs font-mono text-[oklch(0.66_0.015_280)] mb-1">Dominant Palette</h4>
                <div className="flex items-center gap-2">
                  {currentReport.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px] font-mono">
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                      <span>{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono text-[oklch(0.66_0.015_280)] mb-1">Quality Assessment</h4>
                <div className="text-xs text-white/90">
                  Sharpness: {currentReport.quality.sharpnessScore}/100 · {currentReport.quality.lightingCondition}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] p-5 text-center text-xs text-[oklch(0.66_0.015_280)]">
              Upload an image to generate automated vision descriptors, OCR extraction, and palette metrics.
            </div>
          )}

          {/* Conversational Vision Chat Interface */}
          <div className="flex-1 rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.08_0.005_280)] flex flex-col h-[400px]">
            <div className="px-4 py-3 border-b border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">ImageAnalyzer Dialogue</span>
              </div>
              <span className="text-[10px] font-mono text-[oklch(0.66_0.015_280)]">Context Active</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/40%)] text-white rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-[oklch(0.66_0.015_280)]">
                      <span>{msg.timestamp}</span>
                      {msg.confidence !== undefined && (
                        <span className="font-mono">{(msg.confidence * 100).toFixed(0)}% conf</span>
                      )}
                    </div>
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
                  <span>ImageAnalyzer is inspecting image features...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
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
                placeholder="Ask about text, colors, positions, or objects..."
                className="flex-1 bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] rounded-xl px-3 py-2 text-xs text-white placeholder-[oklch(0.66_0.015_280)] focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || queryLoading}
                className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 active:scale-95 transition-all"
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
