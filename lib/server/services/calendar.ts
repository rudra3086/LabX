import { Role } from "@prisma/client";
import { CalendarEvent } from "@/types";
import { prisma } from "../prisma";

function toIso(date: Date): string {
  return date.toISOString();
}

export async function getCalendarEvents(userId: string, role: Role): Promise<CalendarEvent[]> {
  const sessionWhere =
    role === "FACULTY"
      ? { faculty: { userId } }
      : role === "STUDENT"
        ? { students: { some: { student: { userId } } } }
        : {};

  const sessions = await prisma.practicalSession.findMany({
    where: {
      ...sessionWhere,
      startDate: { not: null },
      status: { in: role === "STUDENT" ? ["ACTIVE", "COMPLETED"] : ["DRAFT", "ACTIVE", "COMPLETED"] },
    },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      subject: { select: { code: true, name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  const taskWhere =
    role === "FACULTY"
      ? { session: { faculty: { userId } } }
      : role === "STUDENT"
        ? { session: { students: { some: { student: { userId } } } } }
        : {};

  const tasks = await prisma.task.findMany({
    where: {
      ...taskWhere,
      deadline: { not: null },
      status: { in: role === "STUDENT" ? ["PUBLISHED", "CLOSED"] : ["DRAFT", "PUBLISHED", "CLOSED"] },
    },
    select: {
      id: true,
      title: true,
      deadline: true,
      session: { select: { subject: { select: { code: true, name: true } } } },
    },
    orderBy: { deadline: "asc" },
  });

  const sessionHref = role === "ADMIN" ? "/admin/reports" : role === "FACULTY" ? "/faculty/sessions" : "/student/tasks";
  const taskHref = role === "ADMIN" ? "/admin/reports" : role === "FACULTY" ? "/faculty/tasks" : "/student/tasks";
  return [
    ...sessions.map((session) => ({
      id: `session-${session.id}`,
      type: "SCHEDULE" as const,
      title: session.name,
      date: toIso(session.startDate!),
      endDate: session.endDate ? toIso(session.endDate) : null,
      subtitle: `${session.subject.code} · ${session.subject.name}`,
      href: `${sessionHref}${role === "ADMIN" ? "" : `/${session.id}`}`,
    })),
    ...tasks.map((task) => ({
      id: `task-${task.id}`,
      type: "DEADLINE" as const,
      title: task.title,
      date: toIso(task.deadline!),
      subtitle: `${task.session.subject.code} · Task deadline`,
      href: `${taskHref}${role === "ADMIN" ? "" : `/${task.id}`}`,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}
