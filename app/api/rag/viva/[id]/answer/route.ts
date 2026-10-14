import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/rbac";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/server/http";
import { ragVivaEvaluate } from "@/lib/server/rag";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("STUDENT");
    const student = await prisma.student.findUniqueOrThrow({ where: { userId: user.id } });
    const session = await prisma.vivaSession.findFirst({ where: { id: params.id, studentId: student.id } });
    if (!session) throw new ApiError("Viva session not found.", 404, "NOT_FOUND");
    const body = await request.json();
    const questions = session.questions as Array<{ question: string }>;
    const question = questions[session.current];
    if (!question) throw new ApiError("This viva session is complete.", 400, "VIVA_COMPLETE");
    const evaluation = await ragVivaEvaluate(session.subjectId, question.question, body.answer);
    await prisma.vivaAnswer.create({
      data: {
        sessionId: session.id,
        question: question.question,
        answer: body.answer,
        feedback: evaluation.feedback,
        score: evaluation.score,
      },
    });
    await prisma.vivaSession.update({ where: { id: session.id }, data: { current: { increment: 1 } } });
    return jsonSuccess({ question: question.question, ...evaluation, complete: session.current + 1 >= questions.length });
  } catch (error) {
    return handleApiError(error);
  }
}
