import { NextRequest } from "next/server";
import { requireRole } from "@/lib/server/rbac";
import { jsonSuccess, handleApiError, ApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { runDeadlineReminders } from "@/lib/server/services/reminders";

export const dynamic = "force-dynamic";

/**
 * On-demand deadline reminder job (spec §99-102, §30).
 *
 * Protected two ways (either is enough):
 *  - an authenticated Administrator, or
 *  - a caller presenting `x-job-key` matching AUTH_SECRET (for cron schedulers,
 *    vercel.cron.json, or a host-level scheduler).
 *
 * Idempotent by design: notifications carry unique dedupe keys, so running it
 * repeatedly never duplicates reminders.
 */
export async function POST(request: NextRequest) {
  try {
    let actorId: string | null = null;

    try {
      const actor = await requireRole("ADMIN");
      actorId = actor.id;
    } catch {
      const presented = request.headers.get("x-job-key");
      if (!process.env.AUTH_SECRET || presented !== process.env.AUTH_SECRET) {
        throw new ApiError("Forbidden", 403, "FORBIDDEN");
      }
    }

    const result = await runDeadlineReminders();

    await prisma.auditLog.create({
      data: {
        actorId,
        action: "REMINDERS_RUN",
        entityType: "JOB",
        metadata: {
          reminders: result.reminders,
          missed: result.missed,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return jsonSuccess(result, "Deadline reminder pass completed.");
  } catch (err) {
    return handleApiError(err);
  }
}