import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import { jsonSuccess, handleApiError } from "@/lib/server/http";
import { getPlatformMonthlyReport } from "@/lib/server/services/reports";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || "", 10) || now.getFullYear();
    const month = parseInt(searchParams.get("month") || "", 10) || now.getMonth() + 1;

    const report = await getPlatformMonthlyReport(year, month);
    return jsonSuccess(report);
  } catch (err) {
    return handleApiError(err);
  }
}
