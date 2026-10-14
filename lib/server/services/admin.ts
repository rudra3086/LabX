import { prisma } from "../prisma";
import { ApiError } from "../http";

// ---------------------------------------------------------------------------
// Serialized admin list views. Dates are converted to ISO strings so the
// payload is safe to hand to client components.
// ---------------------------------------------------------------------------

export interface SubjectListItem {
  id: string;
  code: string;
  name: string;
  semester: number;
  department: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  sessionCount: number;
  facultyCount: number;
  createdAt: string;
}

export interface FacultyListItem {
  id: string;
  facultyId: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string | null;
  status: "ACTIVE" | "INACTIVE";
  subjects: { subjectId: string; code: string; name: string }[];
}

export interface StudentListItem {
  id: string;
  studentId: string;
  rollNumber: string;
  name: string;
  email: string;
  semester: number;
  department: string;
  batch: string | null;
  status: "ACTIVE" | "INACTIVE";
  subjects: { subjectId: string; code: string; name: string }[];
}

export async function getAdminSubjects(): Promise<SubjectListItem[]> {
  const rows = await prisma.subject.findMany({
    orderBy: [{ department: "asc" }, { code: "asc" }],
    include: {
      _count: { select: { sessions: true, facultyAssignments: true } },
    },
  });
  return rows.map((s) => ({
    id: s.id,
    code: s.code,
    name: s.name,
    semester: s.semester,
    department: s.department,
    description: s.description,
    status: s.status,
    sessionCount: s._count.sessions,
    facultyCount: s._count.facultyAssignments,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function getAdminSubject(id: string): Promise<SubjectListItem> {
  const s = await prisma.subject.findUnique({
    where: { id },
    include: {
      _count: { select: { sessions: true, facultyAssignments: true } },
    },
  });
  if (!s) throw new ApiError("Subject not found.", 404, "NOT_FOUND");
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    semester: s.semester,
    department: s.department,
    description: s.description,
    status: s.status,
    sessionCount: s._count.sessions,
    facultyCount: s._count.facultyAssignments,
    createdAt: s.createdAt.toISOString(),
  };
}

export async function getAdminFaculty(): Promise<FacultyListItem[]> {
  const rows = await prisma.faculty.findMany({
    orderBy: [{ department: "asc" }, { user: { name: "asc" } }],
    include: {
      user: { select: { name: true, email: true, status: true } },
      assignments: { include: { subject: { select: { id: true, code: true, name: true } } } },
    },
  });
  return rows.map((f) => ({
    id: f.id,
    facultyId: f.id,
    employeeId: f.employeeId,
    name: f.user.name,
    email: f.user.email,
    department: f.department,
    designation: f.designation,
    status: f.user.status,
    subjects: f.assignments.map((a) => ({
      subjectId: a.subject.id,
      code: a.subject.code,
      name: a.subject.name,
    })),
  }));
}

export async function getAdminFacultyDetail(id: string): Promise<FacultyListItem> {
  const f = await prisma.faculty.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, status: true } },
      assignments: { include: { subject: { select: { id: true, code: true, name: true } } } },
    },
  });
  if (!f) throw new ApiError("Faculty member not found.", 404, "NOT_FOUND");
  return {
    id: f.id,
    facultyId: f.id,
    employeeId: f.employeeId,
    name: f.user.name,
    email: f.user.email,
    department: f.department,
    designation: f.designation,
    status: f.user.status,
    subjects: f.assignments.map((a) => ({
      subjectId: a.subject.id,
      code: a.subject.code,
      name: a.subject.name,
    })),
  };
}

export async function getAdminStudents(): Promise<StudentListItem[]> {
  const rows = await prisma.student.findMany({
    orderBy: [{ rollNumber: "asc" }],
    include: {
      user: { select: { name: true, email: true, status: true } },
      subjectLinks: { include: { subject: { select: { id: true, code: true, name: true } } } },
    },
  });
  return rows.map((s) => ({
    id: s.id,
    studentId: s.studentId,
    rollNumber: s.rollNumber,
    name: s.user.name,
    email: s.user.email,
    semester: s.semester,
    department: s.department,
    batch: s.batch,
    status: s.user.status,
    subjects: s.subjectLinks.map((link) => ({
      subjectId: link.subject.id,
      code: link.subject.code,
      name: link.subject.name,
    })),
  }));
}

export async function getAdminStudentDetail(id: string): Promise<StudentListItem> {
  const s = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, status: true } },
      subjectLinks: { include: { subject: { select: { id: true, code: true, name: true } } } },
    },
  });
  if (!s) throw new ApiError("Student not found.", 404, "NOT_FOUND");
  return {
    id: s.id,
    studentId: s.studentId,
    rollNumber: s.rollNumber,
    name: s.user.name,
    email: s.user.email,
    semester: s.semester,
    department: s.department,
    batch: s.batch,
    status: s.user.status,
    subjects: s.subjectLinks.map((link) => ({
      subjectId: link.subject.id,
      code: link.subject.code,
      name: link.subject.name,
    })),
  };
}

/** All subjects for assignment pickers (faculty form). */
export async function getAssignableSubjects() {
  const rows = await prisma.subject.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ code: "asc" }],
    select: { id: true, code: true, name: true, department: true, semester: true },
  });
  return rows;
}

/** Readable, one-time temporary password for newly created accounts. */
export function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  return "Smart@" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}