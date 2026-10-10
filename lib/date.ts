import { SubmissionStatus, TaskStatus, TaskViewStatus } from "@/types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Derive the user-facing task view status (spec §20, §32) entirely from real
 * stored data. Never invents a submission.
 */
export function deriveTaskViewStatus(
  deadline: string | null,
  submissionStatus: SubmissionStatus | null,
  taskStatus: TaskStatus,
  serverNow: number = Date.now()
): TaskViewStatus {
  if (submissionStatus === "GRADED") return "GRADED";
  if (submissionStatus === "LATE") return "SUBMITTED_LATE";
  if (submissionStatus === "SUBMITTED") return "SUBMITTED";

  if (taskStatus === "CLOSED" || taskStatus === "ARCHIVED") {
    return deadline && new Date(deadline).getTime() < serverNow ? "MISSED" : "CLOSED";
  }

  if (!deadline) return "UPCOMING";

  const diff = new Date(deadline).getTime() - serverNow;
  if (diff < 0) return "MISSED";
  if (diff <= 1 * DAY_MS) return "DUE_TODAY";
  if (diff <= 3 * DAY_MS) return "DUE_SOON";
  return "UPCOMING";
}

export function formatIST(date: Date | string | null | undefined, withTime = true): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
    timeZone: "Asia/Kolkata",
  };
  return new Intl.DateTimeFormat("en-IN", opts).format(d);
}

export function relativeTime(date: string | Date, serverNow: number = Date.now()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - serverNow;
  const abs = Math.abs(diffMs);
  const days = Math.floor(abs / DAY_MS);
  const hours = Math.floor(abs / (60 * 60 * 1000));
  const minutes = Math.floor(abs / (60 * 1000));

  const prefix = diffMs < 0 ? "" : "in ";
  const suffix = diffMs >= 0 ? "" : " ago";

  if (days >= 1) return `${prefix}${days} day${days > 1 ? "s" : ""}${suffix}`;
  if (hours >= 1) return `${prefix}${hours} hour${hours > 1 ? "s" : ""}${suffix}`;
  if (minutes >= 1) return `${prefix}${minutes} minute${minutes > 1 ? "s" : ""}${suffix}`;
  return diffMs < 0 ? "just now" : "due very soon";
}

export function greetingFor(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatRelativeDeadline(deadline: string | null | undefined, now = Date.now()): string {
  if (!deadline) return "No deadline";
  const t = new Date(deadline).getTime();
  if (t < now) return "Deadline passed";
  return `Due ${relativeTime(deadline, now)}`;
}