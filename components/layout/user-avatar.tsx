import { cn } from "@/lib/utils";
import { initialsFor } from "./brand-mark";

const SIZES = {
  sm: "h-8 w-8 text-[12px]",
  md: "h-9 w-9 text-[13px]",
  lg: "h-11 w-11 text-sm",
} as const;

/**
 * Circular initials avatar used across the shell (rail + account menu). The
 * optional presence dot mirrors the Microsoft Teams "available" indicator.
 */
export function UserAvatar({
  name,
  size = "md",
  showPresence = false,
  className,
}: {
  name: string;
  size?: keyof typeof SIZES;
  showPresence?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        aria-hidden="true"
        className={cn(
          "flex items-center justify-center rounded-full bg-navy-600 font-semibold uppercase text-white",
          SIZES[size]
        )}
      >
        {initialsFor(name)}
      </span>
      {showPresence && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
