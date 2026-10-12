/**
 * Deadline reminder policy (spec §99-102). Pure, testable helpers that decide
 * whether a student should receive a DEADLINE_REMINDER or DEADLINE_MISSED
 * notification. The idempotency keys keep the on-demand job repeat-safe.
 */

export const REMINDER_WINDOWS = [7, 3, 1, 0] as const;
export type ReminderWindow = (typeof REMINDER_WINDOWS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the reminder window (7/3/1/0 days before deadline) the task is
 * currently in, or `null` if no reminder should fire yet. Ceil-based so a
 * deadline 6.5 days away still counts as 7 days.
 */
export function reminderWindowDays(
  deadline: Date,
  now: Date = new Date()
): ReminderWindow | null {
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) return null;

  const days = Math.ceil(diffMs / DAY_MS);
  for (const window of REMINDER_WINDOWS) {
    if (days <= window) return window;
  }
  return null;
}

/** True when the deadline has passed by the given grace period (default 0). */
export function hasDeadlinePassed(
  deadline: Date,
  now: Date = new Date(),
  graceMs = 0
): boolean {
  return deadline.getTime() + graceMs < now.getTime();
}

/** Deterministic dedupe key so a job run never duplicates a notification. */
export function notificationDedupeKey(
  kind: "reminder" | "missed",
  taskId: string,
  userId: string,
  extra?: string | number
): string {
  return extra === undefined
    ? `${kind}:${taskId}:${userId}`
    : `${kind}:${taskId}:${userId}:${extra}`;
}

/** Human-friendly "due in X days" phrasing for a reminder message. */
export function duePhrase(deadline: Date, now: Date = new Date()): string {
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) return "overdue";
  const days = Math.ceil(diffMs / DAY_MS);
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `due in ${days} days`;
}