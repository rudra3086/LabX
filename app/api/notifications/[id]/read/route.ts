import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/rbac";
import { jsonSuccess, ApiError, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    });

    if (!notification || notification.userId !== user.id) {
      throw new ApiError("Notification not found", 404, "NOT_FOUND");
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: { read: true },
    });

    return jsonSuccess({
      id: updated.id,
      read: updated.read,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
