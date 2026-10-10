'use client';

import React, { useState } from 'react';
import { Share2, Bookmark, Download, Printer, RefreshCw, Check } from 'lucide-react';

export interface UniversalActionBarProps {
  onShare?: () => void;
  onSave?: () => void;
  onExport?: (format: 'pdf' | 'json' | 'csv' | 'txt' | 'png') => void;
  onPrint?: () => void;
  onNewAnalysis?: () => void;
  className?: string;
}

export function UniversalActionBar({
  onShare,
  onSave,
  onExport,
  onPrint,
  onNewAnalysis,
  className = '',
}: UniversalActionBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'AI Analysis Report', url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
    if (onShare) onShare();
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onSave) onSave();
  };

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  const handleExportSelect = (fmt: 'pdf' | 'json' | 'csv' | 'txt' | 'png') => {
    setShowExportMenu(false);
    if (onExport) onExport(fmt);
  };

  return (
    <div
      className={`rounded-2xl border border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.09_0.006_280)]/90 backdrop-blur-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl ${className}`}
    >
      <div className="flex items-center gap-2">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.12_0.01_280)] hover:bg-white/10 text-xs text-white transition-all cursor-pointer"
        >
          {shared ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />}
          <span>{shared ? 'Link Copied' : 'Share'}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.12_0.01_280)] hover:bg-white/10 text-xs text-white transition-all cursor-pointer"
        >
          {saved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5 text-blue-400" />}
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.12_0.01_280)] hover:bg-white/10 text-xs text-white transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export</span>
          </button>

          {showExportMenu && (
            <div className="absolute left-0 bottom-full mb-2 w-36 rounded-xl border border-[oklch(0.25_0.03_295)] bg-[oklch(0.08_0.005_280)] shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs font-mono">
              <button
                onClick={() => handleExportSelect('pdf')}
                className="px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 text-white flex items-center justify-between"
              >
                <span>PDF Report</span>
                <span className="text-[10px] text-red-400">.pdf</span>
              </button>
              <button
                onClick={() => handleExportSelect('json')}
                className="px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 text-white flex items-center justify-between"
              >
                <span>Raw Data</span>
                <span className="text-[10px] text-amber-400">.json</span>
              </button>
              <button
                onClick={() => handleExportSelect('csv')}
                className="px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 text-white flex items-center justify-between"
              >
                <span>Spreadsheet</span>
                <span className="text-[10px] text-emerald-400">.csv</span>
              </button>
              <button
                onClick={() => handleExportSelect('txt')}
                className="px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 text-white flex items-center justify-between"
              >
                <span>Plain Text</span>
                <span className="text-[10px] text-blue-400">.txt</span>
              </button>
              <button
                onClick={() => handleExportSelect('png')}
                className="px-2.5 py-1.5 rounded-lg text-left hover:bg-white/10 text-white flex items-center justify-between"
              >
                <span>Annotated</span>
                <span className="text-[10px] text-purple-400">.png</span>
              </button>
            </div>
          )}
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[oklch(0.22_0.01_280)] bg-[oklch(0.12_0.01_280)] hover:bg-white/10 text-xs text-white transition-all cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-amber-400" />
          <span>Print</span>
        </button>
      </div>

      {/* New Analysis Button */}
      {onNewAnalysis && (
        <button
          onClick={onNewAnalysis}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[oklch(0.62_0.22_295)] hover:bg-[oklch(0.58_0.24_295)] text-white text-xs font-semibold shadow-lg shadow-purple-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>
      )}
    </div>
  );
}
