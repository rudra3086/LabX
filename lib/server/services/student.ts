import { prisma } from "../prisma";
import { ApiError } from "../http";
import { deriveTaskViewStatus } from "@/lib/date";
import { computeSubmissionPolicy } from "@/lib/submission-policy";
import {
  StudentSubmissionListItem,
  StudentSubjectSummary,
  StudentTaskDetail,
  SubmissionState,
  SubmissionStatus,
  TaskStatus,
  TaskViewStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Student services (spec §21, §24–§31, §37). Every query is scoped to the
// requesting student and never exposes another student's records.
// ---------------------------------------------------------------------------

const SUBMITTED_STATUSES: SubmissionStatus[] = ["SUBMITTED", "LATE", "GRADED"];

interface TaskRow {
  taskId: string;
  sessionId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  sessionName: string;
  title: string;
  description: string | null;
  maximumMarks: number;
  deadline: string | null;
  deadlineMs: number | null;
  taskStatus: TaskStatus;
  submissionId: string | null;
  submissionStatus: SubmissionStatus;
  submittedAt: string | null;
  fileCount: number;
  marks: number | null;
  viewStatus: TaskViewStatus;
}

async function loadTaskRows(studentId: string, nowMs: number): Promise<TaskRow[]> {
  const links = await prisma.sessionStudent.findMany({
    where: { studentId },
    select: { sessionId: true },
  });
  const sessionIds = links.map((l) => l.sessionId);
  if (sessionIds.length === 0) return [];

  const tasks = await prisma.task.findMany({
    where: {
      sessionId: { in: sessionIds },
      status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
    },
    include: {
      session: { include: { subject: true } },
      submissions: {
        where: { studentId },
        include: { grade: true, _count: { select: { files: true } } },
      },
    },
    orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
  });

  return tasks.map((task) => {
    const submission = task.submissions[0];
    const submissionStatus: SubmissionStatus = submission?.status ?? "NOT_STARTED";
    const deadline = task.deadline ? task.deadline.toISOString() : null;
    const grade = submission?.grade;
    return {
      taskId: task.id,
      sessionId: task.sessionId,
      subjectId: task.session.subjectId,
      subjectCode: task.session.subject.code,
      subjectName: task.session.subject.name,
      sessionName: task.session.name,
      title: task.title,
      description: task.description,
      maximumMarks: task.maximumMarks,
      deadline,
      deadlineMs: task.deadline ? task.deadline.getTime() : null,
      taskStatus: task.status,
      submissionId: submission?.id ?? null,
      submissionStatus,
      submittedAt: submission?.submittedAt?.toISOString() ?? null,
      fileCount: submission?._count.files ?? 0,
      marks: grade?.isFinalized ? grade.marks : null,
      viewStatus: deriveTaskViewStatus(deadline, submissionStatus, task.status, nowMs),
    };
  });
}

function toListItem(row: TaskRow): StudentSubmissionListItem {
  return {
    id: row.submissionId,
    taskId: row.taskId,
    taskTitle: row.title,
    subjectCode: row.subjectCode,
    subjectName: row.subjectName,
    sessionName: row.sessionName,
    maximumMarks: row.maximumMarks,
    deadline: row.deadline,
    status: row.submissionStatus,
    viewStatus: row.viewStatus,
    submittedAt: row.submittedAt,
    fileCount: row.fileCount,
    marks: row.marks,
  };
}

export async function getStudentTasks(
  studentId: string,
  opts: { subjectId?: string } = {}
): Promise<StudentSubmissionListItem[]> {
  const now = Date.now();
  const rows = await loadTaskRows(studentId, now);
  return rows
    .filter((r) => (opts.subjectId ? r.subjectId === opts.subjectId : true))
    .map(toListItem);
}

export async function getStudentSubmissions(studentId: string): Promise<StudentSubmissionListItem[]> {
  const now = Date.now();
  const rows = await loadTaskRows(studentId, now);
  return rows
    .filter(
      (r) =>
        r.submissionStatus !== "NOT_STARTED" ||
        r.viewStatus === "MISSED"
    )
    .sort((a, b) => {
      const at = a.submittedAt ?? a.deadline ?? "";
      const bt = b.submittedAt ?? b.deadline ?? "";
      return bt.localeCompare(at);
    })
    .map(toListItem);
}

export interface StudentGradeRow extends StudentSubmissionListItem {
  percentage: number;
}

export async function getStudentGrades(studentId: string): Promise<StudentGradeRow[]> {
  const now = Date.now();
  const rows = await loadTaskRows(studentId, now);
  return rows
    .filter((r) => r.marks !== null)
    .map((r) => ({
      ...toListItem(r),
      percentage: r.maximumMarks > 0 ? Math.round(((r.marks ?? 0) / r.maximumMarks) * 100) : 0,
    }));
}

export async function getStudentSubjects(studentId: string): Promise<StudentSubjectSummary[]> {
  const rows = await loadTaskRows(studentId, Date.now());
  const map = new Map<string, StudentSubjectSummary>();

  for (const row of rows) {
    let summary = map.get(row.subjectId);
    if (!summary) {
      summary = {
        subjectId: row.subjectId,
        code: row.subjectCode,
        name: row.subjectName,
        semester: 0,
        department: "",
        description: null,
        sessionNames: [],
        taskCount: 0,
        submittedCount: 0,
        pendingCount: 0,
        missedCount: 0,
      };
      map.set(row.subjectId, summary);
    }
    summary.taskCount += 1;
    if (!summary.sessionNames.includes(row.sessionName)) summary.sessionNames.push(row.sessionName);
    if (SUBMITTED_STATUSES.includes(row.submissionStatus)) summary.submittedCount += 1;
    else if (row.viewStatus === "MISSED") summary.missedCount += 1;
    else summary.pendingCount += 1;
  }

  const ids = [...map.keys()];
  if (ids.length > 0) {
    const subjects = await prisma.subject.findMany({ where: { id: { in: ids } } });
    for (const s of subjects) {
      const summary = map.get(s.id);
      if (summary) {
        summary.semester = s.semester;
        summary.department = s.department;
        summary.description = s.description;
      }
    }
  }

  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
}

export async function getStudentSubjectDetail(studentId: string, subjectId: string) {
  const summary = (await getStudentSubjects(studentId)).find((s) => s.subjectId === subjectId);
  if (!summary) throw new ApiError("Subject not found.", 404, "NOT_FOUND");
  const tasks = await getStudentTasks(studentId, { subjectId });
  return { subject: summary, tasks };
}

/** Enforce that the student is enrolled in the task's session; returns the task. */
export async function assertStudentTaskAccess(studentId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      session: {
        include: {
          subject: true,
          faculty: { include: { user: { select: { name: true } } } },
        },
      },
      resources: { orderBy: { createdAt: "desc" } },
      submissions: {
        where: { studentId },
        include: {
          files: { orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }] },
          versions: { orderBy: { versionNumber: "desc" }, include: { createdBy: { select: { name: true } } } },
          grade: true,
        },
      },
    },
  });
  if (!task) throw new ApiError("Task not found.", 404, "NOT_FOUND");
  if (task.status === "DRAFT") {
    throw new ApiError("This task has not been published yet.", 403, "FORBIDDEN");
  }
  const enrolled = await prisma.sessionStudent.findUnique({
    where: { sessionId_studentId: { sessionId: task.sessionId, studentId } },
  });
  if (!enrolled) {
    throw new ApiError("You are not enrolled in this practical session.", 403, "FORBIDDEN");
  }
  return task;
}

