import { requireUser } from "@/lib/server/rbac";
import { ApiError, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { contentDisposition, readStoredFile } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/**
 * Authorized reference-material download (spec §19, §56, §91). Access is
 * checked server-side: admins may view any resource; faculty may view resources
 * on tasks in their own sessions; students may view resources only for
 * non-draft tasks in sessions they are enrolled in.
 */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();

    const resource = await prisma.taskResource.findUnique({
      where: { id: params.id },
      include: {
        task: {
          include: { session: { select: { id: true, facultyId: true, status: true } } },
        },
      },
    });
    if (!resource) throw new ApiError("Resource not found.", 404, "NOT_FOUND");

    const task = resource.task;
    const session = task.session;

    if (user.role === "FACULTY") {
      if (!user.faculty || session.facultyId !== user.faculty.id) {
        throw new ApiError("You do not have access to this resource.", 403, "FORBIDDEN");
      }
    } else if (user.role === "STUDENT") {
      if (!user.student) throw new ApiError("Student profile required.", 403, "FORBIDDEN");
      if (task.status === "DRAFT") {
        throw new ApiError("This task is not published yet.", 403, "FORBIDDEN");
      }
      const enrolled = await prisma.sessionStudent.findUnique({
        where: { sessionId_studentId: { sessionId: session.id, studentId: user.student.id } },
      });
      if (!enrolled) {
        throw new ApiError("You do not have access to this resource.", 403, "FORBIDDEN");
      }
    }

    const buffer = await readStoredFile(resource.storageKey);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": resource.mimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": contentDisposition(resource.originalName, true),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
