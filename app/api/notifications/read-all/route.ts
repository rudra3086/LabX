import { NextRequest } from "next/server";
import { requireUser } from "@/lib/server/rbac";
import { jsonSuccess, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return jsonSuccess({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
