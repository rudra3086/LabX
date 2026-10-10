import React from "react";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  Clock,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileEdit,
  PenLine,
  Lock,
} from "lucide-react";
import { SubmissionStatus, TaskViewStatus } from "@/types";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "outline"
    | "navy"
    | "teal"
    | "emerald"
    | "amber"
    | "rose"
    | "slate";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-100 text-surface-700",
    outline: "bg-transparent text-surface-600 ring-1 ring-inset ring-surface-300",
    navy: "bg-navy-50 text-navy-800",
    teal: "bg-teal-50 text-teal-800",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-surface-100 text-surface-600",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-1 font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full leading-none select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const VIEW_STATUS_CONFIG: Record<TaskViewStatus, { label: string; variant: BadgeProps["variant"]; Icon: typeof Clock }> = {
  UPCOMING: { label: "Upcoming", variant: "slate", Icon: CalendarClock },
  DUE_SOON: { label: "Due soon", variant: "amber", Icon: Clock },
  DUE_TODAY: { label: "Due today", variant: "rose", Icon: AlertTriangle },
  MISSED: { label: "Missed", variant: "rose", Icon: XCircle },
  SUBMITTED: { label: "Submitted", variant: "emerald", Icon: CheckCircle2 },
  SUBMITTED_LATE: { label: "Submitted late", variant: "amber", Icon: AlertTriangle },
  GRADED: { label: "Graded", variant: "teal", Icon: CheckCircle2 },
  CLOSED: { label: "Closed", variant: "slate", Icon: Lock },
};

const SUBMISSION_STATUS_CONFIG: Record<SubmissionStatus, { label: string; variant: BadgeProps["variant"]; Icon: typeof Clock }> = {
  NOT_STARTED: { label: "Not started", variant: "slate", Icon: CalendarClock },
  DRAFT: { label: "In progress", variant: "slate", Icon: FileEdit },
  SUBMITTED: { label: "Submitted", variant: "emerald", Icon: CheckCircle2 },
  LATE: { label: "Late", variant: "rose", Icon: AlertTriangle },
  GRADED: { label: "Graded", variant: "teal", Icon: CheckCircle2 },
  MISSED: { label: "Missed", variant: "rose", Icon: XCircle },
};

/**
 * Accessible status badge: always uses a text label + icon, never colour alone
 * (spec §32, §124).
 */
export function StatusBadge({ status }: { status: TaskViewStatus | SubmissionStatus }) {
  const config = VIEW_STATUS_CONFIG[status as TaskViewStatus] ?? SUBMISSION_STATUS_CONFIG[status as SubmissionStatus] ?? {
    label: status,
    variant: "slate" as BadgeProps["variant"],
    Icon: PenLine,
  };
  const Icon = config.Icon;
  return (
    <Badge variant={config.variant} size="sm">
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </Badge>
  );
}