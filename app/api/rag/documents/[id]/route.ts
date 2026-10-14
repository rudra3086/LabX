import { prisma } from "@/lib/server/prisma";
import { requireRole } from "@/lib/server/rbac";
import { handleApiError, ApiError, jsonSuccess } from "@/lib/server/http";
import { deleteRagDocument } from "@/lib/server/rag";
import { deleteStoredFile } from "@/lib/server/uploads";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireRole("FACULTY");
    const faculty = await prisma.faculty.findUniqueOrThrow({ where: { userId: user.id } });
    const document = await prisma.ragDocument.findFirst({ where: { id: params.id, facultyId: faculty.id } });
    if (!document) throw new ApiError("Document not found.", 404, "NOT_FOUND");
    await deleteRagDocument(document.id);
    await prisma.ragDocument.delete({ where: { id: document.id } });
    await deleteStoredFile(document.storageKey);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
