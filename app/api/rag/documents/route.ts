import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";

export async function GET() {
  try {
    const user = await requireRole("FACULTY");
    const faculty = await prisma.faculty.findUniqueOrThrow({ where: { userId: user.id } });
    return jsonSuccess(await prisma.ragDocument.findMany({
      where: { facultyId: faculty.id },
      include: { subject: { select: { code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
