import { prisma } from "../prisma";
import { ApiError } from "../http";
import {
  PdfDocument,
  measureText,
  truncateToWidth,
  wrapText,
  type PdfColor,
} from "../pdf";

export interface StudentSubjectPerformance {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  assignedTasks: number;
  submittedCount: number;
  lateCount: number;
  missedCount: number;
  gradedCount: number;
  totalMarksObtained: number;
  totalMaximumMarks: number;
  averagePercentage: number | null;
}

export interface StudentMonthlyReportData {
  student: {
    id: string;
    studentId: string;
    rollNumber: string;
    name: string;
    email: string;
    department: string;
    semester: number;
    batch: string | null;
  };
  period: {
    year: number;
    month: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  status: "COMPLETE" | "PARTIALLY GRADED" | "NO DATA";
  summary: {
    assignedTasks: number;
    submittedCount: number;
    pendingCount: number;
    lateCount: number;
    missedCount: number;
    gradedCount: number;
    submissionRate: number; // percentage (submitted / assigned * 100)
    totalMarksObtained: number;
    totalMaximumMarks: number;
    averageScore: number | null; // weighted average percentage
  };
  subjectPerformance: StudentSubjectPerformance[];
  remarks: Array<{
    taskId: string;
    taskTitle: string;
    subjectCode: string;
    marks: number;
    maximumMarks: number;
    remarks: string;
    gradedAt: string;
  }>;
  generatedAt: string;
}

export interface ClassStudentRow {
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  batch: string | null;
  assignedTasks: number;
  submittedCount: number;
  lateCount: number;
  missedCount: number;
  gradedCount: number;
  totalMarks: number;
  maxMarks: number;
  averagePercentage: number | null;
  status: "COMPLETE" | "PARTIALLY GRADED" | "NO DATA";
  indicator: "GOOD_STANDING" | "LOW_PERFORMANCE" | "HIGH_MISSED" | "HIGH_LATE";
}

export interface ClassMonthlyReportData {
  session: {
    id: string;
    name: string;
    subjectCode: string;
    subjectName: string;
    semester: number;
    batch: string | null;
    facultyName: string;
  };
  period: {
    year: number;
    month: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  classMetrics: {
    totalStudents: number;
    totalTasks: number;
    expectedSubmissions: number; // students * tasks
    totalSubmissions: number;
    totalLateSubmissions: number;
    totalMissedSubmissions: number;
    totalGradedSubmissions: number;
    submissionRate: number; // percentage
    lateRate: number; // percentage of submitted
    missedRate: number; // percentage of expected
    classAverageScore: number | null; // weighted average percentage
  };
  students: ClassStudentRow[];
  generatedAt: string;
}

export interface PlatformReportData {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  platformMetrics: {
    totalActiveStudents: number;
    totalActiveFaculty: number;
    totalActiveSubjects: number;
    totalActiveSessions: number;
    totalTasksInPeriod: number;
    totalSubmissionsInPeriod: number;
    overallAveragePercentage: number | null;
  };
  subjects: Array<{
    subjectId: string;
    code: string;
    name: string;
    department: string;
    sessionCount: number;
    studentCount: number;
    taskCount: number;
    submissionCount: number;
    averagePercentage: number | null;
  }>;
  generatedAt: string;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function getMonthBounds(year: number, month: number): { start: Date; end: Date; name: string } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const name = MONTH_NAMES[month - 1] ?? "Unknown";
  return { start, end, name };
}

/**
 * Generates the deterministic monthly student report (spec §39, §40, §65, §158, §162, §163, §164).
 */
export async function getStudentMonthlyReport(
  studentId: string,
  year: number,
  month: number
): Promise<StudentMonthlyReportData> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  });

  if (!student) {
    throw new ApiError("Student not found", 404, "NOT_FOUND");
  }

  const { start, end, name: monthName } = getMonthBounds(year, month);
  const now = new Date();

  // Find all practical sessions the student is enrolled in
  const enrollments = await prisma.sessionStudent.findMany({
    where: { studentId },
    include: {
      session: {
        include: {
          subject: true,
          tasks: {
            where: {
              status: { in: ["PUBLISHED", "CLOSED"] },
              OR: [
                { deadline: { gte: start, lt: end } },
                {
                  deadline: null,
                  createdAt: { gte: start, lt: end },
                },
              ],
            },
            include: {
              submissions: {
                where: { studentId },
                include: { grade: true },
              },
            },
          },
        },
      },
    },
  });

  let totalAssigned = 0;
  let totalSubmitted = 0;
  let totalLate = 0;
  let totalMissed = 0;
  let totalGraded = 0;
  let overallMarksObtained = 0;
  let overallMaxMarks = 0;

  const subjectMap = new Map<string, StudentSubjectPerformance>();
  const remarksList: StudentMonthlyReportData["remarks"] = [];

  for (const enr of enrollments) {
    const session = enr.session;
    const subject = session.subject;

    let subPerf = subjectMap.get(subject.id);
    if (!subPerf) {
      subPerf = {
        subjectId: subject.id,
        subjectCode: subject.code,
        subjectName: subject.name,
        assignedTasks: 0,
        submittedCount: 0,
        lateCount: 0,
        missedCount: 0,
        gradedCount: 0,
        totalMarksObtained: 0,
        totalMaximumMarks: 0,
        averagePercentage: null,
      };
      subjectMap.set(subject.id, subPerf);
    }

    for (const task of session.tasks) {
      totalAssigned += 1;
      subPerf.assignedTasks += 1;

      const sub = task.submissions[0];
      const isSubmitted = sub && ["SUBMITTED", "LATE", "GRADED"].includes(sub.status);
      const isLate = sub?.status === "LATE";
      const isDeadlinePassed = task.deadline ? now > task.deadline : false;
      const isMissed = !isSubmitted && isDeadlinePassed;

      if (isSubmitted) {
        totalSubmitted += 1;
        subPerf.submittedCount += 1;
      }
      if (isLate) {
        totalLate += 1;
        subPerf.lateCount += 1;
      }
      if (isMissed) {
        totalMissed += 1;
        subPerf.missedCount += 1;
      }

      if (sub?.grade) {
        totalGraded += 1;
        subPerf.gradedCount += 1;
        subPerf.totalMarksObtained += sub.grade.marks;
        subPerf.totalMaximumMarks += sub.grade.maximumMarks;
        overallMarksObtained += sub.grade.marks;
        overallMaxMarks += sub.grade.maximumMarks;

        if (sub.grade.remarks && sub.grade.remarks.trim()) {
          remarksList.push({
            taskId: task.id,
            taskTitle: task.title,
            subjectCode: subject.code,
            marks: sub.grade.marks,
            maximumMarks: sub.grade.maximumMarks,
            remarks: sub.grade.remarks.trim(),
            gradedAt: sub.grade.gradedAt.toISOString(),
          });
        }
      }
    }
  }

  // Calculate subject-wise percentages
  const subjectPerformance: StudentSubjectPerformance[] = [];
  for (const perf of subjectMap.values()) {
    if (perf.totalMaximumMarks > 0) {
      perf.averagePercentage = Math.round((perf.totalMarksObtained / perf.totalMaximumMarks) * 1000) / 10;
    }
    subjectPerformance.push(perf);
  }

  const overallAverageScore =
    overallMaxMarks > 0
      ? Math.round((overallMarksObtained / overallMaxMarks) * 1000) / 10
      : null;

  const submissionRate =
    totalAssigned > 0
      ? Math.round((totalSubmitted / totalAssigned) * 1000) / 10
      : 0;

  // Determine report status (spec §163)
  let status: StudentMonthlyReportData["status"] = "COMPLETE";
  if (totalAssigned === 0) {
    status = "NO DATA";
  } else if (totalGraded < totalSubmitted || totalSubmitted < totalAssigned) {
    status = "PARTIALLY GRADED";
  }

  const reportData: StudentMonthlyReportData = {
    student: {
      id: student.id,
      studentId: student.studentId,
      rollNumber: student.rollNumber,
      name: student.user.name,
      email: student.user.email,
      department: student.department,
      semester: student.semester,
      batch: student.batch,
    },
    period: {
      year,
      month,
      monthName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    status,
    summary: {
      assignedTasks: totalAssigned,
      submittedCount: totalSubmitted,
      pendingCount: Math.max(0, totalAssigned - totalSubmitted - totalMissed),
      lateCount: totalLate,
      missedCount: totalMissed,
      gradedCount: totalGraded,
      submissionRate,
      totalMarksObtained: overallMarksObtained,
      totalMaximumMarks: overallMaxMarks,
      averageScore: overallAverageScore,
    },
    subjectPerformance,
    remarks: remarksList,
    generatedAt: now.toISOString(),
  };

  // Upsert snapshot into MonthlyReport table (spec §103)
  try {
    await prisma.monthlyReport.upsert({
      where: {
        studentId_year_month_scopeType_scopeId: {
          studentId,
          year,
          month,
          scopeType: "ALL",
          scopeId: "",
        },
      },
      create: {
        studentId,
        year,
        month,
        scopeType: "ALL",
        scopeId: "",
        data: reportData as unknown as object,
        generatedAt: now,
      },
      update: {
        data: reportData as unknown as object,
        generatedAt: now,
      },
    });
  } catch (err) {
    // Non-critical if table write fails; log silently
    console.error("Failed to persist MonthlyReport snapshot:", err);
  }

  return reportData;
}

