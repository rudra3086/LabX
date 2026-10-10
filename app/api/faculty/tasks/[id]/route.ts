import { requireRole } from "@/lib/server/rbac";
import { ApiError, handleApiError, jsonSuccess } from "@/lib/server/http";
import { prisma } from "@/lib/server/prisma";
import { recordAudit } from "@/lib/server/audit";
import { taskPatchSchema, zodFieldErrors } from "@/lib/schemas";
import {
  assertSessionOwnership,
  getFacultyTaskDetail,
} from "@/lib/server/services/faculty";
import type { Prisma, TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  DRAFT: ["PUBLISHED", "ARCHIVED"],
  PUBLISHED: ["CLOSED", "ARCHIVED"],
  CLOSED: ["PUBLISHED", "ARCHIVED"],
  ARCHIVED: [],
};

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    return jsonSuccess({ task: await getFacultyTaskDetail(faculty.faculty!.id, params.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const existing = await prisma.task.findUnique({ where: { id: params.id } });
    if (!existing) throw new ApiError("Task not found.", 404, "NOT_FOUND");
    const session = await assertSessionOwnership(facultyId, existing.sessionId);
    if (existing.status === "ARCHIVED") {
      throw new ApiError("Archived tasks cannot be edited.", 400, "BAD_REQUEST");
    }
    if (session.status === "ARCHIVED") {
      throw new ApiError("Cannot edit tasks in an archived session.", 400, "BAD_REQUEST");
    }

    const body = await req.json().catch(() => {
      throw new ApiError("Invalid JSON body.", 400, "INVALID_BODY");
    });
    const parsed = taskPatchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Validation failed.", 422, "VALIDATION_ERROR", zodFieldErrors(parsed.error));
    }
    const p = parsed.data;

    const data: Prisma.TaskUpdateInput = {};
    const changed: string[] = [];

    if (p.title !== undefined && p.title !== existing.title) { data.title = p.title; changed.push("title"); }
    if (p.description !== undefined && (p.description ?? null) !== existing.description) { data.description = p.description ?? null; changed.push("description"); }
    if (p.instructions !== undefined && (p.instructions ?? null) !== existing.instructions) { data.instructions = p.instructions ?? null; changed.push("instructions"); }
    if (p.maximumMarks !== undefined && p.maximumMarks !== existing.maximumMarks) { data.maximumMarks = p.maximumMarks; changed.push("maximumMarks"); }
    if (p.deadline !== undefined) {
      const next = p.deadline ? new Date(p.deadline) : null;
      const prevMillis = existing.deadline ? existing.deadline.getTime() : 0;
      if ((next ? next.getTime() : 0) !== prevMillis) {
        data.deadline = next;
        changed.push("deadline");
      }
    }
    if (p.allowLateSubmission !== undefined && p.allowLateSubmission !== existing.allowLateSubmission) { data.allowLateSubmission = p.allowLateSubmission; changed.push("allowLateSubmission"); }
    if (p.submissionFormat !== undefined && (p.submissionFormat ?? null) !== existing.submissionFormat) { data.submissionFormat = p.submissionFormat ?? null; changed.push("submissionFormat"); }
    if (p.fileNamingConvention !== undefined && (p.fileNamingConvention ?? null) !== existing.fileNamingConvention) { data.fileNamingConvention = p.fileNamingConvention ?? null; changed.push("fileNamingConvention"); }
    if (p.requiredFileTypes !== undefined && (p.requiredFileTypes ?? null) !== existing.requiredFileTypes) { data.requiredFileTypes = p.requiredFileTypes ?? null; changed.push("requiredFileTypes"); }

    if (p.status !== undefined && p.status !== existing.status) {
      if (p.status === "PUBLISHED" && session.status !== "ACTIVE") {
        throw new ApiError(
          "Tasks can only be published in an active session.",
          400,
          "INVALID_TRANSITION"
        );
      }
      const allowed = TASK_TRANSITIONS[existing.status];
      if (!allowed.includes(p.status)) {
        throw new ApiError(
          `Cannot move a ${existing.status} task to ${p.status}.`,
          400,
          "INVALID_TRANSITION"
        );
      }
      data.status = p.status;
      changed.push("status");
    }

    if (Object.keys(data).length === 0) {
      return jsonSuccess(
        { task: await getFacultyTaskDetail(facultyId, params.id) },
        "No changes."
      );
    }

    await prisma.task.update({ where: { id: params.id }, data });
    await recordAudit({
      actorId: faculty.id,
      action: "TASK_UPDATE",
      entityType: "Task",
      entityId: params.id,
      metadata: { changed },
    });
    return jsonSuccess(
      { task: await getFacultyTaskDetail(facultyId, params.id) },
      "Task updated."
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const faculty = await requireRole("FACULTY");
    const facultyId = faculty.faculty!.id;
    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) throw new ApiError("Task not found.", 404, "NOT_FOUND");
    await assertSessionOwnership(facultyId, task.sessionId);
    if (task.status === "ARCHIVED") {
      throw new ApiError("Task is already archived.", 400, "BAD_REQUEST");
    }
    await prisma.task.update({ where: { id: params.id }, data: { status: "ARCHIVED" } });
    await recordAudit({
      actorId: faculty.id,
      action: "TASK_ARCHIVE",
      entityType: "Task",
      entityId: params.id,
    });
    return jsonSuccess({ taskId: params.id }, "Task archived.");
  } catch (err) {
    return handleApiError(err);
  }
}