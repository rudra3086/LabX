"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

export interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  rowHeight?: number;
  height?: number | string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 52,
  height = 480,
  emptyMessage = "No items to display.",
  onRowClick,
  className,
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-white border-surface-200">
        <p className="text-sm text-surface-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-surface-200 bg-white shadow-card overflow-hidden",
        className
      )}
    >
      {/* Sticky Table Header */}
      <div className="flex items-center bg-surface-50 border-b border-surface-200 px-4 py-3 text-xs font-semibold text-surface-600 uppercase tracking-wider">
        {columns.map((col) => (
          <div
            key={col.key}
            style={{ width: col.width || `${100 / columns.length}%` }}
            className="truncate px-2"
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized Scroll Area */}
      <div
        ref={parentRef}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          overflowY: "auto",
        }}
        className="w-full relative"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = data[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                onClick={() => onRowClick?.(row)}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className={cn(
                  "flex items-center px-4 border-b border-surface-100 transition-colors hover:bg-surface-50/70 select-none text-sm text-surface-800",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    style={{ width: col.width || `${100 / columns.length}%` }}
                    className="truncate px-2 flex items-center"
                  >
                    {col.render(row)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
