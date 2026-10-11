import { requireRole } from "@/lib/server/rbac";
import { handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { submitSubmission } from "@/lib/server/services/submissions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/**
 * Finalize a practical submission. The server clock decides on-time vs late
 * (spec §28) and the submission is only accepted when policy allows it.
 */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const student = await requireRole("STUDENT");
    const result = await submitSubmission(student.student!.id, student.id, params.id);

    await recordAudit({
      actorId: student.id,
      action: "SUBMISSION_CREATED",
      entityType: "Submission",
      entityId: params.id,
      metadata: { taskId: params.id, status: result.status },
    });

    // Notify the faculty owner that a submission is awaiting review.
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      select: { title: true, session: { select: { faculty: { select: { userId: true } } } } },
    });
    if (task) {
      await prisma.notification.create({
        data: {
          userId: task.session.faculty.userId,
          type: "GENERAL",
          title: "New submission received",
          message: `${student.name} submitted "${task.title}".`,
          link: `/faculty/tasks/${params.id}/submissions`,
        },
      });
    }

    return jsonSuccess(
      {
        status: result.status,
        submittedAt: result.submittedAt,
        taskTitle: result.taskTitle,
      },
      result.status === "LATE" ? "Submitted (marked late)." : "Submitted on time."
    );
  } catch (err) {
    return handleApiError(err);
  }
}
