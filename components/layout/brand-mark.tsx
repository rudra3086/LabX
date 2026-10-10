import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  withWordmark = true,
  className,
}: {
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-800 text-white shadow-card">
        <FlaskConical className="h-4 w-4" aria-hidden="true" />
      </span>
      {withWordmark && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-slate-900">
            SmartLab
          </span>
          <span className="block text-[11px] font-normal text-surface-400">
            Practical Work Platform
          </span>
        </span>
      )}
    </span>
  );
}

export function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}