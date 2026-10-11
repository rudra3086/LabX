import { requireUser } from "@/lib/server/rbac";
import { ApiError, handleApiError } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { contentDisposition, readStoredFile } from "@/lib/server/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: { id: string } };

/**
 * Authorized submission-file download (spec §56, §91, §105, §106). Students may
 * only download their own files; faculty may download files for tasks in their
 * own sessions; admins have administrative access.
 */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();

    const file = await prisma.submissionFile.findUnique({
      where: { id: params.id },
      include: {
        submission: {
          include: {
            task: { include: { session: { select: { id: true, facultyId: true } } } },
          },
        },
      },
    });
    if (!file) throw new ApiError("File not found.", 404, "NOT_FOUND");

    const submission = file.submission;
    if (user.role === "STUDENT") {
      if (!user.student || submission.studentId !== user.student.id) {
        throw new ApiError("You do not have access to this file.", 403, "FORBIDDEN");
      }
    } else if (user.role === "FACULTY") {
      if (!user.faculty || submission.task.session.facultyId !== user.faculty.id) {
        throw new ApiError("You do not have access to this file.", 403, "FORBIDDEN");
      }
    }

    const buffer = await readStoredFile(file.storageKey);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(buffer.length),
        "Content-Disposition": contentDisposition(file.originalName),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
