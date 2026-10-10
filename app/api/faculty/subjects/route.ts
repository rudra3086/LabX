import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { getFacultySubjects } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const faculty = await requireRole("FACULTY");
    return jsonSuccess({ subjects: await getFacultySubjects(faculty.faculty!.id) });
  } catch (err) {
    return handleApiError(err);
  }
}