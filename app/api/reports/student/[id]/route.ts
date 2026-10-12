import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/rbac";
import { jsonSuccess, ApiError, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { getStudentMonthlyReport } from "@/lib/server/services/reports";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();
    const studentId = params.id;

    const targetStudent = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, userId: true },
    });

    if (!targetStudent) {
      throw new ApiError("Student not found", 404, "NOT_FOUND");
    }

    // RBAC check
    if (user.role === "STUDENT") {
      if (targetStudent.userId !== user.id) {
        throw new ApiError("Forbidden", 403, "FORBIDDEN");
      }
    } else if (user.role === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!faculty) {
        throw new ApiError("Faculty profile not found", 404, "NOT_FOUND");
      }
      const sharedSession = await prisma.sessionStudent.findFirst({
        where: {
          studentId,
          session: { facultyId: faculty.id },
        },
      });
      if (!sharedSession) {
        throw new ApiError("Forbidden", 403, "FORBIDDEN");
      }
    } else if (user.role !== "ADMIN") {
      throw new ApiError("Forbidden", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || "", 10) || now.getFullYear();
    const month = parseInt(searchParams.get("month") || "", 10) || now.getMonth() + 1;

    const report = await getStudentMonthlyReport(studentId, year, month);
    return jsonSuccess(report);
  } catch (err) {
    return handleApiError(err);
  }
}
