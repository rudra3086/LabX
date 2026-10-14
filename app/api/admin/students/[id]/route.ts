import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { studentPatchSchema, zodFieldErrors } from "@/lib/schemas";
import { getAdminStudentDetail } from "@/lib/server/services/admin";
import type { Prisma, UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireRole("ADMIN");
    return jsonSuccess({ student: await getAdminStudentDetail(params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const admin = await requireRole("ADMIN");
    const existing = await prisma.student.findUnique({ where: { id: params.id }, include: { user: true } });
    if (!existing) throw new ApiError("Student not found.", 404, "NOT_FOUND");

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = studentPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }

    const p = parsed.data;
    const changed: string[] = [];
    const userData: Prisma.UserUpdateInput = {};
    if (p.name !== undefined && p.name !== existing.user.name) { userData.name = p.name; changed.push("name"); }
    if (p.email !== undefined && p.email !== existing.user.email) { userData.email = p.email; changed.push("email"); }
    if (p.status !== undefined && p.status !== existing.user.status) { userData.status = p.status as UserStatus; changed.push("status"); }

    const studentData: Prisma.StudentUpdateInput = {};
    if (p.studentId !== undefined && p.studentId !== existing.studentId) { studentData.studentId = p.studentId; changed.push("studentId"); }
    if (p.rollNumber !== undefined && p.rollNumber !== existing.rollNumber) { studentData.rollNumber = p.rollNumber; changed.push("rollNumber"); }
    if (p.semester !== undefined && p.semester !== existing.semester) { studentData.semester = p.semester; changed.push("semester"); }
    if (p.department !== undefined && p.department !== existing.department) { studentData.department = p.department; changed.push("department"); }
    if (p.batch !== undefined && (p.batch ?? null) !== existing.batch) { studentData.batch = p.batch ?? null; changed.push("batch"); }
    if (p.subjectIds !== undefined) changed.push("subjectIds");

    if (changed.length === 0) {
      return jsonSuccess({ student: await getAdminStudentDetail(params.id) }, "No changes.");
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (Object.keys(userData).length) {
          await tx.user.update({ where: { id: existing.userId }, data: userData });
        }
        if (Object.keys(studentData).length) {
          await tx.student.update({ where: { id: params.id }, data: studentData });
        }
        if (p.subjectIds !== undefined) {
          await tx.studentSubject.deleteMany({ where: { studentId: params.id } });
          if (p.subjectIds.length) {
            await tx.studentSubject.createMany({
              data: p.subjectIds.map((subjectId) => ({ studentId: params.id, subjectId })),
            });
          }
        }
      });
    } catch (err) {
      throw prismaConflict(err, {
        email: "A user with this email already exists.",
        studentId: "A student with this student ID already exists.",
        rollNumber: "A student with this roll number already exists.",
      });
    }

    await recordAudit({
      actorId: admin.id,
      action: "STUDENT_UPDATE",
      entityType: "Student",
      entityId: params.id,
      metadata: { changed },
    });
    return jsonSuccess({ student: await getAdminStudentDetail(params.id) }, "Student updated.");
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const admin = await requireRole("ADMIN");
    const existing = await prisma.student.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Student not found.", 404, "NOT_FOUND");
    if (existing.status === "INACTIVE") {
      throw new ApiError("Student is already deactivated.", 400, "BAD_REQUEST");
    }
    await prisma.user.update({ where: { id: existing.userId }, data: { status: "INACTIVE" } });
    await recordAudit({
      actorId: admin.id,
      action: "STUDENT_DEACTIVATE",
      entityType: "Student",
      entityId: params.id,
    });
    return jsonSuccess({ student: await getAdminStudentDetail(params.id) }, "Student deactivated.");
  } catch (err) {
    return handleApiError(err);
  }
}