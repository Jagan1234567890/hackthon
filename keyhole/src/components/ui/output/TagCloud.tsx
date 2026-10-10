'use client';

import React from 'react';

export interface TagItem {
  text: string;
  weight?: number; // 1 to 5
  count?: number;
  category?: string;
  onClick?: () => void;
}

export interface TagCloudProps {
  tags: TagItem[];
  onTagClick?: (tag: TagItem) => void;
  className?: string;
}

export function TagCloud({ tags, onTagClick, className = '' }: TagCloudProps) {
  const sizeClasses = {
    1: 'text-[10px] px-2.5 py-1',
    2: 'text-xs px-3 py-1',
    3: 'text-xs font-semibold px-3 py-1.5',
    4: 'text-sm font-semibold px-3.5 py-1.5',
    5: 'text-sm font-bold px-4 py-2 border-[oklch(0.62_0.22_295/50%)] bg-[oklch(0.62_0.22_295/20%)] text-white shadow-lg shadow-purple-500/20',
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {tags.map((tag, idx) => {
        const weight = Math.min(5, Math.max(1, tag.weight || 2)) as 1 | 2 | 3 | 4 | 5;
        const isHighWeight = weight >= 4;

        return (
          <button
            key={idx}
            onClick={() => {
              if (tag.onClick) tag.onClick();
              if (onTagClick) onTagClick(tag);
            }}
            className={`rounded-full border transition-all duration-200 cursor-pointer ${
              sizeClasses[weight]
            } ${
              isHighWeight
                ? 'border-[oklch(0.62_0.22_295/60%)] bg-[oklch(0.62_0.22_295/25%)] text-white hover:scale-110'
                : 'border-[oklch(0.22_0.01_280/60%)] bg-[oklch(0.11_0.008_280)] text-[oklch(0.85_0.01_280)] hover:border-[oklch(0.62_0.22_295)] hover:text-white hover:bg-[oklch(0.15_0.01_280)] hover:scale-105'
            }`}
          >
            <span>#{tag.text}</span>
            {tag.count !== undefined && (
              <span className="ml-1.5 font-mono text-[10px] opacity-70">
                ({tag.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
