import { Role } from "@prisma/client";
import { prisma } from "../prisma";
import { ApiError } from "../http";

export async function assertSubjectAccess(userId: string, role: Role, subjectId: string) {
  if (role === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({ where: { userId } });
    const assignment = faculty && await prisma.facultySubject.findUnique({
      where: { facultyId_subjectId: { facultyId: faculty.id, subjectId } },
    });
    if (!assignment) throw new ApiError("You are not assigned to this subject.", 403, "FORBIDDEN");
    return { facultyId: faculty.id };
  }
  if (role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId } });
    const enrollment = student && await prisma.sessionStudent.findFirst({
      where: { studentId: student.id, session: { subjectId } },
    });
    if (!enrollment) throw new ApiError("You are not enrolled in this subject.", 403, "FORBIDDEN");
    return { studentId: student.id };
  }
  return {};
}
