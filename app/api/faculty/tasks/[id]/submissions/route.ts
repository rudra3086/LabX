import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { getTaskSubmissions } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/** Submission overview for a task (spec §33). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const data = await getTaskSubmissions(faculty.faculty!.id, params.id);
    return jsonSuccess(data);
  } catch (err) {
    return handleApiError(err);
  }
}
