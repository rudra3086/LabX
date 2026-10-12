"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fluent pagination control (spec §69). Rendered only when there are enough
 * items to justify paging.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | "ellipsis")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 px-1 pt-3",
        className
      )}
    >
      <p className="text-[13px] tabular-nums text-surface-500">
        {total === 0 ? "No results" : `${start}–${end} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-fluent border border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span
              key={`e-${i}`}
              aria-hidden="true"
              className="px-1 text-[13px] text-surface-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "h-8 min-w-8 px-2 text-[13px] font-medium tabular-nums transition-colors",
                p === page
                  ? "rounded-fluent bg-navy-600 text-white"
                  : "rounded-fluent text-surface-600 hover:bg-surface-100"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="inline-flex h-8 w-8 items-center justify-center rounded-fluent border border-surface-200 bg-white text-surface-600 transition-colors hover:bg-surface-50 disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}