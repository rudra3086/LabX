import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { deleteStoredFile } from "@/lib/server/uploads";
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
            await tx.facultySubject.createMany({
              data: p.subjectIds.map((subjectId) => ({ facultyId: params.id, subjectId })),
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
    const existing = await prisma.faculty.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true },
    });
    if (!existing) throw new ApiError("Faculty member not found.", 404, "NOT_FOUND");

    const storageKeys = await prisma.$transaction(async (tx) => {
      const resources = await tx.$queryRaw<Array<{ storageKey: string }>>`
        SELECT "storageKey" FROM "TaskResource"
        WHERE "uploadedById" = ${existing.userId}
           OR "taskId" IN (
             SELECT "id" FROM "Task"
             WHERE "sessionId" IN (
               SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
             )
           )
      `;
      const submissionFiles = await tx.$queryRaw<Array<{ storageKey: string }>>`
        SELECT "storageKey" FROM "SubmissionFile"
        WHERE "uploadedById" = ${existing.userId}
           OR "submissionId" IN (
             SELECT "id" FROM "Submission"
             WHERE "taskId" IN (
               SELECT "id" FROM "Task"
               WHERE "sessionId" IN (
                 SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
               )
             )
           )
      `;
      const ragTable = await tx.$queryRaw<Array<{ exists: boolean }>>`
        SELECT to_regclass('public."RagDocument"') IS NOT NULL AS "exists"
      `;
      const ragDocuments = ragTable[0]?.exists
        ? await tx.$queryRaw<Array<{ storageKey: string }>>`
            SELECT "storageKey" FROM "RagDocument"
            WHERE "uploadedById" = ${existing.userId} OR "facultyId" = ${existing.id}
          `
        : [];
      const sessionFiles = await tx.$queryRaw<Array<{ storageKey: string }>>`
        SELECT "storageKey" FROM "SubmissionFile"
        WHERE "submissionId" IN (
          SELECT "id" FROM "Submission"
          WHERE "taskId" IN (
            SELECT "id" FROM "Task"
            WHERE "sessionId" IN (
              SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
            )
          )
        )
      `;

      await tx.$executeRaw`DELETE FROM "GradeAudit" WHERE "gradeId" IN (
        SELECT "id" FROM "Grade" WHERE "submissionId" IN (
          SELECT "id" FROM "Submission" WHERE "taskId" IN (
            SELECT "id" FROM "Task" WHERE "sessionId" IN (
              SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
            )
          )
        )
      )`;
      await tx.$executeRaw`DELETE FROM "Grade" WHERE "submissionId" IN (
        SELECT "id" FROM "Submission" WHERE "taskId" IN (
          SELECT "id" FROM "Task" WHERE "sessionId" IN (
            SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
          )
        )
      )`;
      await tx.$executeRaw`DELETE FROM "SubmissionFile" WHERE "submissionId" IN (
        SELECT "id" FROM "Submission" WHERE "taskId" IN (
          SELECT "id" FROM "Task" WHERE "sessionId" IN (
            SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
          )
        )
      )`;
      await tx.$executeRaw`DELETE FROM "SubmissionVersion" WHERE "submissionId" IN (
        SELECT "id" FROM "Submission" WHERE "taskId" IN (
          SELECT "id" FROM "Task" WHERE "sessionId" IN (
            SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
          )
        )
      )`;
      await tx.$executeRaw`DELETE FROM "Submission" WHERE "taskId" IN (
        SELECT "id" FROM "Task" WHERE "sessionId" IN (
          SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
        )
      )`;
      await tx.$executeRaw`DELETE FROM "TaskResource" WHERE "taskId" IN (
        SELECT "id" FROM "Task" WHERE "sessionId" IN (
          SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
        )
      )`;
      await tx.$executeRaw`DELETE FROM "Task" WHERE "sessionId" IN (
        SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
      )`;
      await tx.$executeRaw`DELETE FROM "SessionStudent" WHERE "sessionId" IN (
        SELECT "id" FROM "PracticalSession" WHERE "facultyId" = ${existing.id}
      )`;
      await tx.$executeRaw`DELETE FROM "TaskResource" WHERE "uploadedById" = ${existing.userId}`;
      await tx.$executeRaw`DELETE FROM "SubmissionFile" WHERE "uploadedById" = ${existing.userId}`;
      await tx.$executeRaw`DELETE FROM "SubmissionVersion" WHERE "createdById" = ${existing.userId}`;
      await tx.$executeRaw`DELETE FROM "GradeAudit" WHERE "updatedById" = ${existing.userId}`;
      await tx.$executeRaw`DELETE FROM "Grade" WHERE "gradedById" = ${existing.userId}`;
      if (ragTable[0]?.exists) {
        await tx.$executeRaw`DELETE FROM "RagDocument" WHERE "uploadedById" = ${existing.userId} OR "facultyId" = ${existing.id}`;
      }
      await tx.$executeRaw`DELETE FROM "PracticalSession" WHERE "facultyId" = ${existing.id}`;
      await tx.$executeRaw`DELETE FROM "Faculty" WHERE "id" = ${existing.id}`;
      await tx.$executeRaw`DELETE FROM "User" WHERE "id" = ${existing.userId}`;

      return [
        ...resources.map((file) => file.storageKey),
        ...submissionFiles.map((file) => file.storageKey),
        ...sessionFiles.map((file) => file.storageKey),
        ...ragDocuments.map((file) => file.storageKey),
      ];
    });

    await Promise.all(storageKeys.map((storageKey) => deleteStoredFile(storageKey)));
    await recordAudit({
      actorId: admin.id,
      action: "FACULTY_DELETE",
      entityType: "Faculty",
      entityId: params.id,
    });
    return jsonSuccess({ facultyId: params.id }, "Faculty permanently deleted.");
  } catch (err) {
    return handleApiError(err);
  }
}