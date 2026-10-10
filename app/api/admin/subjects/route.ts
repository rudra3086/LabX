import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess, prismaConflict } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { subjectUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { getAdminSubjects } from "@/lib/server/services/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return jsonSuccess({ subjects: await getAdminSubjects() });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = subjectUpsertSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const { code, name, semester, department, description } = parsed.data;

    try {
      const subject = await prisma.subject.create({
        data: { code: code.toUpperCase(), name, semester, department, description },
      });
      await recordAudit({
        actorId: admin.id,
        action: "SUBJECT_CREATE",
        entityType: "Subject",
        entityId: subject.id,
        metadata: { code: subject.code, name: subject.name },
      });
      return jsonSuccess({ subject: getAdminSubjectRow(subject) }, "Subject created.", 201);
    } catch (err) {
      throw prismaConflict(err, {
        code: "This subject code already exists.",
      });
    }
  } catch (err) {
    return handleApiError(err);
  }
}

function getAdminSubjectRow(subject: { id: string; code: string; name: string; semester: number; department: string; description: string | null; status: "ACTIVE" | "INACTIVE"; createdAt: Date }) {
  return {
    id: subject.id,
    code: subject.code,
    name: subject.name,
    semester: subject.semester,
    department: subject.department,
    description: subject.description,
    status: subject.status,
    sessionCount: 0,
    facultyCount: 0,
    createdAt: subject.createdAt.toISOString(),
  };
}