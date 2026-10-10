import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { facultyPatchSchema, zodFieldErrors } from "@/lib/schemas";
import { getAdminFacultyDetail } from "@/lib/server/services/admin";
import type { Prisma, UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireRole("ADMIN");
    return jsonSuccess({ faculty: await getAdminFacultyDetail(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireRole("ADMIN");
    const existing = await prisma.faculty.findUnique({ where: { id: params.id }, include: { user: true } });
    if (!existing) throw new ApiError("Faculty member not found.", 404, "NOT_FOUND");

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = facultyPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }

    const p = parsed.data;
    const changed: string[] = [];
    const userData: Prisma.UserUpdateInput = {};
    if (p.name !== undefined && p.name !== existing.user.name) { userData.name = p.name; changed.push("name"); }
    if (p.email !== undefined && p.email !== existing.user.email) { userData.email = p.email; changed.push("email"); }
    if (p.status !== undefined && p.status !== existing.user.status) { userData.status = p.status as UserStatus; changed.push("status"); }

    const facultyData: Prisma.FacultyUpdateInput = {};
    if (p.department !== undefined && p.department !== existing.department) { facultyData.department = p.department; changed.push("department"); }
    if (p.designation !== undefined && (p.designation ?? null) !== existing.designation) { facultyData.designation = p.designation ?? null; changed.push("designation"); }
    if (p.employeeId !== undefined && p.employeeId !== existing.employeeId) { facultyData.employeeId = p.employeeId; changed.push("employeeId"); }

    try {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(userData).length) {
          await tx.user.update({ where: { id: existing.userId }, data: userData });
        }
        if (Object.keys(facultyData).length) {
          await tx.faculty.update({ where: { id: params.id }, data: facultyData });
        }
        if (p.subjectIds !== undefined) {
          await tx.facultySubject.deleteMany({ where: { facultyId: params.id } });
          if (p.subjectIds.length) {
            const existingIds = new Set(await tx.facultySubject.findMany({ where: { subjectId: { in: p.subjectIds } }, select: { subjectId: true } }).then((r) => r.map((x) => x.subjectId)));
            await tx.facultySubject.createMany({
              data: p.subjectIds.filter((sid) => !existingIds.has(sid)).map((subjectId) => ({ facultyId: params.id, subjectId })),
            });
          }
          changed.push("subjectIds");
        }
      });
    } catch (err) {
      throw prismaConflict(err, {
        email: "A user with this email already exists.",
        employeeId: "A faculty member with this employee ID already exists.",
      });
    }

    if (changed.length === 0) {
      return jsonSuccess({ faculty: await getAdminFacultyDetail(params.id) }, "No changes.");
    }
    await recordAudit({
      actorId: admin.id,
      action: "FACULTY_UPDATE",
      entityType: "Faculty",
      entityId: params.id,
      metadata: { changed },
    });
    return jsonSuccess({ faculty: await getAdminFacultyDetail(params.id) }, "Faculty updated.");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const admin = await requireRole("ADMIN");
    const existing = await prisma.faculty.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Faculty member not found.", 404, "NOT_FOUND");
    if (existing.status === "INACTIVE") {
      throw new ApiError("Faculty member is already deactivated.", 400, "BAD_REQUEST");
    }
    await prisma.user.update({ where: { id: existing.userId }, data: { status: "INACTIVE" } });
    await recordAudit({
      actorId: admin.id,
      action: "FACULTY_DEACTIVATE",
      entityType: "Faculty",
      entityId: params.id,
    });
    return jsonSuccess({ faculty: await getAdminFacultyDetail(params.id) }, "Faculty deactivated.");
  } catch (err) {
    return handleApiError(err);
  }
}