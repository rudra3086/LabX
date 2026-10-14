import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { assertSubjectAccess } from "@/lib/server/services/rag-access";
import { ragSearch } from "@/lib/server/rag";

export async function POST(request: Request) {
  try {
    const user = await requireRole("FACULTY", "STUDENT");
    const body = await request.json();
    await assertSubjectAccess(user.id, user.role, body.subjectId);
    return jsonSuccess(await ragSearch(body.subjectId, body.question, body.limit));
  } catch (error) {
    return handleApiError(error);
  }
}
