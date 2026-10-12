import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Consistent empty state for lists (spec §58). Always explains why nothing is
 * shown and optionally points to the next action.
 */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-surface-200 bg-white px-6 py-12 text-center shadow-card",
        className
      )}
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md border border-surface-200 bg-surface-50 text-surface-400">
        <Inbox className="h-4 w-4" />
      </div>
      <p className="text-sm font-semibold text-surface-900">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-surface-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}