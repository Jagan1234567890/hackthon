'use client';

import React from 'react';

export interface MarkdownViewProps {
  content: string;
  className?: string;
}

export function MarkdownView({ content, className = '' }: MarkdownViewProps) {
  // Simple, lightweight markdown-to-JSX parser for headings, bullet points, bold/italic, code, links
  const lines = content.split('\n');

  return (
    <div className={`prose prose-invert max-w-none text-xs leading-relaxed space-y-2 text-[oklch(0.85_0.01_280)] ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-sm font-bold text-white pt-2 border-b border-[oklch(0.22_0.01_280/40%)] pb-1">
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-white pt-3 pb-1">
              {trimmed.replace('## ', '')}
            </h3>
          );
        }
        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-lg font-extrabold text-white pt-3 pb-1 text-[oklch(0.62_0.22_295)]">
              {trimmed.replace('# ', '')}
            </h2>
          );
        }
        // Bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-[oklch(0.62_0.22_295)] font-bold mt-0.5">•</span>
              <span>{renderFormattedText(trimmed.replace(/^[-*]\s+/, ''))}</span>
            </div>
          );
        }
        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-[oklch(0.62_0.22_295)] pl-3 italic text-[oklch(0.75_0.01_280)] my-1.5 bg-white/[0.02] py-1 rounded-r">
              {renderFormattedText(trimmed.replace(/^>\s+/, ''))}
            </blockquote>
          );
        }
        // Empty lines
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Regular paragraph
        return <p key={idx}>{renderFormattedText(line)}</p>;
      })}
    </div>
  );
}

function renderFormattedText(text: string): React.ReactNode {
  // Replace **bold**, `code`, and links
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-[oklch(0.12_0.01_280)] text-purple-300 font-mono text-[11px] border border-white/10">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
