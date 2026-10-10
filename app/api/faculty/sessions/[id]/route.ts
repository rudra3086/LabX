import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { sessionPatchSchema, zodFieldErrors } from "@/lib/schemas";
import {
  assertSessionOwnership,
  getFacultySessionDetail,
  getFacultySessions,
} from "@/lib/server/services/faculty";
import type { Prisma, SessionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    return jsonSuccess({
      session: await getFacultySessionDetail(faculty.faculty!.id, params.id),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const existing = await assertSessionOwnership(facultyId, params.id);
    if (existing.status === "ARCHIVED") {
      throw new ApiError("Archived sessions cannot be edited.", 400, "BAD_REQUEST");
    }

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = sessionPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const p = parsed.data;

    // Validate subject change stays within assigned subjects.
    if (p.subjectId !== undefined && p.subjectId !== existing.subjectId) {
      const assigned = await prisma.facultySubject.findFirst({
        where: { facultyId, subjectId: p.subjectId },
      });
      if (!assigned) {
        throw new ApiError("You are not assigned to this subject.", 403, "FORBIDDEN");
      }
    }

    const data: Prisma.PracticalSessionUpdateInput = {};
    const changed: string[] = [];

    if (p.name !== undefined && p.name !== existing.name) { data.name = p.name; changed.push("name"); }
    if (p.description !== undefined && (p.description ?? null) !== existing.description) { data.description = p.description ?? null; changed.push("description"); }
    if (p.semester !== undefined && p.semester !== existing.semester) { data.semester = p.semester; changed.push("semester"); }
    if (p.batch !== undefined && (p.batch ?? null) !== existing.batch) { data.batch = p.batch ?? null; changed.push("batch"); }
    if (p.startDate !== undefined && (p.startDate ? new Date(p.startDate) : null)?.getTime() !== (existing.startDate ? existing.startDate.getTime() : 0)) {
      data.startDate = p.startDate ? new Date(p.startDate) : null;
      changed.push("startDate");
    }
    if (p.endDate !== undefined && (p.endDate ? new Date(p.endDate) : null)?.getTime() !== (existing.endDate ? existing.endDate.getTime() : 0)) {
      data.endDate = p.endDate ? new Date(p.endDate) : null;
      changed.push("endDate");
    }
    if (p.status !== undefined && p.status !== existing.status) {
      const allowed = SESSION_TRANSITIONS[existing.status];
      if (!allowed.includes(p.status)) {
        throw new ApiError(
          `Cannot move a ${existing.status} session to ${p.status}.`,
          400,
          "INVALID_TRANSITION"
        );
      }
      data.status = p.status;
      changed.push("status");
    }

    if (Object.keys(data).length === 0) {
      return jsonSuccess(
        { session: await getFacultySessionDetail(facultyId, params.id) },
        "No changes."
      );
    }

    await prisma.practicalSession.update({ where: { id: params.id }, data });
    await recordAudit({
      actorId: faculty.id,
      action: "SESSION_UPDATE",
      entityType: "PracticalSession",
      entityId: params.id,
      metadata: { changed },
    });
    return jsonSuccess(
      { session: await getFacultySessionDetail(facultyId, params.id) },
      "Session updated."
    );
  } catch (err) {
    return handleApiError(err);
  }
}

// Soft-close per spec §53.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const existing = await assertSessionOwnership(facultyId, params.id);
    if (existing.status === "ARCHIVED") {
      throw new ApiError("Session is already archived.", 400, "BAD_REQUEST");
    }
    await prisma.practicalSession.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" },
    });
    await recordAudit({
      actorId: faculty.id,
      action: "SESSION_ARCHIVE",
      entityType: "PracticalSession",
      entityId: params.id,
    });
    return jsonSuccess(
      { sessions: await getFacultySessions(facultyId) },
      "Session archived."
    );
  } catch (err) {
    return handleApiError(err);
  }
}