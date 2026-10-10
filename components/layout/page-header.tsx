import { cn } from "@/lib/utils";

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
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">
            {eyebrow}
          </p>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {description && (
          <p className="text-[13px] leading-relaxed text-surface-500">{description}</p>
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
      <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
      {meta && <span className="text-xs text-surface-400">{meta}</span>}
    </div>
  );
}