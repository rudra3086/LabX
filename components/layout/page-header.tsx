import { cn } from "@/lib/utils";

/** Teams-style channel/page header (spec §46, §48). */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-surface-200 pb-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {eyebrow && (
          <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-700">
            {eyebrow}
          </p>
        )}
        <h2 className="truncate text-2xl font-semibold tracking-tight text-surface-900">
          {title}
        </h2>
        {description && (
          <p className="text-sm leading-relaxed text-surface-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  meta,
  className,
}: {
  title: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between", className)}>
      <h3 className="text-sm font-semibold tracking-tight text-surface-900">{title}</h3>
      {meta && <span className="text-xs text-surface-400">{meta}</span>}
    </div>
  );
}
