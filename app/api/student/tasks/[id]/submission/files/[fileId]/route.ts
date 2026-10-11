import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { recordAudit } from "@/lib/server/audit";
import { deleteSubmissionFile } from "@/lib/server/services/submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string; fileId: string } };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const student = await requireRole("STUDENT");
    const state = await deleteSubmissionFile(student.student!.id, params.id, params.fileId);
    await recordAudit({
      actorId: student.id,
      action: "FILE_DELETED",
      entityType: "SubmissionFile",
      entityId: params.fileId,
      metadata: { taskId: params.id },
    });
    return jsonSuccess({ submission: state }, "File removed.");
  } catch (err) {
    return handleApiError(err);
  }
}
