import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/rbac";
import { jsonSuccess, ApiError, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { getClassMonthlyReport } from "@/lib/server/services/reports";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const user = await requireUser();
    const sessionId = params.sessionId;

    const targetSession = await prisma.practicalSession.findUnique({
      where: { id: sessionId },
      select: { id: true, facultyId: true },
    });

    if (!targetSession) {
      throw new ApiError("Session not found", 404, "NOT_FOUND");
    }

    // RBAC check
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

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || "", 10) || now.getFullYear();
    const month = parseInt(searchParams.get("month") || "", 10) || now.getMonth() + 1;

    const report = await getClassMonthlyReport(sessionId, year, month);
    return jsonSuccess(report);
  } catch (err) {
    return handleApiError(err);
  }
}
