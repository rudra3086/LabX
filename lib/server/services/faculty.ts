import { prisma } from "../prisma";
import { ApiError } from "../http";
import { SubmissionStatus, TaskStatus } from "@/types";
import { toSubmissionState } from "./student";

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

/** A task the faculty member owns; throws 404/403 otherwise. Includes session. */
export async function assertTaskOwnership(facultyId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      session: { include: { subject: { select: { id: true, code: true, name: true } } } },
    },
  });
  if (!task) throw new ApiError("Task not found.", 404, "NOT_FOUND");
  if (task.session.facultyId !== facultyId) {
    throw new ApiError("You do not have access to this task.", 403, "FORBIDDEN");
  }
  return task;
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
  const session = await assertSessionOwnership(facultyId, sessionId);
  const rows = await prisma.student.findMany({
    where: {
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      subjectLinks: { some: { subjectId: session.subjectId } },
      batch: session.batch ? session.batch : { not: null },
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

export interface TaskResourceRow {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export function toTaskResourceRow(r: {
  id: string;
  title: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}): TaskResourceRow {
  return {
    id: r.id,
    title: r.title,
    originalName: r.originalName,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getTaskResources(facultyId: string, taskId: string): Promise<TaskResourceRow[]> {
  await assertTaskOwnership(facultyId, taskId);
  const rows = await prisma.taskResource.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toTaskResourceRow);
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
      resources: { select: { id: true, title: true, originalName: true, mimeType: true, sizeBytes: true, createdAt: true } },
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
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Faculty grading (spec §33–§37, §62, §92, §121, §162)
// ---------------------------------------------------------------------------

export interface TaskSubmissionRow {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  batch: string | null;
  submissionId: string | null;
  status: SubmissionStatus;
  submittedAt: string | null;
  fileCount: number;
  marks: number | null;
  maximumMarks: number;
  isFinalized: boolean;
  gradedAt: string | null;
}

export interface TaskSubmissionsData {
  task: {
    id: string;
    title: string;
    maximumMarks: number;
    deadline: string | null;
    status: TaskStatus;
    sessionId: string;
    sessionName: string;
    subjectCode: string;
    subjectName: string;
  };
  counts: {
    enrolled: number;
    submitted: number;
    pending: number;
    late: number;
    graded: number;
    ungraded: number;
  };
  rows: TaskSubmissionRow[];
}

const SUBMITTED_STATUSES: SubmissionStatus[] = ["SUBMITTED", "LATE", "GRADED"];

/** Central submission list for a task (spec §33): every enrolled student + state. */
export async function getTaskSubmissions(
  facultyId: string,
  taskId: string
): Promise<TaskSubmissionsData> {
  const task = await assertTaskOwnership(facultyId, taskId);

  const enrolled = await prisma.sessionStudent.findMany({
    where: { sessionId: task.sessionId },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          submissions: {
            where: { taskId },
            include: { grade: true, _count: { select: { files: true } } },
          },
        },
      },
    },
    orderBy: { student: { rollNumber: "asc" } },
  });

  const rows: TaskSubmissionRow[] = enrolled.map(({ student }) => {
    const sub = student.submissions[0];
    const grade = sub?.grade ?? null;
    return {
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: student.user.name,
      email: student.user.email,
      batch: student.batch,
      submissionId: sub?.id ?? null,
      status: sub?.status ?? "NOT_STARTED",
      submittedAt: sub?.submittedAt ? sub.submittedAt.toISOString() : null,
      fileCount: sub?._count.files ?? 0,
      marks: grade ? grade.marks : null,
      maximumMarks: task.maximumMarks,
      isFinalized: grade?.isFinalized ?? false,
      gradedAt: grade?.gradedAt ? grade.gradedAt.toISOString() : null,
    };
  });

  const submitted = rows.filter((r) => SUBMITTED_STATUSES.includes(r.status)).length;
  const graded = rows.filter((r) => r.status === "GRADED").length;
  const late = rows.filter((r) => r.status === "LATE").length;

  return {
    task: {
      id: task.id,
      title: task.title,
      maximumMarks: task.maximumMarks,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      status: task.status,
      sessionId: task.sessionId,
      sessionName: task.session.name,
      subjectCode: task.session.subject.code,
      subjectName: task.session.subject.name,
    },
    counts: {
      enrolled: rows.length,
      submitted,
      pending: rows.length - submitted,
      late,
      graded,
      ungraded: submitted - graded,
    },
    rows,
  };
}

/** Full submission detail for grading one student's practical (spec §34). */
export async function getSubmissionForGrading(
  facultyId: string,
  taskId: string,
  studentId: string
) {
  const task = await assertTaskOwnership(facultyId, taskId);

  const enrolled = await prisma.sessionStudent.findUnique({
    where: { sessionId_studentId: { sessionId: task.sessionId, studentId } },
  });
  if (!enrolled) {
    throw new ApiError("This student is not enrolled in the task's session.", 404, "NOT_FOUND");
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!student) throw new ApiError("Student not found.", 404, "NOT_FOUND");

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: {
      files: { orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }] },
      versions: { orderBy: { versionNumber: "desc" }, include: { createdBy: { select: { name: true } } } },
      grade: true,
    },
  });

  return {
    student: {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      rollNumber: student.rollNumber,
      batch: student.batch,
    },
    task: {
      id: task.id,
      title: task.title,
      maximumMarks: task.maximumMarks,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      status: task.status,
    },
    submission: toSubmissionState(submission),
  };
}

