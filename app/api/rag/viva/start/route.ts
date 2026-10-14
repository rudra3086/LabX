import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { assertSubjectAccess } from "@/lib/server/services/rag-access";
import { ragVivaQuestions } from "@/lib/server/rag";

export async function POST(request: Request) {
  try {
    const user = await requireRole("STUDENT");
    const body = await request.json();
    const access = await assertSubjectAccess(user.id, "STUDENT", body.subjectId);
    const questions = await ragVivaQuestions(body.subjectId, body.count);
    const session = await prisma.vivaSession.create({
      data: { subjectId: body.subjectId, studentId: access.studentId!, questions },
    });
    return jsonSuccess({ id: session.id, questions }, "Viva started.", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
