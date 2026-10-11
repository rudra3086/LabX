import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { zodFieldErrors, submissionNotesSchema } from "@/lib/schemas";
import { getStudentTaskDetail } from "@/lib/server/services/student";
import { saveSubmissionNotes } from "@/lib/server/services/submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/** Current submission + task state (used for client refreshes). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const student = await requireRole("STUDENT");
    const detail = await getStudentTaskDetail(student.student!.id, params.id);
    return jsonSuccess(detail);
  } catch (err) {
    return handleApiError(err);
  }
}

/** Autosave practical notes (spec §26). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const student = await requireRole("STUDENT");
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = submissionNotesSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const saved = await saveSubmissionNotes(student.student!.id, params.id, parsed.data.notes);
    return jsonSuccess({ savedAt: saved.savedAt }, "Saved.");
  } catch (err) {
    return handleApiError(err);
  }
}
