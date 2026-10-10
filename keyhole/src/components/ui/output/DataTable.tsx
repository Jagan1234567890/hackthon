'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, ChevronRight, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchableKey?: keyof T | string;
  expandableRow?: (row: T) => React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchableKey,
  expandableRow,
  maxHeight = '420px',
  className = '',
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) => {
      if (searchableKey && row[searchableKey]) {
        return String(row[searchableKey]).toLowerCase().includes(term);
      }
      return Object.values(row).some((val) =>
        String(val).toLowerCase().includes(term)
      );
    });
  }, [data, searchTerm, searchableKey]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      return sortDir === 'asc' ? 1 : -1;
    });
  }, [filteredData, sortKey, sortDir]);

  return (
    <div className={`rounded-xl border border-[oklch(0.22_0.01_280/50%)] bg-[oklch(0.08_0.005_280)] overflow-hidden flex flex-col ${className}`}>
      {/* Search Bar */}
      <div className="p-3 border-b border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.09_0.006_280)] flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.66_0.015_280)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-[oklch(0.12_0.01_280)] border border-[oklch(0.22_0.01_280)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[oklch(0.55_0.01_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
          />
        </div>
        <span className="text-[11px] font-mono text-[oklch(0.66_0.015_280)] shrink-0">
          Showing {sortedData.length} of {data.length}
        </span>
      </div>

      {/* Table Body with fixed header */}
      <div className="overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[oklch(0.11_0.008_280)] border-b border-[oklch(0.22_0.01_280/60%)] shadow-sm">
            <tr>
              {expandableRow && <th className="p-3 w-8" />}
              {columns.map((col) => {
                const k = String(col.key);
                return (
                  <th
                    key={k}
                    style={{ width: col.width }}
                    className={`p-3 font-semibold text-[oklch(0.85_0.01_280)] select-none ${
                      col.sortable !== false ? 'cursor-pointer hover:text-[oklch(0.62_0.22_295)]' : ''
                    }`}
                    onClick={() => col.sortable !== false && handleSort(k)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-[oklch(0.5_0.01_280)]">
                          {sortKey === k ? (
                            sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[oklch(0.62_0.22_295)]" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[oklch(0.22_0.01_280/30%)]">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (expandableRow ? 1 : 0)} className="p-8 text-center text-xs text-[oklch(0.55_0.01_280)]">
                  No records match your search filter.
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => {
                const isExpanded = expandedRowIndex === idx;
                const isEven = idx % 2 === 0;
                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`transition-colors hover:bg-[oklch(0.15_0.01_280)] ${
                        isEven ? 'bg-[oklch(0.08_0.005_280)]' : 'bg-[oklch(0.11_0.008_280)]'
                      }`}
                    >
                      {expandableRow && (
                        <td className="p-3 w-8">
                          <button
                            onClick={() => setExpandedRowIndex(isExpanded ? null : idx)}
                            className="p-1 rounded hover:bg-white/10 text-[oklch(0.66_0.015_280)] hover:text-white transition-colors"
                          >
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                      )}
                      {columns.map((col) => {
                        const k = String(col.key);
                        return (
                          <td key={k} className="p-3 text-[oklch(0.9_0_0)]">
                            {col.render ? col.render(row) : String(row[k] ?? '—')}
                          </td>
                        );
                      })}
                    </tr>
                    {isExpanded && expandableRow && (
                      <tr className="bg-[oklch(0.06_0.004_280)]">
                        <td colSpan={columns.length + 1} className="p-4 border-l-2 border-[oklch(0.62_0.22_295)]">
                          {expandableRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
