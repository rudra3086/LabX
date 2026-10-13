import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type StatTone = "brand" | "emerald" | "amber" | "rose" | "sky" | "slate";

const TONE_STYLES: Record<StatTone, string> = {
  brand: "bg-navy-50 text-navy-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-600",
  sky: "bg-sky-50 text-sky-700",
  slate: "bg-surface-100 text-surface-600",
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  tone?: StatTone;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  className?: string;
}

const TREND_STYLES = {
  up: "text-emerald-700",
  down: "text-rose-600",
  neutral: "text-surface-500",
} as const;

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

/**
 * Teams-style metric tile (spec §45 — dashboard information hierarchy). A quiet
 * white tile with a tinted icon chip, a large tabular figure and an optional
 * supporting line — matching the Fluent/Fluent-surface dashboard cards.
 */
export function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone = "brand",
  trend,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? TREND_STYLES[trend.direction] && (trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus) : null;

  return (
    <div
      className={cn(
        "rounded-fluentLg border border-surface-200 bg-white p-4 shadow-card transition-shadow hover:shadow-elevated",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="truncate text-sm font-medium text-surface-500">{title}</p>
        {icon && (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-fluent",
              TONE_STYLES[tone]
            )}
          >
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end gap-2">
        <span className="text-3xl font-semibold leading-none tabular-nums tracking-tight text-surface-900">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
              TREND_STYLES[trend.direction]
            )}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3" />
            ) : trend.direction === "down" ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs leading-relaxed text-surface-400">{subtitle}</p>
      )}
    </div>
  );
}