export function toSubmissionState(submission: {
  id: string;
  status: SubmissionStatus;
  notes: string | null;
  submittedAt: Date | null;
  updatedAt: Date;
  files: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    versionNumber: number;
    isLatest: boolean;
    createdAt: Date;
  }[];
  versions: {
    versionNumber: number;
    notes: string | null;
    createdAt: Date;
    createdBy: { name: string };
  }[];
  grade: {
    marks: number;
    maximumMarks: number;
    remarks: string | null;
    isFinalized: boolean;
    gradedAt: Date;
  } | null;
} | null): SubmissionState {
  if (!submission) {
    return {
      id: null,
      status: "NOT_STARTED",
      notes: "",
      submittedAt: null,
      updatedAt: null,
      latestVersion: null,
      files: [],
      versions: [],
      grade: null,
    };
  }

  const latestVersion = submission.files.reduce<number | null>(
    (max, f) => (max === null || f.versionNumber > max ? f.versionNumber : max),
    null
  );

  const grade = submission.grade;
  return {
    id: submission.id,
    status: submission.status,
    notes: submission.notes ?? "",
    submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
    updatedAt: submission.updatedAt.toISOString(),
    latestVersion,
    files: submission.files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      mimeType: f.mimeType,
      sizeBytes: f.sizeBytes,
      versionNumber: f.versionNumber,
      isLatest: f.isLatest,
      createdAt: f.createdAt.toISOString(),
    })),
    versions: submission.versions.map((v) => ({
      versionNumber: v.versionNumber,
      notes: v.notes,
      createdAt: v.createdAt.toISOString(),
      authorName: v.createdBy.name,
    })),
    grade: grade
      ? {
          marks: grade.marks,
          maximumMarks: grade.maximumMarks,
          percentage: grade.maximumMarks > 0 ? Math.round((grade.marks / grade.maximumMarks) * 100) : 0,
          remarks: grade.remarks,
          gradedAt: grade.gradedAt.toISOString(),
          isFinalized: grade.isFinalized,
        }
      : null,
  };
}

