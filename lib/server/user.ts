import { User } from "@prisma/client";

/**
 * Public user shape exposed to the frontend. Never leaks passwordHash or
 * other internal fields (spec §55).
 */
export function toPublicUser(user: User & {
  student?: {
    studentId: string;
    rollNumber: string;
    semester: number;
    batch: string | null;
  } | null;
  faculty?: {
    employeeId: string;
    department: string;
    designation: string | null;
  } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    status: user.status,
    student: user.student
      ? {
          studentId: user.student.studentId,
          rollNumber: user.student.rollNumber,
          semester: user.student.semester,
          batch: user.student.batch,
        }
      : undefined,
    faculty: user.faculty
      ? {
          employeeId: user.faculty.employeeId,
          department: user.faculty.department,
          designation: user.faculty.designation,
        }
      : undefined,
  };
}

export type PublicUser = ReturnType<typeof toPublicUser>;