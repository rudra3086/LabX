import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { taskUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { assertSessionOwnership } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const { sessionId, ...taskData } = body;
    if (!sessionId || typeof sessionId !== "string") {
      throw new ApiError("sessionId is required.", 422, "VALIDATION_ERROR", {
        sessionId: ["Session is required."],
      });
    }
    const parsed = taskUpsertSchema.safeParse(taskData);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const session = await assertSessionOwnership(facultyId, sessionId);
    if (session.status === "ARCHIVED") {
      throw new ApiError("Cannot add tasks to an archived session.", 400, "BAD_REQUEST");
    }

    const task = await prisma.task.create({
      data: {
        sessionId,
        title: parsed.data.title,
        description: parsed.data.description,
        instructions: parsed.data.instructions,
        maximumMarks: parsed.data.maximumMarks,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        allowLateSubmission: parsed.data.allowLateSubmission,
        submissionFormat: parsed.data.submissionFormat,
        fileNamingConvention: parsed.data.fileNamingConvention,
        requiredFileTypes: parsed.data.requiredFileTypes,
        status: "DRAFT",
      },
    });

    await recordAudit({
      actorId: faculty.id,
      action: "TASK_CREATE",
      entityType: "Task",
      entityId: task.id,
      metadata: { title: task.title, sessionId },
    });
    return jsonSuccess(
      { task: { id: task.id, sessionId: task.sessionId, title: task.title, status: task.status } },
      "Task created as a draft.",
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}