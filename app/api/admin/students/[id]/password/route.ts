import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { hashPassword } from "@/lib/server/password";
import { generateTempPassword } from "@/lib/server/services/admin";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireRole("ADMIN");
    const student = await prisma.student.findUnique({ where: { id: params.id } });
    if (!student) throw new ApiError("Student not found.", 404, "NOT_FOUND");

    const temporaryPassword = generateTempPassword();
    await prisma.user.update({
      where: { id: student.userId },
      data: { passwordHash: await hashPassword(temporaryPassword) },
    });
    await recordAudit({
      actorId: admin.id,
      action: "STUDENT_PASSWORD_RESET",
      entityType: "Student",
      entityId: student.id,
    });

    return jsonSuccess({ temporaryPassword }, "Student password reset.");
  } catch (err) {
    return handleApiError(err);
  }
}
