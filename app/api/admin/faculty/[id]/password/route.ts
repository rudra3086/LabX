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
    const faculty = await prisma.faculty.findUnique({ where: { id: params.id } });
    if (!faculty) throw new ApiError("Faculty member not found.", 404, "NOT_FOUND");

    const temporaryPassword = generateTempPassword();
    await prisma.user.update({
      where: { id: faculty.userId },
      data: { passwordHash: await hashPassword(temporaryPassword) },
    });
    await recordAudit({
      actorId: admin.id,
      action: "FACULTY_PASSWORD_RESET",
      entityType: "Faculty",
      entityId: faculty.id,
    });

    return jsonSuccess({ temporaryPassword }, "Faculty password reset.");
  } catch (err) {
    return handleApiError(err);
  }
}
