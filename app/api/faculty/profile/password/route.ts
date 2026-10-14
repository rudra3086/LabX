import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import { passwordChangeSchema, zodFieldErrors } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const faculty = await requireRole("FACULTY");
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }

    const valid = await verifyPassword(parsed.data.currentPassword, faculty.passwordHash);
    if (!valid) {
      throw new ApiError("Current password is incorrect.", 400, "INVALID_PASSWORD", {
        currentPassword: ["Current password is incorrect."],
      });
    }

    await prisma.user.update({
      where: { id: faculty.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });
    await recordAudit({
      actorId: faculty.id,
      action: "PASSWORD_CHANGE",
      entityType: "User",
      entityId: faculty.id,
    });

    return jsonSuccess({}, "Password updated successfully.");
  } catch (err) {
    return handleApiError(err);
  }
}
