import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/rbac";
import { ApiError, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import {
  getStudentMonthlyReport,
  getClassMonthlyReport,
  buildStudentReportCsv,
  buildClassReportCsv,
} from "@/lib/server/services/reports";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "student" | "class"
    const id = searchParams.get("id"); // studentId or sessionId
    const now = new Date();
    const year = parseInt(searchParams.get("year") || "", 10) || now.getFullYear();
    const month = parseInt(searchParams.get("month") || "", 10) || now.getMonth() + 1;

    if (!type || !id) {
      throw new ApiError("Missing type or id parameter", 400, "BAD_REQUEST");
    }

    if (type === "student") {
      const targetStudent = await prisma.student.findUnique({
        where: { id },
        select: { id: true, userId: true, rollNumber: true },
      });
      if (!targetStudent) {
        throw new ApiError("Student not found", 404, "NOT_FOUND");
      }

      // RBAC
      if (user.role === "STUDENT" && targetStudent.userId !== user.id) {
        throw new ApiError("Forbidden", 403, "FORBIDDEN");
      }
      if (user.role === "FACULTY") {
        const faculty = await prisma.faculty.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        const sharedSession = await prisma.sessionStudent.findFirst({
          where: {
            studentId: id,
            session: { facultyId: faculty?.id },
          },
        });
        if (!sharedSession) {
          throw new ApiError("Forbidden", 403, "FORBIDDEN");
        }
      }

      const report = await getStudentMonthlyReport(id, year, month);
      const csv = buildStudentReportCsv(report);
      const filename = `student_report_${targetStudent.rollNumber}_${year}_${month}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else if (type === "class") {
      const targetSession = await prisma.practicalSession.findUnique({
        where: { id },
        select: { id: true, facultyId: true, name: true },
      });
      if (!targetSession) {
        throw new ApiError("Session not found", 404, "NOT_FOUND");
      }

      if (user.role === "FACULTY") {
        const faculty = await prisma.faculty.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (!faculty || faculty.id !== targetSession.facultyId) {
          throw new ApiError("Forbidden", 403, "FORBIDDEN");
        }
      } else if (user.role !== "ADMIN") {
        throw new ApiError("Forbidden", 403, "FORBIDDEN");
      }

      const report = await getClassMonthlyReport(id, year, month);
      const csv = buildClassReportCsv(report);
      const safeName = targetSession.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `class_report_${safeName}_${year}_${month}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    } else {
      throw new ApiError("Unsupported report type", 400, "BAD_REQUEST");
    }
  } catch (err) {
    return handleApiError(err);
  }
}
