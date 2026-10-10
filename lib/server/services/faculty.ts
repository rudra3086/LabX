import { prisma } from "../prisma";
import { ApiError } from "../http";

// ---------------------------------------------------------------------------
// Faculty services (spec §14, §15, §16, §17). All queries are scoped to the
// faculty member's own data.
// ---------------------------------------------------------------------------

export interface FacultySubjectCard {
  subjectId: string;
  code: string;
  name: string;
  semester: number;
  department: string;
  description: string | null;
  sessionCount: number;
  studentCount: number;
}

export interface SessionListItem {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  name: string;
  description: string | null;
  semester: number;
  batch: string | null;
  startDate: string | null;
  endDate: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  studentCount: number;
  taskCount: number;
  createdAt: string;
}

export interface SessionStudentRow {
  id: string;
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  batch: string | null;
}

export interface SessionTaskRow {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  maximumMarks: number;
  deadline: string | null;
  submittedCount: number;
  totalSubmissions: number;
  gradedCount: number;
  createdAt: string;
}

function toSessionListItem(s: {
  id: string;
  subjectId: string;
  name: string;
  description: string | null;
  semester: number;
  batch: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdAt: Date;
  subject: { code: string; name: string };
  _count: { students: number; tasks: number };
}): SessionListItem {
  return {
    id: s.id,
    subjectId: s.subjectId,
    subjectCode: s.subject.code,
    subjectName: s.subject.name,
    name: s.name,
    description: s.description,
    semester: s.semester,
    batch: s.batch,
    startDate: s.startDate ? s.startDate.toISOString() : null,
    endDate: s.endDate ? s.endDate.toISOString() : null,
    status: s.status,
    studentCount: s._count.students,
    taskCount: s._count.tasks,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function getFacultySubjects(facultyId: string): Promise<FacultySubjectCard[]> {
  const subjects = await prisma.subject.findMany({
    where: { status: "ACTIVE", facultyAssignments: { some: { facultyId } } },
    include: {
      sessions: {
        where: { facultyId },
        include: { students: { select: { studentId: true } } },
      },
    },
    orderBy: [{ code: "asc" }],
  });

  return subjects.map((subject) => {
    const studentIds = new Set<string>();
    for (const session of subject.sessions) {
      for (const ss of session.students) studentIds.add(ss.studentId);
    }
    return {
      subjectId: subject.id,
      code: subject.code,
      name: subject.name,
      semester: subject.semester,
      department: subject.department,
      description: subject.description,
      sessionCount: subject.sessions.length,
      studentCount: studentIds.size,
    };
  });
}

export async function getFacultySessions(
  facultyId: string,
  subjectId?: string
): Promise<SessionListItem[]> {
  const sessions = await prisma.practicalSession.findMany({
    where: {
      facultyId,
      ...(subjectId ? { subjectId } : {}),
    },
    include: {
      subject: { select: { code: true, name: true } },
      _count: { select: { students: true, tasks: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return sessions.map(toSessionListItem);
}

/** Sessions the faculty member owns; throws 403 for anything else. */
export async function assertSessionOwnership(facultyId: string, sessionId: string) {
  const session = await prisma.practicalSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new ApiError("Session not found.", 404, "NOT_FOUND");
  if (session.facultyId !== facultyId) {
    throw new ApiError("You do not have access to this session.", 403, "FORBIDDEN");
  }
  return session;
}

export async function getFacultySessionDetail(facultyId: string, sessionId: string) {
  await assertSessionOwnership(facultyId, sessionId);
  const session = await prisma.practicalSession.findUnique({
    where: { id: sessionId },
    include: {
      subject: { select: { id: true, code: true, name: true, department: true } },
      _count: { select: { students: true, tasks: true } },
    },
  });
  if (!session) throw new ApiError("Session not found.", 404, "NOT_FOUND");
  return {
    id: session.id,
    subjectId: session.subjectId,
    subject: session.subject,
    name: session.name,
    description: session.description,
    semester: session.semester,
    batch: session.batch,
    startDate: session.startDate ? session.startDate.toISOString() : null,
    endDate: session.endDate ? session.endDate.toISOString() : null,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    studentCount: session._count.students,
    taskCount: session._count.tasks,
  };
}

export async function getSessionStudents(
  facultyId: string,
  sessionId: string
): Promise<SessionStudentRow[]> {
  await assertSessionOwnership(facultyId, sessionId);
  const rows = await prisma.sessionStudent.findMany({
    where: { sessionId },
    include: {
      student: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
    orderBy: [{ student: { rollNumber: "asc" } }],
  });
  return rows.map((r) => ({
    id: r.student.id,
    studentId: r.student.studentId,
    rollNumber: r.student.rollNumber,
    name: r.student.user.name,
    email: r.student.user.email,
    batch: r.student.batch,
  }));
}

/** Active students who are not yet enrolled in the session (candidates to add). */
export async function getEnrollableStudents(
  facultyId: string,
  sessionId: string
): Promise<SessionStudentRow[]> {
  await assertSessionOwnership(facultyId, sessionId);
  const rows = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      NOT: { sessionLinks: { some: { sessionId } } },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ rollNumber: "asc" }],
  });
  return rows.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    rollNumber: s.rollNumber,
    name: s.user.name,
    email: s.user.email,
    batch: s.batch,
  }));
}

export async function getSessionTasks(
  facultyId: string,
  sessionId: string
): Promise<SessionTaskRow[]> {
  await assertSessionOwnership(facultyId, sessionId);
  const tasks = await prisma.task.findMany({
    where: { sessionId },
    include: {
      submissions: { select: { status: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    maximumMarks: t.maximumMarks,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    submittedCount: t.submissions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "LATE" || s.status === "GRADED"
    ).length,
    totalSubmissions: t.submissions.length,
    gradedCount: t.submissions.filter((s) => s.status === "GRADED").length,
    createdAt: t.createdAt.toISOString(),
  }));
}

export interface FacultyTaskOverviewRow {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  maximumMarks: number;
  deadline: string | null;
  sessionId: string;
  sessionName: string;
  subjectCode: string;
  enrolledCount: number;
  submittedCount: number;
  createdAt: string;
}

/** All tasks across a faculty member's sessions (spec §12 task overview). */
export async function getFacultyTaskOverview(
  facultyId: string
): Promise<FacultyTaskOverviewRow[]> {
  const tasks = await prisma.task.findMany({
    where: { session: { facultyId } },
    include: {
      session: {
        select: {
          name: true,
          subject: { select: { code: true } },
          _count: { select: { students: true } },
        },
      },
      submissions: { select: { status: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    maximumMarks: t.maximumMarks,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    sessionId: t.sessionId,
    sessionName: t.session.name,
    subjectCode: t.session.subject.code,
    enrolledCount: t.session._count.students,
    submittedCount: t.submissions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "LATE" || s.status === "GRADED"
    ).length,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function getFacultyTaskDetail(facultyId: string, taskId: string) {  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      session: {
        include: {
          subject: { select: { code: true, name: true } },
          _count: { select: { students: true } },
        },
      },      submissions: { select: { status: true } },
      resources: { select: { id: true, title: true, originalName: true, sizeBytes: true, createdAt: true } },
    },
  });
  if (!task) throw new ApiError("Task not found.", 404, "NOT_FOUND");
  if (task.session.facultyId !== facultyId) {
    throw new ApiError("You do not have access to this task.", 403, "FORBIDDEN");
  }

  const counts = { DRAFT: 0, SUBMITTED: 0, LATE: 0, GRADED: 0 } as Record<string, number>;
  for (const s of task.submissions) counts[s.status] = (counts[s.status] ?? 0) + 1;

  return {
    id: task.id,
    sessionId: task.sessionId,
    sessionName: task.session.name,
    sessionStatus: task.session.status,
    subjectCode: task.session.subject.code,
    subjectName: task.session.subject.name,
    enrolledStudents: task.session._count.students,
    title: task.title,
    description: task.description,
    instructions: task.instructions,
    maximumMarks: task.maximumMarks,
    deadline: task.deadline ? task.deadline.toISOString() : null,
    allowLateSubmission: task.allowLateSubmission,
    submissionFormat: task.submissionFormat,
    fileNamingConvention: task.fileNamingConvention,
    requiredFileTypes: task.requiredFileTypes,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    counts,
    resources: task.resources.map((r) => ({
      id: r.id,
      title: r.title,
      originalName: r.originalName,
      sizeBytes: r.sizeBytes,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}