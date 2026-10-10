import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { hashPassword } from "@/lib/server/password";
import { facultyUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { generateTempPassword, getAdminFaculty, getAdminFacultyDetail } from "@/lib/server/services/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return jsonSuccess({ faculty: await getAdminFaculty() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = facultyUpsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const { name, employeeId, email, department, designation, subjectIds } = parsed.data;
    const tempPassword = generateTempPassword();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash: await hashPassword(tempPassword),
            role: "FACULTY",
            department,
            status: "ACTIVE",
          },
        });
        return tx.faculty.create({
          data: {
            userId: user.id,
            employeeId,
            department,
            designation,
            assignments: { create: subjectIds.map((subjectId) => ({ subjectId })) },
          },
        });
      });

      await recordAudit({
        actorId: admin.id,
        action: "FACULTY_CREATE",
        entityType: "Faculty",
        entityId: created.id,
        metadata: { employeeId, email },
      });
      return jsonSuccess(
        {
          faculty: await getAdminFacultyDetail(created.id),
          tempPassword,
        },
        "Faculty account created. Share the temporary password with the faculty member.",
        201
      );
    } catch (err) {
      throw prismaConflict(err, {
        email: "A user with this email already exists.",
        employeeId: "A faculty member with this employee ID already exists.",
      });
    }
  } catch (err) {
    return handleApiError(err);
  }
}