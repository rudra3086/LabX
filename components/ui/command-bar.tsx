import { cn } from "@/lib/utils";

/**
 * Teams-style command bar (spec §45, §46 — dashboard/action hierarchy). A thin
 * row of contextual commands that sits directly beneath a page header. Commands
 * are provided by the caller as buttons/links; primary actions can be pushed to
 * the right via `actions`.
 */
export function CommandBar({
  children,
  actions,
  className,
}: {
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {children}
      {actions && (
        <div className="ml-auto flex flex-wrap items-center gap-1.5">{actions}</div>
      )}
    </div>
  );
}
