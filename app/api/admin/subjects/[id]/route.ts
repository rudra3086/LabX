import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { subjectPatchSchema, zodFieldErrors } from "@/lib/schemas";
import { getAdminSubject } from "@/lib/server/services/admin";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireRole("ADMIN");
    return jsonSuccess({ subject: await getAdminSubject(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireRole("ADMIN");
    const existing = await prisma.subject.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Subject not found.", 404, "NOT_FOUND");

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = subjectPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }

    const data: Prisma.SubjectUpdateInput = {};
    const changed: string[] = [];
    const p = parsed.data;

    if (p.code !== undefined) {
      const code = p.code.toUpperCase();
      if (code !== existing.code) { data.code = code; changed.push("code"); }
    }
    if (p.name !== undefined && p.name !== existing.name) { data.name = p.name; changed.push("name"); }
    if (p.semester !== undefined && p.semester !== existing.semester) { data.semester = p.semester; changed.push("semester"); }
    if (p.department !== undefined && p.department !== existing.department) { data.department = p.department; changed.push("department"); }
    if (p.description !== undefined && (p.description ?? null) !== existing.description) { data.description = p.description ?? null; changed.push("description"); }
    if (p.status !== undefined && p.status !== existing.status) { data.status = p.status; changed.push("status"); }

    if (Object.keys(data).length === 0) {
      return jsonSuccess({ subject: await getAdminSubject(params.id) }, "No changes.");
    }

    try {
      await prisma.subject.update({ where: { id: params.id }, data });
    } catch (err) {
      throw prismaConflict(err, { code: "This subject code already exists." });
    }

    await recordAudit({
      actorId: admin.id,
      action: "SUBJECT_UPDATE",
      entityType: "Subject",
      entityId: params.id,
      metadata: { changed },
    });
    return jsonSuccess({ subject: await getAdminSubject(params.id) }, "Subject updated.");
  } catch (err) {
    return handleApiError(err);
  }
}

// Soft delete per spec §53: academic records are deactivated, never removed.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const admin = await requireRole("ADMIN");
    const existing = await prisma.subject.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Subject not found.", 404, "NOT_FOUND");
    if (existing.status === "INACTIVE") {
      throw new ApiError("Subject is already deactivated.", 400, "BAD_REQUEST");
    }
    await prisma.subject.update({ where: { id: params.id }, data: { status: "INACTIVE" } });
    await recordAudit({
      actorId: admin.id,
      action: "SUBJECT_DEACTIVATE",
      entityType: "Subject",
      entityId: params.id,
    });
    return jsonSuccess(
      { subject: await getAdminSubject(params.id) },
      "Subject deactivated."
    );
  } catch (err) {
    return handleApiError(err);
  }
}