/**
 * Generates the faculty class/session monthly report (spec §43, §159, §160).
 */
export async function getClassMonthlyReport(
  sessionId: string,
  year: number,
  month: number
): Promise<ClassMonthlyReportData> {
  const session = await prisma.practicalSession.findUnique({
    where: { id: sessionId },
    include: {
      subject: true,
      faculty: { include: { user: true } },
      students: {
        include: {
          student: { include: { user: true } },
        },
      },
      tasks: {
        where: {
          status: { in: ["PUBLISHED", "CLOSED"] },
        },
        include: {
          submissions: {
            include: { grade: true },
          },
        },
      },
    },
  });

  if (!session) {
    throw new ApiError("Session not found", 404, "NOT_FOUND");
  }

  const { start, end, name: monthName } = getMonthBounds(year, month);
  const now = new Date();

  // Filter tasks belonging to the reporting month
  const monthTasks = session.tasks.filter((t) => {
    if (t.deadline) {
      return t.deadline >= start && t.deadline < end;
    }
    return t.createdAt >= start && t.createdAt < end;
  });

  const totalStudents = session.students.length;
  const totalTasks = monthTasks.length;
  const expectedSubmissions = totalStudents * totalTasks;

  let totalSubmissions = 0;
  let totalLateSubmissions = 0;
  let totalMissedSubmissions = 0;
  let totalGradedSubmissions = 0;
  let classMarksObtained = 0;
  let classMaxMarks = 0;

  const studentRows: ClassStudentRow[] = [];

  for (const enr of session.students) {
    const student = enr.student;
    let sAssigned = totalTasks;
    let sSubmitted = 0;
    let sLate = 0;
    let sMissed = 0;
    let sGraded = 0;
    let sMarks = 0;
    let sMaxMarks = 0;

    for (const task of monthTasks) {
      const sub = task.submissions.find((s) => s.studentId === student.id);
      const isSubmitted = sub && ["SUBMITTED", "LATE", "GRADED"].includes(sub.status);
      const isLate = sub?.status === "LATE";
      const isDeadlinePassed = task.deadline ? now > task.deadline : false;
      const isMissed = !isSubmitted && isDeadlinePassed;

      if (isSubmitted) {
        sSubmitted += 1;
        totalSubmissions += 1;
      }
      if (isLate) {
        sLate += 1;
        totalLateSubmissions += 1;
      }
      if (isMissed) {
        sMissed += 1;
        totalMissedSubmissions += 1;
      }

      if (sub?.grade) {
        sGraded += 1;
        totalGradedSubmissions += 1;
        sMarks += sub.grade.marks;
        sMaxMarks += sub.grade.maximumMarks;
        classMarksObtained += sub.grade.marks;
        classMaxMarks += sub.grade.maximumMarks;
      }
    }

    const sAvg =
      sMaxMarks > 0
        ? Math.round((sMarks / sMaxMarks) * 1000) / 10
        : null;

    let sStatus: ClassStudentRow["status"] = "COMPLETE";
    if (sAssigned === 0) {
      sStatus = "NO DATA";
    } else if (sGraded < sSubmitted || sSubmitted < sAssigned) {
      sStatus = "PARTIALLY GRADED";
    }

    // Rule-based indicators (spec §44)
    let indicator: ClassStudentRow["indicator"] = "GOOD_STANDING";
    if (sAvg !== null && sAvg < 40) {
      indicator = "LOW_PERFORMANCE";
    } else if (sMissed >= 2) {
      indicator = "HIGH_MISSED";
    } else if (sLate >= 2) {
      indicator = "HIGH_LATE";
    }

    studentRows.push({
      studentId: student.id,
      rollNumber: student.rollNumber,
      name: student.user.name,
      email: student.user.email,
      batch: student.batch,
      assignedTasks: sAssigned,
      submittedCount: sSubmitted,
      lateCount: sLate,
      missedCount: sMissed,
      gradedCount: sGraded,
      totalMarks: sMarks,
      maxMarks: sMaxMarks,
      averagePercentage: sAvg,
      status: sStatus,
      indicator,
    });
  }

  const submissionRate =
    expectedSubmissions > 0
      ? Math.round((totalSubmissions / expectedSubmissions) * 1000) / 10
      : 0;

  const lateRate =
    totalSubmissions > 0
      ? Math.round((totalLateSubmissions / totalSubmissions) * 1000) / 10
      : 0;

  const missedRate =
    expectedSubmissions > 0
      ? Math.round((totalMissedSubmissions / expectedSubmissions) * 1000) / 10
      : 0;

  const classAverageScore =
    classMaxMarks > 0
      ? Math.round((classMarksObtained / classMaxMarks) * 1000) / 10
      : null;

  return {
    session: {
      id: session.id,
      name: session.name,
      subjectCode: session.subject.code,
      subjectName: session.subject.name,
      semester: session.semester,
      batch: session.batch,
      facultyName: session.faculty.user.name,
    },
    period: {
      year,
      month,
      monthName,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    classMetrics: {
      totalStudents,
      totalTasks,
      expectedSubmissions,
      totalSubmissions,
      totalLateSubmissions,
      totalMissedSubmissions,
      totalGradedSubmissions,
      submissionRate,
      lateRate,
      missedRate,
      classAverageScore,
    },
    students: studentRows,
    generatedAt: now.toISOString(),
  };
}

/**
 * Generates admin platform monthly overview report.
 */
export async function getPlatformMonthlyReport(
  year: number,
  month: number
): Promise<PlatformReportData> {
  const { start, end, name: monthName } = getMonthBounds(year, month);
  const now = new Date();

  const [
    studentCount,
    facultyCount,
    subjectCount,
    sessionCount,
    subjects,
    monthTasks,
  ] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.faculty.count({ where: { status: "ACTIVE" } }),
    prisma.subject.count({ where: { status: "ACTIVE" } }),
    prisma.practicalSession.count({ where: { status: "ACTIVE" } }),
    prisma.subject.findMany({
      where: { status: "ACTIVE" },
      include: {
        sessions: {
          include: {
            students: true,
            tasks: {
              where: {
                status: { in: ["PUBLISHED", "CLOSED"] },
                OR: [
                  { deadline: { gte: start, lt: end } },
                  { deadline: null, createdAt: { gte: start, lt: end } },
                ],
              },
              include: {
                submissions: {
                  where: { status: { in: ["SUBMITTED", "LATE", "GRADED"] } },
                  include: { grade: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["PUBLISHED", "CLOSED"] },
        OR: [
          { deadline: { gte: start, lt: end } },
          { deadline: null, createdAt: { gte: start, lt: end } },
        ],
      },
      include: {
        submissions: {
          where: { status: { in: ["SUBMITTED", "LATE", "GRADED"] } },
          include: { grade: true },
        },
      },
    }),
  ]);

  let totalTasks = monthTasks.length;
  let totalSubmissions = 0;
  let totalMarks = 0;
  let totalMaxMarks = 0;

  for (const t of monthTasks) {
    totalSubmissions += t.submissions.length;
    for (const sub of t.submissions) {
      if (sub.grade) {
        totalMarks += sub.grade.marks;
        totalMaxMarks += sub.grade.maximumMarks;
      }
    }
  }

  const overallAvg =
    totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 1000) / 10 : null;

  const subjectRows = subjects.map((subj) => {
    let sStudentIds = new Set<string>();
    let sTasks = 0;
    let sSubmissions = 0;
    let sMarks = 0;
    let sMaxMarks = 0;

    for (const sess of subj.sessions) {
      sess.students.forEach((st) => sStudentIds.add(st.studentId));
      for (const t of sess.tasks) {
        sTasks += 1;
        sSubmissions += t.submissions.length;
        for (const sub of t.submissions) {
          if (sub.grade) {
            sMarks += sub.grade.marks;
            sMaxMarks += sub.grade.maximumMarks;
          }
        }
      }
    }

    const avg =
      sMaxMarks > 0 ? Math.round((sMarks / sMaxMarks) * 1000) / 10 : null;

    return {
      subjectId: subj.id,
      code: subj.code,
      name: subj.name,
      department: subj.department,
      sessionCount: subj.sessions.length,
      studentCount: sStudentIds.size,
      taskCount: sTasks,
      submissionCount: sSubmissions,
      averagePercentage: avg,
    };
  });

  return {
    period: {
      year,
      month,
      monthName,
    },
    platformMetrics: {
      totalActiveStudents: studentCount,
      totalActiveFaculty: facultyCount,
      totalActiveSubjects: subjectCount,
      totalActiveSessions: sessionCount,
      totalTasksInPeriod: totalTasks,
      totalSubmissionsInPeriod: totalSubmissions,
      overallAveragePercentage: overallAvg,
    },
    subjects: subjectRows,
    generatedAt: now.toISOString(),
  };
}

/**
 * Builds CSV content for student monthly report.
 */
export function buildStudentReportCsv(data: StudentMonthlyReportData): string {
  const lines: string[] = [];
  lines.push(`SMARTLAB STUDENT MONTHLY REPORT`);
  lines.push(`Student,"${data.student.name}"`);
  lines.push(`Roll Number,"${data.student.rollNumber}"`);
  lines.push(`Student ID,"${data.student.studentId}"`);
  lines.push(`Department,"${data.student.department}"`);
  lines.push(`Period,"${data.period.monthName} ${data.period.year}"`);
  lines.push(`Status,"${data.status}"`);
  lines.push(``);
  lines.push(`SUMMARY METRICS`);
  lines.push(`Assigned Tasks,${data.summary.assignedTasks}`);
  lines.push(`Submitted Tasks,${data.summary.submittedCount}`);
  lines.push(`Pending Tasks,${data.summary.pendingCount}`);
  lines.push(`Late Submissions,${data.summary.lateCount}`);
  lines.push(`Missed Submissions,${data.summary.missedCount}`);
  lines.push(`Graded Submissions,${data.summary.gradedCount}`);
  lines.push(`Submission Rate,${data.summary.submissionRate}%`);
  lines.push(`Average Score,${data.summary.averageScore !== null ? data.summary.averageScore + "%" : "N/A"}`);
  lines.push(``);
  lines.push(`SUBJECT PERFORMANCE`);
  lines.push(`Subject Code,Subject Name,Assigned,Submitted,Late,Missed,Graded,Marks Obtained,Maximum Marks,Score (%)`);
  for (const s of data.subjectPerformance) {
    lines.push(
      `"${s.subjectCode}","${s.subjectName}",${s.assignedTasks},${s.submittedCount},${s.lateCount},${s.missedCount},${s.gradedCount},${s.totalMarksObtained},${s.totalMaximumMarks},"${s.averagePercentage !== null ? s.averagePercentage + "%" : "N/A"}"`
    );
  }
  lines.push(``);
  lines.push(`FACULTY REMARKS`);
  lines.push(`Subject,Task,Marks,Max Marks,Remarks`);
  for (const r of data.remarks) {
    const escapedRemarks = r.remarks.replace(/"/g, '""');
    lines.push(`"${r.subjectCode}","${r.taskTitle}",${r.marks},${r.maximumMarks},"${escapedRemarks}"`);
  }
  return lines.join("\r\n");
}

/**
 * Builds CSV content for class monthly report.
 */
export function buildClassReportCsv(data: ClassMonthlyReportData): string {
  const lines: string[] = [];
  lines.push(`SMARTLAB CLASS PERFORMANCE REPORT`);
  lines.push(`Session,"${data.session.name}"`);
  lines.push(`Subject,"${data.session.subjectCode} - ${data.session.subjectName}"`);
  lines.push(`Faculty,"${data.session.facultyName}"`);
  lines.push(`Period,"${data.period.monthName} ${data.period.year}"`);
  lines.push(``);
  lines.push(`CLASS METRICS`);
  lines.push(`Total Students,${data.classMetrics.totalStudents}`);
  lines.push(`Total Tasks,${data.classMetrics.totalTasks}`);
  lines.push(`Expected Submissions,${data.classMetrics.expectedSubmissions}`);
  lines.push(`Total Submissions,${data.classMetrics.totalSubmissions}`);
  lines.push(`Late Submissions,${data.classMetrics.totalLateSubmissions}`);
  lines.push(`Missed Submissions,${data.classMetrics.totalMissedSubmissions}`);
  lines.push(`Graded Submissions,${data.classMetrics.totalGradedSubmissions}`);
  lines.push(`Submission Rate,${data.classMetrics.submissionRate}%`);
  lines.push(`Late Rate,${data.classMetrics.lateRate}%`);
  lines.push(`Missed Rate,${data.classMetrics.missedRate}%`);
  lines.push(`Class Average Score,${data.classMetrics.classAverageScore !== null ? data.classMetrics.classAverageScore + "%" : "N/A"}`);
  lines.push(``);
  lines.push(`STUDENT ROSTER PERFORMANCE`);
  lines.push(`Roll Number,Student Name,Email,Batch,Assigned,Submitted,Late,Missed,Graded,Marks,Max Marks,Average (%),Status,Indicator`);
  for (const s of data.students) {
    lines.push(
      `"${s.rollNumber}","${s.name}","${s.email}","${s.batch ?? ""}",${s.assignedTasks},${s.submittedCount},${s.lateCount},${s.missedCount},${s.gradedCount},${s.totalMarks},${s.maxMarks},"${s.averagePercentage !== null ? s.averagePercentage + "%" : "N/A"}","${s.status}","${s.indicator}"`
    );
  }
  return lines.join("\r\n");
}

/* -------------------------------------------------------------------------- */
/* PDF rendering (spec §42) — dependency-free, built on lib/server/pdf.ts      */
/* -------------------------------------------------------------------------- */

const PDF_MARGIN = 40;
const PDF_BOTTOM = 56;
const BRAND: PdfColor = [0.357, 0.373, 0.78]; // #5B5FC7
const TEXT_DARK: PdfColor = [0.14, 0.14, 0.16];
const TEXT_MUTED: PdfColor = [0.42, 0.42, 0.46];
const RULE: PdfColor = [0.82, 0.82, 0.85];
const HEADER_BG: PdfColor = [0.95, 0.95, 0.97];
const WHITE: PdfColor = [1, 1, 1];

interface PdfColumn {
  header: string;
  width: number;
  align?: "left" | "right";
}

const INDICATOR_LABELS: Record<string, string> = {
  GOOD_STANDING: "Good standing",
  LOW_PERFORMANCE: "Low performance",
  HIGH_MISSED: "High missed",
  HIGH_LATE: "High late",
};

class PdfReport {
  readonly doc = new PdfDocument();
  y: number;

  constructor(
    private readonly title: string,
    private readonly subtitle: string
  ) {
    this.doc.addPage();
    this.y = this.drawHeader();
  }

  private drawHeader(): number {
    this.doc.rect(0, 0, this.doc.width, 62, { fill: BRAND });
    this.doc.text(PDF_MARGIN, 26, "SMARTLAB", {
      size: 17,
      bold: true,
      color: WHITE,
    });
    this.doc.text(PDF_MARGIN, 46, this.subtitle, { size: 9, color: [0.87, 0.87, 1] });
    const tw = measureText(this.title, 12.5, true);
    this.doc.text(this.doc.width - PDF_MARGIN - tw, 30, this.title, {
      size: 12.5,
      bold: true,
      color: WHITE,
    });
    return 88;
  }

  contentWidth(): number {
    return this.doc.width - PDF_MARGIN * 2;
  }

  ensure(space: number): void {
    if (this.y + space > this.doc.height - PDF_BOTTOM) {
      this.doc.addPage();
      this.y = this.drawHeader();
    }
  }

  sectionTitle(text: string): void {
    this.ensure(34);
    this.doc.text(PDF_MARGIN, this.y, text.toUpperCase(), {
      size: 10,
      bold: true,
      color: BRAND,
    });
    this.y += 8;
    this.doc.line(PDF_MARGIN, this.y, this.doc.width - PDF_MARGIN, this.y, {
      width: 0.8,
      color: RULE,
    });
    this.y += 14;
  }

  /** Two-column key/value metrics table. */
  metrics(rows: Array<[string, string]>): void {
    const col = this.contentWidth() / 2;
    for (let i = 0; i < rows.length; i += 2) {
      this.ensure(20);
      const pair = rows.slice(i, i + 2);
      pair.forEach(([label, value], idx) => {
        const x = PDF_MARGIN + idx * col;
        this.doc.text(x, this.y, label, { size: 9, color: TEXT_MUTED });
        const vw = measureText(value, 9, true);
        this.doc.text(x + col - 10 - vw, this.y, value, {
          size: 9,
          bold: true,
          color: TEXT_DARK,
        });
      });
      this.y += 18;
    }
    this.y += 6;
  }

  table(columns: PdfColumn[], rows: string[][]): void {
    const total = columns.reduce((sum, c) => sum + c.width, 0);
    const size = 8.2;

    const drawHead = () => {
      this.ensure(22);
      this.doc.rect(PDF_MARGIN, this.y - 4, total, 16, { fill: HEADER_BG });
      let cx = PDF_MARGIN + 4;
      for (const c of columns) {
        this.doc.text(cx, this.y, c.header, {
          size,
          bold: true,
          color: TEXT_DARK,
        });
        cx += c.width;
      }
      this.y += 18;
    };

    drawHead();
    if (rows.length === 0) {
      this.doc.text(PDF_MARGIN + 4, this.y, "No data for this period.", {
        size,
        color: TEXT_MUTED,
      });
      this.y += 16;
      return;
    }

    for (const row of rows) {
      if (this.y + 14 > this.doc.height - PDF_BOTTOM) {
        this.doc.addPage();
        this.y = this.drawHeader();
        drawHead();
      }
      let cx = PDF_MARGIN + 4;
      columns.forEach((c, idx) => {
        const raw = row[idx] ?? "";
        const text = truncateToWidth(raw, c.width - 8, size);
        if (c.align === "right") {
          const w = measureText(text, size);
          this.doc.text(cx + c.width - 8 - w, this.y, text, {
            size,
            color: TEXT_DARK,
          });
        } else {
          this.doc.text(cx, this.y, text, { size, color: TEXT_DARK });
        }
        cx += c.width;
      });
      this.y += 5;
      this.doc.line(PDF_MARGIN, this.y, PDF_MARGIN + total, this.y, {
        width: 0.5,
        color: RULE,
      });
      this.y += 11;
    }
    this.y += 6;
  }

  paragraph(text: string): void {
    const size = 9;
    const lines = wrapText(text, this.contentWidth(), size);
    for (const line of lines) {
      this.ensure(14);
      this.doc.text(PDF_MARGIN, this.y, line, { size, color: TEXT_DARK });
      this.y += 13;
    }
    this.y += 4;
  }

  finalize(): Buffer {
    const total = this.doc.pageCount;
    for (let i = 0; i < total; i++) {
      const label = `SmartLab  •  ${this.title}  •  Page ${i + 1} of ${total}`;
      this.doc.textOnPage(i, PDF_MARGIN, this.doc.height - 34, label, {
        size: 7.5,
        color: TEXT_MUTED,
      });
    }
    return this.doc.build();
  }
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)} UTC`;
}

/** Builds a professional PDF for the student monthly report (spec §42). */
export function buildStudentReportPdf(data: StudentMonthlyReportData): Buffer {
  const report = new PdfReport(
    `${data.period.monthName} ${data.period.year} Report`,
    "Student Monthly Performance Report"
  );

  report.sectionTitle("Student Information");
  report.metrics([
    ["Student Name", data.student.name],
    ["Roll Number", data.student.rollNumber],
    ["Student ID", data.student.studentId],
    ["Department", data.student.department],
    ["Semester", String(data.student.semester)],
    ["Batch", data.student.batch ?? "—"],
    ["Report Period", `${data.period.monthName} ${data.period.year}`],
    ["Report Status", data.status],
  ]);

  report.sectionTitle("Summary");
  report.metrics([
    ["Assigned Tasks", String(data.summary.assignedTasks)],
    ["Submitted", String(data.summary.submittedCount)],
    ["Pending", String(data.summary.pendingCount)],
    ["Late", String(data.summary.lateCount)],
    ["Missed", String(data.summary.missedCount)],
    ["Graded", String(data.summary.gradedCount)],
    ["Submission Rate", `${data.summary.submissionRate}%`],
    [
      "Average Score",
      data.summary.averageScore !== null ? `${data.summary.averageScore}%` : "N/A",
    ],
    ["Marks Obtained", String(data.summary.totalMarksObtained)],
    ["Maximum Marks", String(data.summary.totalMaximumMarks)],
  ]);

  report.sectionTitle("Subject-wise Performance");
  report.table(
    [
      { header: "Code", width: 62 },
      { header: "Subject", width: 148 },
      { header: "Assigned", width: 48, align: "right" },
      { header: "Submitted", width: 52, align: "right" },
      { header: "Late", width: 38, align: "right" },
      { header: "Missed", width: 44, align: "right" },
      { header: "Graded", width: 45, align: "right" },
      { header: "Score", width: 48, align: "right" },
    ],
    data.subjectPerformance.map((s) => [
      s.subjectCode,
      s.subjectName,
      String(s.assignedTasks),
      String(s.submittedCount),
      String(s.lateCount),
      String(s.missedCount),
      String(s.gradedCount),
      s.averagePercentage !== null ? `${s.averagePercentage}%` : "N/A",
    ])
  );

  report.sectionTitle("Faculty Remarks");
  report.table(
    [
      { header: "Task", width: 168 },
      { header: "Marks", width: 52, align: "right" },
      { header: "Remarks", width: 255 },
    ],
    data.remarks.map((r) => [
      `[${r.subjectCode}] ${r.taskTitle}`,
      `${r.marks}/${r.maximumMarks}`,
      r.remarks,
    ])
  );

  report.paragraph(
    `Generated on ${formatGeneratedAt(data.generatedAt)}. This report is produced from recorded submission and grading data only; no estimates or projections are included.`
  );

  return report.finalize();
}

/** Builds a professional PDF for the faculty class report (spec §42, §43). */
export function buildClassReportPdf(data: ClassMonthlyReportData): Buffer {
  const report = new PdfReport(
    `${data.period.monthName} ${data.period.year} Report`,
    "Class Performance Report"
  );

  report.sectionTitle("Session Information");
  report.metrics([
    ["Session", data.session.name],
    ["Subject", `${data.session.subjectCode} — ${data.session.subjectName}`],
    ["Faculty", data.session.facultyName],
    ["Semester", String(data.session.semester)],
    ["Batch", data.session.batch ?? "—"],
    ["Report Period", `${data.period.monthName} ${data.period.year}`],
  ]);

  report.sectionTitle("Class Metrics");
  report.metrics([
    ["Students", String(data.classMetrics.totalStudents)],
    ["Tasks", String(data.classMetrics.totalTasks)],
    ["Expected Submissions", String(data.classMetrics.expectedSubmissions)],
    ["Total Submissions", String(data.classMetrics.totalSubmissions)],
    ["Late Submissions", String(data.classMetrics.totalLateSubmissions)],
    ["Missed Submissions", String(data.classMetrics.totalMissedSubmissions)],
    ["Graded Submissions", String(data.classMetrics.totalGradedSubmissions)],
    ["Submission Rate", `${data.classMetrics.submissionRate}%`],
    ["Late Rate", `${data.classMetrics.lateRate}%`],
    ["Missed Rate", `${data.classMetrics.missedRate}%`],
    [
      "Class Average",
      data.classMetrics.classAverageScore !== null
        ? `${data.classMetrics.classAverageScore}%`
        : "N/A",
    ],
  ]);

  report.sectionTitle("Student Roster Performance");
  report.table(
    [
      { header: "Roll No.", width: 68 },
      { header: "Student Name", width: 118 },
      { header: "Submitted", width: 52, align: "right" },
      { header: "Late", width: 38, align: "right" },
      { header: "Missed", width: 44, align: "right" },
      { header: "Graded", width: 45, align: "right" },
      { header: "Average", width: 48, align: "right" },
      { header: "Indicator", width: 82 },
    ],
    data.students.map((s) => [
      s.rollNumber,
      s.name,
      String(s.submittedCount),
      String(s.lateCount),
      String(s.missedCount),
      String(s.gradedCount),
      s.averagePercentage !== null ? `${s.averagePercentage}%` : "N/A",
      INDICATOR_LABELS[s.indicator] ?? s.indicator,
    ])
  );

  report.paragraph(
    `Generated on ${formatGeneratedAt(data.generatedAt)}. Indicators are rule-based (low performance < 40%; high missed >= 2; high late >= 2) and computed from recorded data only.`
  );

  return report.finalize();
}
