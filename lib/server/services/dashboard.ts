import { prisma } from "../prisma";
import { deriveTaskViewStatus } from "@/lib/date";
import {
  AdminDashboardStats,
  FacultyDashboardStats,
  StudentDashboardStats,
  SubmissionStatus,
} from "@/types";

// Server-side authoritative clock (spec §28: never trust client device clock).
function nowMs() {
  return Date.now();
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [totalStudents, totalFaculty, totalSubjects, activeSessions, totalTasks, totalSubmissions] =
    await Promise.all([
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.subject.count(),
      prisma.practicalSession.count({ where: { status: "ACTIVE" } }),
      prisma.task.count(),
      prisma.submission.count(),
    ]);

  return {
    totalStudents,
    totalFaculty,
    totalSubjects,
    activeSessions,
    totalTasks,
    totalSubmissions,
  };
}

// ---------------------------------------------------------------------------
// Faculty
// ---------------------------------------------------------------------------
export async function getFacultyDashboardStats(
  facultyId: string
): Promise<FacultyDashboardStats> {
  const now = nowMs();

  const sessions = await prisma.practicalSession.findMany({
    where: { facultyId },
    include: {
      subject: true,
      students: true,
      tasks: {
        orderBy: { deadline: "asc" },
        include: {
          submissions: {
            include: { grade: true },
          },
        },
      },
    },
  });

  const submittedStatuses: SubmissionStatus[] = ["SUBMITTED", "LATE", "GRADED"];

  // --- Per-subject cards ---
  const subjectMap = new Map<string, FacultyDashboardStats["subjects"][number]>();
  let pendingSubmissions = 0;
  let ungradedSubmissions = 0;
  let lateSubmissions = 0;
  let upcomingDeadlines = 0;

  for (const session of sessions) {
    const expected = session.students.length;
    const card = subjectMap.get(session.subjectId) ?? {
      subjectId: session.subjectId,
      code: session.subject.code,
      name: session.subject.name,
      sessionId: session.id,
      sessionName: session.name,
      batch: session.batch,
      students: expected,
      totalTasks: 0,
      pendingSubmissions: 0,
      lateSubmissions: 0,
      gradedSubmissions: 0,
      submissionRatePercent: null,
      averageScorePercent: null,
      upcomingDeadlines: 0,
    };

    let taskAverageMarks = 0;
    let taskAverageMax = 0;
    let submittedCount = 0;
    let gradedCount = 0;

    for (const task of session.tasks) {
      card.totalTasks += 1;
      const when = task.deadline ? new Date(task.deadline).getTime() : null;
      const isOpen = task.status === "PUBLISHED";
      if (isOpen && when && when > now) card.upcomingDeadlines += 1;

      const subs = task.submissions;
      const countSubmitted = subs.filter((s) =>
        submittedStatuses.includes(s.status)
      ).length;
      const countUngraded = subs.filter(
        (s) =>
          (s.status === "SUBMITTED" || s.status === "LATE" || s.status === "GRADED") &&
          !s.grade
      ).length;
      const countLate = subs.filter((s) => s.status === "LATE").length;
      const countGraded = subs.filter((s) => s.grade).length;

      submittedCount += countSubmitted;
      gradedCount += countGraded;
      ungradedSubmissions += countUngraded;
      lateSubmissions += countLate;

      if (isOpen) {
        pendingSubmissions += Math.max(0, expected - countSubmitted);
      }

      for (const s of subs) {
        if (s.grade && s.grade.isFinalized) {
          taskAverageMarks += s.grade.marks;
          taskAverageMax += s.grade.maximumMarks;
        }
      }
    }

    card.submissionRatePercent = expected > 0 ? Math.round((submittedCount / expected) * 100) : null;
    card.averageScorePercent =
      taskAverageMax > 0 ? Math.round((taskAverageMarks / taskAverageMax) * 100) : null;
    card.gradedSubmissions = gradedCount;
    card.pendingSubmissions = card.totalTasks > 0
      ? Math.max(0, card.totalTasks * expected - submittedCount)
      : 0;

    subjectMap.set(session.subjectId, card);
  }

  // --- Students needing attention (transparent rule-based flags, spec §44) ---
  const attentionMap = new Map<string, FacultyDashboardStats["studentsNeedingAttention"][number]>();

  for (const session of sessions) {
    for (const ss of session.students) {
      const entry = attentionMap.get(ss.studentId) ?? {
        studentId: ss.studentId,
        name: "",
        rollNumber: "",
        averagePercent: null,
        missedCount: 0,
        flags: [],
      };
      let marks = 0;
      let max = 0;
      let hasLate = false;

      for (const task of session.tasks) {
        if (task.status === "DRAFT") continue;
        const sub = task.submissions.find((s) => s.studentId === ss.studentId);
        const deadline = task.deadline ? new Date(task.deadline).getTime() : null;

        if (sub) {
          if (sub.status === "LATE") hasLate = true;
          if (sub.grade && sub.grade.isFinalized) {
            marks += sub.grade.marks;
            max += sub.grade.maximumMarks;
          }
        } else if (task.status === "CLOSED" || (deadline && deadline < now)) {
          entry.missedCount += 1;
        }
      }

      entry.averagePercent = max > 0 ? Math.round((marks / max) * 100) : null;
      if (entry.averagePercent !== null && entry.averagePercent < 40) {
        entry.flags.push("LOW PERFORMANCE");
      }
      if (entry.missedCount >= 2) entry.flags.push("HIGH MISSED SUBMISSIONS");
      if (hasLate) entry.flags.push("HAS LATE SUBMISSIONS");

      attentionMap.set(ss.studentId, entry);
    }
  }

  // Resolve student names/roll numbers in one query.
  const studentIds = [...attentionMap.keys()];
  if (studentIds.length > 0) {
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      include: { user: true },
    });
    for (const st of students) {
      const entry = attentionMap.get(st.id);
      if (entry) {
        entry.name = st.user.name;
        entry.rollNumber = st.rollNumber;
      }
    }
  }

  const studentsNeedingAttention = [...attentionMap.values()]
    .filter((e) => e.flags.length > 0)
    .sort((a, b) => (b.averagePercent ?? 0) - (a.averagePercent ?? 0))
    .slice(0, 10);

  return {
    pendingSubmissions,
    ungradedSubmissions,
    lateSubmissions,
    upcomingDeadlines,
    subjects: [...subjectMap.values()],
    studentsNeedingAttention,
  };
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------
export async function getStudentDashboardStats(
  studentId: string
): Promise<StudentDashboardStats> {
  const now = nowMs();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: true,
      sessionLinks: { select: { sessionId: true } },
    },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const sessionIds = student.sessionLinks.map((l) => l.sessionId);
  const tasks = await prisma.task.findMany({
    where: {
      sessionId: { in: sessionIds },
      status: { in: ["PUBLISHED", "CLOSED", "ARCHIVED"] },
    },
    include: {
      session: { include: { subject: true } },
      submissions: {
        where: { studentId },
        include: { grade: true },
      },
    },
    orderBy: { deadline: "asc" },
  });

  const submittedStatuses: SubmissionStatus[] = ["SUBMITTED", "LATE", "GRADED"];
  let submittedTasks = 0;
  let lateSubmissions = 0;
  let gradedTasks = 0;
  let missedTasks = 0;
  let pendingTasks = 0;
  let marks = 0;
  let max = 0;

  const upcoming: StudentDashboardStats["upcoming"] = [];
  const recentGrades: StudentDashboardStats["recentGrades"] = [];

  for (const task of tasks) {
    const submission = task.submissions[0];
    const submissionStatus: SubmissionStatus = submission?.status ?? "NOT_STARTED";
    const viewStatus = deriveTaskViewStatus(
      task.deadline?.toISOString() ?? null,
      submissionStatus,
      task.status
    );

    const deadline = task.deadline ? task.deadline.toISOString() : null;
    const grade = submission?.grade;

    if (submittedStatuses.includes(submissionStatus)) submittedTasks += 1;
    if (submissionStatus === "LATE") lateSubmissions += 1;
    if (submissionStatus === "MISSED" || viewStatus === "MISSED") missedTasks += 1;
    if ((task.status === "PUBLISHED") && !submittedStatuses.includes(submissionStatus)) {
      pendingTasks += 1;
    }
    if (grade?.isFinalized) {
      gradedTasks += 1;
      marks += grade.marks;
      max += grade.maximumMarks;
      recentGrades.push({
        taskId: task.id,
        taskTitle: task.title,
        subjectName: task.session.subject.name,
        subjectCode: task.session.subject.code,
        marks: grade.marks,
        maximumMarks: grade.maximumMarks,
        percentage: grade.maximumMarks > 0 ? Math.round((grade.marks / grade.maximumMarks) * 100) : 0,
        remarks: grade.remarks,
        gradedAt: grade.gradedAt.toISOString(),
      });
    }

    if (deadline && new Date(deadline).getTime() > now && task.status === "PUBLISHED") {
      upcoming.push({
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
        taskStatus: task.status,
        viewStatus,
        submissionStatus,
        marks: grade?.isFinalized ? { obtained: grade.marks, max: grade.maximumMarks } : null,
        submittedAt: submission?.submittedAt?.toISOString() ?? null,
      });
    }
  }

  recentGrades.sort((a, b) => new Date(b.gradedAt).getTime() - new Date(a.gradedAt).getTime());

  return {
    assignedTasks: tasks.length,
    submittedTasks,
    pendingTasks,
    lateSubmissions,
    missedTasks,
    gradedTasks,
    averageScorePercent: max > 0 ? Math.round((marks / max) * 100) : null,
    upcoming: upcoming.slice(0, 6),
    recentGrades: recentGrades.slice(0, 6),
  };
}