import { prisma } from "../prisma";
import { ApiError } from "../http";
import { computeSubmissionPolicy } from "@/lib/submission-policy";
import { SubmissionStatus } from "@/types";
import { deleteStoredFile, persistFile, ValidatedFile } from "../uploads";
import { toSubmissionState } from "./student";

// ---------------------------------------------------------------------------
// Student submission mutations (spec §24–§29, §63, §73). Every write
// re-derives the submission policy from the server clock — the client can never
// force a submission through.
// ---------------------------------------------------------------------------

const SUBMITTED_STATUSES: SubmissionStatus[] = ["SUBMITTED", "LATE", "GRADED"];

async function loadEditableContext(studentId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { session: { select: { id: true, subjectId: true } } },
  });
  if (!task) throw new ApiError("Task not found.", 404, "NOT_FOUND");
  if (task.status === "DRAFT") {
    throw new ApiError("This task has not been published yet.", 403, "FORBIDDEN");
  }

  const enrolled = await prisma.sessionStudent.findUnique({
    where: { sessionId_studentId: { sessionId: task.sessionId, studentId } },
  });
  if (!enrolled) {
    throw new ApiError("You are not enrolled in this practical session.", 403, "FORBIDDEN");
  }

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: { files: true },
  });

  const policy = computeSubmissionPolicy(
    {
      status: task.status,
      deadline: task.deadline ? task.deadline.getTime() : null,
      allowLateSubmission: task.allowLateSubmission,
      allowResubmission: task.allowResubmission,
      resubmissionDeadline: task.resubmissionDeadline ? task.resubmissionDeadline.getTime() : null,
    },
    submission?.status ?? "NOT_STARTED",
    Date.now()
  );

  return { task, submission, policy };
}

function ensureEditable(policy: ReturnType<typeof computeSubmissionPolicy>) {
  if (!policy.canEditFiles) {
    throw new ApiError(policy.lockReason ?? "This submission can no longer be edited.", 403, "SUBMISSION_NOT_ALLOWED");
  }
}

async function reloadState(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      files: { orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }] },
      versions: { orderBy: { versionNumber: "desc" }, include: { createdBy: { select: { name: true } } } },
      grade: true,
    },
  });
  return toSubmissionState(submission);
}

/** Autosaved practical notes (spec §26). Creates a draft row on first save. */
export async function saveSubmissionNotes(studentId: string, taskId: string, notes: string) {
  const { policy } = await loadEditableContext(studentId, taskId);
  ensureEditable(policy);

  const submission = await prisma.submission.upsert({
    where: { taskId_studentId: { taskId, studentId } },
    create: { taskId, studentId, status: "DRAFT", notes },
    update: { notes },
    select: { id: true, status: true },
  });
  return { id: submission.id, status: submission.status, savedAt: new Date().toISOString() };
}

/**
 * Upload one or more files as a new submission version (spec §22, §25, §128).
 * The new version becomes the current working set; earlier versions are kept.
 */
export async function uploadSubmissionFiles(
  studentId: string,
  userId: string,
  taskId: string,
  files: ValidatedFile[]
) {
  const { task, policy } = await loadEditableContext(studentId, taskId);
  ensureEditable(policy);

  if (files.length === 0) {
    throw new ApiError("No valid files were provided.", 400, "INVALID_FILE");
  }
  if (files.length > task.maxFiles) {
    throw new ApiError(
      `This task allows at most ${task.maxFiles} file${task.maxFiles === 1 ? "" : "s"} per submission.`,
      400,
      "INVALID_FILE"
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: { files: { select: { id: true } }, versions: { select: { versionNumber: true } } },
  });

  const nextVersion =
    (submission?.versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) ?? 0) + 1;

  const dir = `subjects/${task.session.subjectId}/sessions/${task.session.id}/tasks/${task.id}/students/${studentId}`;
  const stored: { validated: ValidatedFile; stored: Awaited<ReturnType<typeof persistFile>> }[] = [];
  for (const file of files) {
    stored.push({ validated: file, stored: await persistFile(dir, file) });
  }

  const submissionId = await prisma.$transaction(async (tx) => {
    const shell = submission
      ? { id: submission.id, status: submission.status }
      : await tx.submission.create({
          data: { taskId, studentId, status: "DRAFT" },
          select: { id: true, status: true },
        });

    // Previous working set becomes history.
    await tx.submissionFile.updateMany({
      where: { submissionId: shell.id, isLatest: true },
      data: { isLatest: false },
    });

    await tx.submissionVersion.create({
      data: { submissionId: shell.id, versionNumber: nextVersion, createdById: userId, notes: "Uploaded files" },
    });

    await tx.submissionFile.createMany({
      data: stored.map(({ validated, stored: s }) => ({
        submissionId: shell.id,
        versionNumber: nextVersion,
        originalName: validated.originalName,
        storedName: s.storedName,
        mimeType: validated.mimeType,
        sizeBytes: s.sizeBytes,
        storageKey: s.storageKey,
        isLatest: true,
        uploadedById: userId,
      })),
    });

    // Promote a fresh/in-progress submission to DRAFT; leave submitted rows as-is.
    if (!SUBMITTED_STATUSES.includes(shell.status)) {
      await tx.submission.update({ where: { id: shell.id }, data: { status: "DRAFT" } });
    }

    return shell.id;
  });

  return reloadState(submissionId);
}

/** Remove a file from the current version while the submission remains editable. */
export async function deleteSubmissionFile(
  studentId: string,
  taskId: string,
  fileId: string
) {
  const { policy } = await loadEditableContext(studentId, taskId);
  ensureEditable(policy);

  const file = await prisma.submissionFile.findUnique({
    where: { id: fileId },
    include: { submission: { select: { id: true, studentId: true, taskId: true } } },
  });
  if (!file || file.submission.taskId !== taskId || file.submission.studentId !== studentId) {
    throw new ApiError("File not found.", 404, "NOT_FOUND");
  }

  await prisma.submissionFile.delete({ where: { id: file.id } });
  await deleteStoredFile(file.storageKey);
  return reloadState(file.submission.id);
}

/** Finalize the submission using the server clock (spec §27, §28). */
export async function submitSubmission(studentId: string, userId: string, taskId: string) {
  const { task, policy } = await loadEditableContext(studentId, taskId);
  if (!policy.canSubmit) {
    throw new ApiError(policy.lockReason ?? "This submission can no longer be submitted.", 403, "SUBMISSION_NOT_ALLOWED");
  }

  const submission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId } },
    include: { files: { where: { isLatest: true }, select: { id: true } }, versions: { select: { versionNumber: true } } },
  });

  if (!submission || submission.files.length === 0) {
    throw new ApiError(
      "Upload at least one file before submitting this practical.",
      400,
      "SUBMISSION_NOT_ALLOWED"
    );
  }

  const now = new Date();
  const status: SubmissionStatus = policy.statusOnSubmit;

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: { status, submittedAt: now },
    });
    // Record a version snapshot for the submission event.
    const nextVersion = submission.versions.reduce((max, v) => Math.max(max, v.versionNumber), 0) + 1;
    await tx.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNumber: nextVersion,
        createdById: userId,
        notes: status === "LATE" ? "Final submission (late)" : "Final submission",
      },
    });
  });

  return { status, submittedAt: now.toISOString(), taskTitle: task.title };
}
