import React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number;
  indicatorColor?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  indicatorColor = "bg-teal-600",
  showLabel = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full space-y-1", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs text-surface-500 font-medium">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100 border border-surface-200">
        <div
          className={cn("h-full transition-all duration-300 ease-out", indicatorColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
