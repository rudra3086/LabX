import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import {
  assertTaskOwnership,
  getTaskResources,
  toTaskResourceRow,
} from "@/lib/server/services/faculty";
import { persistFile, validateUpload } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const resources = await getTaskResources(faculty.faculty!.id, params.id);
    return jsonSuccess({ resources });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const task = await assertTaskOwnership(facultyId, params.id);
    if (task.status === "ARCHIVED") {
      throw new ApiError("Cannot add resources to an archived task.", 400, "BAD_REQUEST");
    }

    const form = await req.formData().catch(() => {
      throw new ApiError("Expected a multipart form upload.", 400, "INVALID_BODY");
    });
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ApiError("A file is required.", 422, "VALIDATION_ERROR", {
        file: ["A file is required."],
      });
    }
    const rawTitle = form.get("title");
    const title =
      typeof rawTitle === "string" && rawTitle.trim().length > 0
        ? rawTitle.trim().slice(0, 200)
        : file.name.slice(0, 200);

    const validated = await validateUpload(file);
    const dir = `subjects/${task.session.subject.id}/sessions/${task.sessionId}/tasks/${task.id}/resources`;
    const stored = await persistFile(dir, validated);

    const resource = await prisma.taskResource.create({
      data: {
        taskId: task.id,
        title,
        originalName: validated.originalName,
        storedName: stored.storedName,
        mimeType: validated.mimeType,
        sizeBytes: stored.sizeBytes,
        storageKey: stored.storageKey,
        uploadedById: faculty.id,
      },
    });

    await recordAudit({
      actorId: faculty.id,
      action: "FILE_UPLOADED",
      entityType: "TaskResource",
      entityId: resource.id,
      metadata: { taskId: task.id, originalName: validated.originalName, sizeBytes: stored.sizeBytes },
    });

    return jsonSuccess({ resource: toTaskResourceRow(resource) }, "Resource uploaded.", 201);
  } catch (err) {
    return handleApiError(err);
  }
}
