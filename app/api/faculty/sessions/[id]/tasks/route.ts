import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { getSessionTasks } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    return jsonSuccess({ tasks: await getSessionTasks(faculty.faculty!.id, params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}