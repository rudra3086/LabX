import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { assertTaskOwnership } from "@/lib/server/services/faculty";
import { deleteStoredFile } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string; resourceId: string } };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    await assertTaskOwnership(facultyId, params.id);

    const resource = await prisma.taskResource.findUnique({ where: { id: params.resourceId } });
    if (!resource || resource.taskId !== params.id) {
      throw new ApiError("Resource not found.", 404, "NOT_FOUND");
    }

    await prisma.taskResource.delete({ where: { id: resource.id } });
    await deleteStoredFile(resource.storageKey);
    await recordAudit({
      actorId: faculty.id,
      action: "FILE_DELETED",
      entityType: "TaskResource",
      entityId: resource.id,
      metadata: { taskId: params.id, originalName: resource.originalName },
    });

    return jsonSuccess({ resourceId: resource.id }, "Resource removed.");
  } catch (err) {
    return handleApiError(err);
  }
}
