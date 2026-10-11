import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { recordAudit } from "@/lib/server/audit";
import { gradeSubmission } from "@/lib/server/services/faculty";
import { zodFieldErrors, gradeSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string; studentId: string } };

/** Create or update a grade (spec §34–§36, §62, §92). */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }

    const result = await gradeSubmission(
      faculty.faculty!.id,
      faculty.id,
      params.id,
      params.studentId,
      parsed.data
    );

    await recordAudit({
      actorId: faculty.id,
      action: "GRADE_UPDATED",
      entityType: "Grade",
      entityId: params.studentId,
      metadata: {
        taskId: params.id,
        studentId: params.studentId,
        marks: result.marks,
        maximumMarks: result.maximumMarks,
      },
    });

    return jsonSuccess({ grade: result }, "Submission graded.");
  } catch (err) {
    return handleApiError(err);
  }
}
