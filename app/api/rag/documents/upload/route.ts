import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/rbac";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/server/http";
import { assertSubjectAccess } from "@/lib/server/services/rag-access";
import { indexRagDocument } from "@/lib/server/rag";
import { deleteStoredFile, persistFile, validateUpload } from "@/lib/server/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireRole("FACULTY");
    const form = await request.formData();
    const file = form.get("file");
    const subjectId = String(form.get("subjectId") ?? "");
    const unit = String(form.get("unit") ?? "").trim();
    if (!(file instanceof File) || !subjectId || !unit) {
      throw new ApiError("PDF, subject and unit are required.", 400, "VALIDATION_ERROR");
    }
    const access = await assertSubjectAccess(user.id, "FACULTY", subjectId);
    const validated = await validateUpload(file, { allowedExtensions: [".pdf"] });
    const documentId = randomUUID();
    const stored = await persistFile(`rag/${documentId}`, validated);
    try {
      const indexed = await indexRagDocument({
        storageKey: stored.storageKey,
        originalName: validated.originalName,
        documentId,
        subjectId,
        facultyId: access.facultyId!,
        unit,
      });
      const document = await prisma.ragDocument.create({
        data: {
          id: documentId,
          subjectId,
          facultyId: access.facultyId!,
          uploadedById: user.id,
          originalName: validated.originalName,
          storageKey: stored.storageKey,
          unit,
          pageCount: indexed.pages,
          chunkCount: indexed.chunks,
        },
        include: { subject: { select: { code: true } } },
      });
      return jsonSuccess(document, "Material indexed.", 201);
    } catch (error) {
      await prisma.ragDocument.deleteMany({ where: { id: documentId } });
      await deleteStoredFile(stored.storageKey);
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
