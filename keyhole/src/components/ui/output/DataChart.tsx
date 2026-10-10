'use client';

import React, { useState } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface DataChartProps {
  data: DataPoint[];
  type?: 'bar' | 'area' | 'line';
  height?: number;
  primaryColor?: string; // default violet
  secondaryColor?: string;
  title?: string;
  valueSuffix?: string;
  className?: string;
}

export function DataChart({
  data,
  type = 'bar',
  height = 180,
  primaryColor = 'oklch(0.62 0.22 295)', // electric violet
  secondaryColor = 'oklch(0.4 0.1 280)',
  title,
  valueSuffix = '',
  className = '',
}: DataChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-[oklch(0.55_0.01_280)] font-mono">
        No chart data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)), 1);
  const chartPadding = 24;
  const width = 500;
  const innerHeight = height - chartPadding * 2;
  const innerWidth = width - chartPadding * 2;
  const stepX = innerWidth / Math.max(1, data.length - 1);

  // Points for line/area
  const points = data.map((d, i) => {
    const x = chartPadding + i * stepX;
    const y = height - chartPadding - (d.value / maxValue) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - chartPadding} L ${points[0].x} ${height - chartPadding} Z`;

  return (
    <div className={`rounded-xl border border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280)] p-4 relative ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-white">
          <span>{title}</span>
          {hoveredIdx !== null && (
            <span className="font-mono text-[11px] text-[oklch(0.62_0.22_295)]">
              {data[hoveredIdx].label}: {data[hoveredIdx].value}
              {valueSuffix}
            </span>
          )}
        </div>
      )}

      <div className="relative w-full overflow-hidden" style={{ height }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          {/* Subtle horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = height - chartPadding - pct * innerHeight;
            return (
              <line
                key={idx}
                x1={chartPadding}
                y1={y}
                x2={width - chartPadding}
                y2={y}
                stroke="oklch(0.22 0.01 280 / 40%)"
                strokeDasharray="3 3"
              />
            );
          })}

          {/* Area Chart Mode */}
          {type === 'area' && (
            <>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#areaGrad)" />
              <path d={pathD} fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Line Chart Mode */}
          {type === 'line' && (
            <path d={pathD} fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinecap="round" />
          )}

          {/* Bar Chart Mode */}
          {type === 'bar' &&
            data.map((d, i) => {
              const barWidth = Math.max(8, (innerWidth / data.length) * 0.65);
              const x = chartPadding + (i / data.length) * innerWidth + ((innerWidth / data.length) - barWidth) / 2;
              const barHeight = (d.value / maxValue) * innerHeight;
              const y = height - chartPadding - barHeight;
              const isHovered = hoveredIdx === i;

              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={isHovered ? 'oklch(0.7 0.25 295)' : primaryColor}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}

          {/* Interactive dots for line/area */}
          {type !== 'bar' &&
            points.map((p, i) => {
              const isHovered = hoveredIdx === i;
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5 : 3.5}
                  fill={isHovered ? '#fff' : primaryColor}
                  stroke="oklch(0.08 0.005 280)"
                  strokeWidth="2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />
              );
            })}
        </svg>

        {/* Bottom labels */}
        <div className="flex justify-between text-[10px] font-mono text-[oklch(0.66_0.015_280)] mt-1 px-4">
          <span>{data[0]?.label}</span>
          {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.label}</span>}
          <span>{data[data.length - 1]?.label}</span>
        </div>
      </div>
    </div>
  );
}
