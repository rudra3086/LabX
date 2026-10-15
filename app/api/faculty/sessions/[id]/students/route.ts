import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { rosterRemoveSchema, rosterSchema, zodFieldErrors } from "@/lib/schemas";
import {
  assertSessionOwnership,
  getSessionStudents,
} from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };
const NO_BATCH = "__NO_BATCH__";

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    return jsonSuccess({ students: await getSessionStudents(faculty.faculty!.id, params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    await assertSessionOwnership(facultyId, params.id);

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = rosterSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const { batchNames } = parsed.data;
    const session = await prisma.practicalSession.findUnique({
      where: { id: params.id },
      select: { batch: true, subjectId: true },
    });
    if (!session) throw new ApiError("Session not found.", 404, "NOT_FOUND");
    if (session.batch && batchNames.some((batch) => batch !== session.batch)) {
      throw new ApiError(
        `This session is configured for batch "${session.batch}". Create a separate session for another batch.`,
        400,
        "BATCH_MISMATCH"
      );
    }

    // Enroll all existing active students from the selected batches.
    const selectedBatches = batchNames.filter((batch) => batch !== NO_BATCH);
    const includeStudentsWithoutBatch = batchNames.includes(NO_BATCH);
    const batchFilter =
      selectedBatches.length > 0 || includeStudentsWithoutBatch
        ? {
            OR: [
              ...(selectedBatches.length > 0 ? [{ batch: { in: selectedBatches } }] : []),
              ...(includeStudentsWithoutBatch ? [{ batch: null }] : []),
            ],
          }
        : {};
    const students = await prisma.student.findMany({
      where: {
        ...batchFilter,
        status: "ACTIVE",
        user: { status: "ACTIVE" },
        subjectLinks: { some: { subjectId: session.subjectId } },
      },
      select: { id: true },
    });
    if (students.length === 0) {
      throw new ApiError("No valid students to add.", 400, "BAD_REQUEST");
    }
    const validIds = students.map((s) => s.id);

    await prisma.sessionStudent.createMany({
      data: validIds.map((studentId) => ({ sessionId: params.id, studentId })),
      skipDuplicates: true,
    });
    await recordAudit({
      actorId: faculty.id,
      action: "SESSION_STUDENTS_ADD",
      entityType: "PracticalSession",
      entityId: params.id,
      metadata: { batches: batchNames, added: validIds },
    });
    return jsonSuccess(
      { students: await getSessionStudents(facultyId, params.id) },
      `Added ${validIds.length} student${validIds.length === 1 ? "" : "s"} from ${batchNames.length === 1 ? "the selected batch" : "the selected batches"}.`
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    await assertSessionOwnership(facultyId, params.id);

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = rosterRemoveSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const { studentIds } = parsed.data;

    const removed = studentIds.length;
    await prisma.sessionStudent.deleteMany({
      where: { sessionId: params.id, studentId: { in: studentIds } },
    });
    await recordAudit({
      actorId: faculty.id,
      action: "SESSION_STUDENTS_REMOVE",
      entityType: "PracticalSession",
      entityId: params.id,
      metadata: { removed: studentIds },
    });
    return jsonSuccess(
      { students: await getSessionStudents(facultyId, params.id) },
      `Removed ${removed} student${removed === 1 ? "" : "s"} from the session.`
    );
  } catch (err) {
    return handleApiError(err);
  }
}