export type GradingDetail = Awaited<ReturnType<typeof getSubmissionForGrading>>;

export interface GradeResult {
  studentName: string;
  taskTitle: string;
  marks: number;
  maximumMarks: number;
  remarks: string | null;
  isFinalized: boolean;
  gradedAt: string;
}

/**
 * Create or update a grade (spec §35, §36, §92). Marks are validated against the
 * task maximum server-side; edits are recorded in `GradeAudit`; the submission is
 * marked GRADED and the student is notified.
 */
export async function gradeSubmission(
  facultyId: string,
  graderUserId: string,
  taskId: string,
  studentId: string,
  data: { marks: number; remarks: string | null }
): Promise<GradeResult> {
  const task = await assertTaskOwnership(facultyId, taskId);

  if (data.marks < 0 || data.marks > task.maximumMarks) {
    throw new ApiError("Marks are out of range.", 422, "VALIDATION_ERROR", {
      marks: [`Marks must be between 0 and ${task.maximumMarks}.`],
    });
  }

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: {
      grade: true,
      student: { include: { user: { select: { id: true, name: true } } } },
    },
  });
  if (!submission) {
    throw new ApiError("This student has not submitted this practical.", 404, "NOT_FOUND");
  }
  if (!SUBMITTED_STATUSES.includes(submission.status)) {
    throw new ApiError(
      "Only submitted practicals can be graded.",
      400,
      "INVALID_TRANSITION"
    );
  }

  const previous = submission.grade;
  const now = new Date();

  const grade = await prisma.$transaction(async (tx) => {
    const saved = await tx.grade.upsert({
      where: { submissionId: submission.id },
      create: {
        submissionId: submission.id,
        marks: data.marks,
        maximumMarks: task.maximumMarks,
        remarks: data.remarks,
        isFinalized: true,
        gradedById: graderUserId,
        gradedAt: now,
      },
      update: {
        marks: data.marks,
        maximumMarks: task.maximumMarks,
        remarks: data.remarks,
        isFinalized: true,
        gradedById: graderUserId,
        gradedAt: now,
      },
    });

    if (previous) {
      await tx.gradeAudit.create({
        data: {
          gradeId: saved.id,
          previousMarks: previous.marks,
          newMarks: data.marks,
          updatedById: graderUserId,
        },
      });
    }

    if (submission.status !== "GRADED") {
      await tx.submission.update({
        where: { id: submission.id },
        data: { status: "GRADED" },
      });
    }

    return saved;
  });

  await prisma.notification.create({
    data: {
      userId: submission.student.user.id,
      type: "SUBMISSION_GRADED",
      title: "Practical graded",
      message: `Your submission for "${task.title}" was graded ${data.marks}/${task.maximumMarks}.`,
      link: `/student/tasks/${taskId}`,
    },
  });

  return {
    studentName: submission.student.user.name,
    taskTitle: task.title,
    marks: grade.marks,
    maximumMarks: grade.maximumMarks,
    remarks: grade.remarks,
    isFinalized: grade.isFinalized,
    gradedAt: grade.gradedAt.toISOString(),
  };
}

export interface FacultyStudentOverviewRow {
  id: string;
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  batch: string | null;
  sessions: Array<{
    id: string;
    name: string;
    subjectCode: string;
  }>;
}

export async function getFacultyEnrolledStudents(
  facultyId: string
): Promise<FacultyStudentOverviewRow[]> {
  const sessions = await prisma.practicalSession.findMany({
    where: { facultyId },
    select: {
      id: true,
      name: true,
      subject: { select: { code: true } },
      students: {
        select: {
          student: {
            select: {
              id: true,
              studentId: true,
              rollNumber: true,
              department: true,
              semester: true,
              batch: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });

  const studentMap = new Map<string, FacultyStudentOverviewRow>();

  for (const sess of sessions) {
    for (const enr of sess.students) {
      const st = enr.student;
      let existing = studentMap.get(st.id);
      if (!existing) {
        existing = {
          id: st.id,
          studentId: st.studentId,
          rollNumber: st.rollNumber,
          name: st.user.name,
          email: st.user.email,
          department: st.department,
          semester: st.semester,
          batch: st.batch,
          sessions: [],
        };
        studentMap.set(st.id, existing);
      }
      existing.sessions.push({
        id: sess.id,
        name: sess.name,
        subjectCode: sess.subject.code,
      });
    }
  }

  return Array.from(studentMap.values()).sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber)
  );
}