export async function getStudentTaskDetail(studentId: string, taskId: string): Promise<StudentTaskDetail> {
  const task = await assertStudentTaskAccess(studentId, taskId);
  const nowMs = Date.now();
  const submission = task.submissions[0] ?? null;
  const state = toSubmissionState(submission);

  const policy = computeSubmissionPolicy(
    {
      status: task.status,
      deadline: task.deadline ? task.deadline.getTime() : null,
      allowLateSubmission: task.allowLateSubmission,
      allowResubmission: task.allowResubmission,
      resubmissionDeadline: task.resubmissionDeadline ? task.resubmissionDeadline.getTime() : null,
    },
    state.status,
    nowMs
  );

  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      instructions: task.instructions,
      maximumMarks: task.maximumMarks,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      allowLateSubmission: task.allowLateSubmission,
      allowResubmission: task.allowResubmission,
      resubmissionDeadline: task.resubmissionDeadline ? task.resubmissionDeadline.toISOString() : null,
      maxFiles: task.maxFiles,
      maxFileSizeMb: task.maxFileSizeMb,
      requiredFileTypes: task.requiredFileTypes,
      submissionFormat: task.submissionFormat,
      fileNamingConvention: task.fileNamingConvention,
      status: task.status,
    },
    subject: {
      id: task.session.subject.id,
      code: task.session.subject.code,
      name: task.session.subject.name,
      department: task.session.subject.department,
    },
    session: {
      id: task.session.id,
      name: task.session.name,
      batch: task.session.batch,
      semester: task.session.semester,
      facultyName: task.session.faculty.user.name,
    },
    resources: task.resources.map((r) => ({
      id: r.id,
      title: r.title,
      originalName: r.originalName,
      mimeType: r.mimeType,
      sizeBytes: r.sizeBytes,
      createdAt: r.createdAt.toISOString(),
    })),
    viewStatus: deriveTaskViewStatus(
      task.deadline ? task.deadline.toISOString() : null,
      state.status,
      task.status,
      nowMs
    ),
    serverNow: new Date(nowMs).toISOString(),
    submission: state,
    policy: {
      canEditFiles: policy.canEditFiles,
      canSubmit: policy.canSubmit,
      lockReason: policy.lockReason,
      statusOnSubmit: policy.statusOnSubmit,
    },
  };
}
