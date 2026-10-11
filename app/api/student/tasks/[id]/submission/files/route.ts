import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { validateUpload, ALLOWED_EXTENSIONS, ValidatedFile } from "@/lib/server/uploads";
import { uploadSubmissionFiles } from "@/lib/server/services/submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

function parseAllowedExtensions(requiredFileTypes: string | null): string[] {
  if (!requiredFileTypes) return ALLOWED_EXTENSIONS;
  const parsed = requiredFileTypes
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((e) => (e.startsWith(".") ? e : `.${e}`));
  return parsed.length > 0 ? parsed : ALLOWED_EXTENSIONS;
}

/** Upload one or more files, creating a new submission version (spec §22, §25). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const student = await requireRole("STUDENT");
    const studentId = student.student!.id;

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { id: true, maxFileSizeMb: true, requiredFileTypes: true },
    });
    if (!task) throw new ApiError("Task not found.", 404, "NOT_FOUND");

    const form = await req.formData().catch(() => {
      throw new ApiError("Expected a multipart form upload.", 400, "INVALID_BODY");
    });
    const uploads = form.getAll("files").filter((v): v is File => v instanceof File);
    if (uploads.length === 0) {
      const single = form.get("file");
      if (single instanceof File) uploads.push(single);
    }
    if (uploads.length === 0) {
      throw new ApiError("Select at least one file to upload.", 422, "VALIDATION_ERROR", {
        files: ["Select at least one file to upload."],
      });
    }

    const allowed = parseAllowedExtensions(task.requiredFileTypes);
    const validated: ValidatedFile[] = [];
    for (const file of uploads) {
      validated.push(await validateUpload(file, { allowedExtensions: allowed, maxSizeMb: task.maxFileSizeMb }));
    }

    const state = await uploadSubmissionFiles(studentId, student.id, params.id, validated);
    await recordAudit({
      actorId: student.id,
      action: "SUBMISSION_UPDATED",
      entityType: "Submission",
      entityId: state.id,
      metadata: { taskId: params.id, files: validated.map((v) => v.originalName) },
    });

    return jsonSuccess({ submission: state }, "Files uploaded.", 201);
  } catch (err) {
    return handleApiError(err);
  }
}
