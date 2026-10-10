import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { sessionUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { getFacultySessionDetail, getFacultySessions } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const faculty = await requireRole("FACULTY");
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId") ?? undefined;
    return jsonSuccess({ sessions: await getFacultySessions(faculty.faculty!.id, subjectId) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = sessionUpsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const { subjectId, name, description, semester, batch, startDate, endDate } = parsed.data;

    const assigned = await prisma.facultySubject.findFirst({
      where: { facultyId, subjectId },
    });
    if (!assigned) {
      throw new ApiError("You are not assigned to this subject.", 403, "FORBIDDEN");
    }

    const session = await prisma.practicalSession.create({
      data: {
        subjectId,
        facultyId,
        name,
        description,
        semester,
        batch,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: "DRAFT",
      },
    });

    await recordAudit({
      actorId: faculty.id,
      action: "SESSION_CREATE",
      entityType: "PracticalSession",
      entityId: session.id,
      metadata: { name, subjectId },
    });
    return jsonSuccess(
      { session: await getFacultySessionDetail(facultyId, session.id) },
      "Session created as a draft.",
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}