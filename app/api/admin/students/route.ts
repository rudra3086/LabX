import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { hashPassword } from "@/lib/server/password";
import { studentUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { generateTempPassword, getAdminStudentDetail, getAdminStudents } from "@/lib/server/services/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return jsonSuccess({ students: await getAdminStudents() });
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
    const parsed = studentUpsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const { studentId, rollNumber, name, email, semester, department, batch } = parsed.data;
    const tempPassword = generateTempPassword();

    try {
      const created = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash: await hashPassword(tempPassword),
            role: "STUDENT",
            department,
            status: "ACTIVE",
          },
        });
        return tx.student.create({
          data: { userId: user.id, studentId, rollNumber, semester, department, batch },
        });
      });

      await recordAudit({
        actorId: admin.id,
        action: "STUDENT_CREATE",
        entityType: "Student",
        entityId: created.id,
        metadata: { studentId, rollNumber, email },
      });
      return jsonSuccess(
        {
          student: await getAdminStudentDetail(created.id),
          tempPassword,
        },
        "Student account created. Share the temporary password with the student.",
        201
      );
    } catch (err) {
      throw prismaConflict(err, {
        email: "A user with this email already exists.",
        studentId: "A student with this student ID already exists.",
        rollNumber: "A student with this roll number already exists.",
      });
    }
  } catch (err) {
    return handleApiError(err);
  }
}