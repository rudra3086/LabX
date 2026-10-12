import { prisma } from "@/lib/server/prisma";
import { NotificationType } from "@prisma/client";
import {
  reminderWindowDays,
  hasDeadlinePassed,
  notificationDedupeKey,
  duePhrase,
} from "@/lib/reminder-policy";

/**
 * Runs the deadline reminder pass (spec §99-102) against PUBLISHED/CLOSED
 * tasks with a deadline. Idempotent: every notification carries a unique
 * dedupe key, so scheduling this on-demand (or via cron) repeatedly never
 * produces duplicates.
 *
 * @returns count of notifications created per type.
 */
export async function runDeadlineReminders(
  now: Date = new Date()
): Promise<{ reminders: number; missed: number }> {
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["PUBLISHED", "CLOSED"] },
      deadline: { not: null },
    },
    include: {
      session: {
        include: {
          students: {
            include: { student: { include: { user: true } } },
          },
        },
      },
      submissions: {
        where: {
          status: { in: ["SUBMITTED", "LATE", "GRADED"] },
        },
        select: { studentId: true },
      },
    },
  });

  const toCreate: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string;
    dedupeKey: string;
  }[] = [];

  for (const task of tasks) {
    const deadline = task.deadline!;
    const submittedIds = new Set(task.submissions.map((s) => s.studentId));

    for (const link of task.session.students) {
      const student = link.student;
      const user = student.user;
      if (user.status !== "ACTIVE") continue;
      if (submittedIds.has(student.id)) continue;

      const taskLink = `/student/tasks/${task.id}`;

      // Deadline still ahead → scheduled reminder windows (7/3/1/0 days).
      if (!hasDeadlinePassed(deadline, now)) {
        const window = reminderWindowDays(deadline, now);
        if (window === null) continue;

        toCreate.push({
          userId: user.id,
          type: "DEADLINE_REMINDER",
          title: "Task deadline approaching",
          message: `"${task.title}" is ${duePhrase(deadline, now)}. Submit your practical work to avoid a missed deadline.`,
          link: taskLink,
          dedupeKey: notificationDedupeKey("reminder", task.id, user.id, window),
        });
        continue;
      }

      // Deadline in the past and nothing submitted → missed.
      toCreate.push({
        userId: user.id,
        type: "DEADLINE_MISSED",
        title: "Task deadline missed",
        message: `The deadline for "${task.title}" has passed. Submit it now if late submission is allowed.`,
        link: taskLink,
        dedupeKey: notificationDedupeKey("missed", task.id, user.id),
      });
    }
  }

  const created = await prisma.notification.createMany({
    data: toCreate,
    skipDuplicates: true,
  });

  return {
    reminders: toCreate.filter((n) => n.type === "DEADLINE_REMINDER").length,
    missed: toCreate.filter((n) => n.type === "DEADLINE_MISSED").length,
  };
}