'use client';

import React, { useState } from 'react';
import { Clock, Play, ChevronDown, ChevronUp } from 'lucide-react';

export interface TimelineItem {
  id: string;
  timeSeconds: number;
  timeFormatted?: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral' | 'warning';
  speaker?: string;
  tags?: string[];
}

export interface TimelineProps {
  items: TimelineItem[];
  onSeek?: (seconds: number) => void;
  className?: string;
}

export function Timeline({ items, onSeek, className = '' }: TimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sentimentDotColors = {
    positive: 'bg-emerald-400 ring-emerald-400/40',
    negative: 'bg-rose-400 ring-rose-400/40',
    neutral: 'bg-blue-400 ring-blue-400/40',
    warning: 'bg-amber-400 ring-amber-400/40',
  };

  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      {/* Vertical glowing line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[oklch(0.62_0.22_295)] via-[oklch(0.62_0.22_295/50%)] to-transparent" />

      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        const dotColor = item.sentiment
          ? sentimentDotColors[item.sentiment]
          : 'bg-[oklch(0.62_0.22_295)] ring-[oklch(0.62_0.22_295/50%)]';

        return (
          <div key={item.id} className="relative group">
            {/* Glowing dot button */}
            <button
              onClick={() => onSeek && onSeek(item.timeSeconds)}
              className={`absolute -left-[1.375rem] top-1.5 w-3.5 h-3.5 rounded-full ring-4 transition-transform group-hover:scale-125 cursor-pointer z-10 ${dotColor}`}
              title={`Jump to ${item.timeFormatted || item.timeSeconds + 's'}`}
            />

            {/* Content card */}
            <div className="rounded-xl border border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280)] p-3.5 hover:border-[oklch(0.4_0.12_295/50%)] transition-all">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSeek && onSeek(item.timeSeconds)}
                    className="flex items-center gap-1 font-mono text-[11px] text-[oklch(0.62_0.22_295)] hover:underline"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{item.timeFormatted || `${item.timeSeconds.toFixed(1)}s`}</span>
                  </button>

                  {item.speaker && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white">
                      {item.speaker}
                    </span>
                  )}

                  <h4 className="text-xs font-semibold text-white tracking-tight">{item.title}</h4>
                </div>

                <div className="flex items-center gap-1">
                  {onSeek && (
                    <button
                      onClick={() => onSeek(item.timeSeconds)}
                      className="p-1 rounded-lg hover:bg-white/10 text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
                      title="Play from this point"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {item.description && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="p-1 rounded-lg hover:bg-white/10 text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable description */}
              {isExpanded && item.description && (
                <div className="mt-2.5 pt-2.5 border-t border-[oklch(0.22_0.01_280/40%)] text-xs text-[oklch(0.75_0.01_280)] leading-relaxed space-y-2">
                  <p>{item.description}</p>
                  {item.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.tags.map((t) => (
                        <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[oklch(0.12_0.01_280)] text-[oklch(0.66_0.015_280)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
