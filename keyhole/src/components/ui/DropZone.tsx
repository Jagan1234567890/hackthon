import React, { useState, useRef } from 'react';
import { clsx } from 'clsx';
import { UploadCloud, CheckCircle, ShieldCheck } from 'lucide-react';
import { AnalyzedFile } from '@/types/recovery';
import {
  calculateSha256,
  calculateShannonEntropy,
  formatHexDump,
  inspectContainerHeader,
} from '@/lib/recovery-engine';

interface DropZoneProps {
  analyzedFile: AnalyzedFile | null;
  onFileAnalyzed: (file: AnalyzedFile) => void;
  className?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  analyzedFile,
  onFileAnalyzed,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);

      const sha256 = await calculateSha256(buffer);
      const entropy = calculateShannonEntropy(uint8);
      const first64Hex = formatHexDump(uint8, 64);
      const inspection = inspectContainerHeader(uint8, file.name);

      const result: AnalyzedFile = {
        file,
        name: file.name,
        size: file.size,
        sha256,
        entropy,
        first64Hex,
        detectedMime: inspection.detectedMime,
        containerType: inspection.containerType,
        cipher: inspection.cipher,
        kdf: inspection.kdf,
        iterations: inspection.iterations,
        isLegacyWeak: inspection.isLegacyWeak,
      };

      onFileAnalyzed(result);
    } catch (err) {
      console.error('Failed to parse file client-side:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={clsx(
        'group relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer overflow-hidden',
        isDragOver
          ? 'border-[oklch(0.62_0.22_295)] bg-[oklch(0.62_0.22_295/12%)] scale-[1.01]'
          : 'border-[oklch(0.22_0.01_280/80%)] bg-[oklch(0.08_0.005_280/50%)] hover:border-[oklch(0.4_0.12_295/60%)] hover:bg-[oklch(0.11_0.008_280/40%)]',
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className={clsx(
            'p-3.5 rounded-2xl transition-all duration-200',
            isDragOver
              ? 'bg-[oklch(0.62_0.22_295/25%)] text-[oklch(0.85_0.15_295)]'
              : 'bg-[oklch(0.11_0.008_280)] text-[oklch(0.66_0.015_280)] group-hover:text-[oklch(0.85_0.15_295)]'
          )}
        >
          {analyzedFile ? (
            <CheckCircle className="w-6 h-6 text-[oklch(0.72_0.17_155)]" />
          ) : (
            <UploadCloud className="w-6 h-6" />
          )}
        </div>

        {analyzedFile ? (
          <div>
            <div className="text-sm font-semibold text-[oklch(0.985_0_0)] max-w-[220px] truncate mx-auto">
              {analyzedFile.name}
            </div>
            <div className="text-xs font-mono text-[oklch(0.62_0.22_295)] mt-1">
              {(analyzedFile.size / 1024).toFixed(1)} KB &bull; {analyzedFile.containerType}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium text-[oklch(0.985_0_0)]">
              {isProcessing ? 'Analyzing file headers...' : 'Drop encrypted target here'}
            </div>
            <p className="text-xs text-[oklch(0.66_0.015_280)] mt-1">
              or click to browse local storage
            </p>
          </div>
        )}

        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[oklch(0.72_0.17_155)] border border-[oklch(0.72_0.17_155/30%)] bg-[oklch(0.72_0.17_155/10%)] px-2.5 py-0.5 rounded-full mt-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local client-side sandbox</span>
        </div>
      </div>
    </div>
  );
};
