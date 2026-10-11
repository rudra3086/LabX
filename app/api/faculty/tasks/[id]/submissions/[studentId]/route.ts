import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { getSubmissionForGrading } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string; studentId: string } };

/** One student's submission, opened for grading (spec §34). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const data = await getSubmissionForGrading(
      faculty.faculty!.id,
      params.id,
      params.studentId
    );
    return jsonSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
