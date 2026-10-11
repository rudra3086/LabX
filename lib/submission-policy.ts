import { SubmissionStatus, TaskStatus } from "@/types";

// ============================================================================
// Submission policy (spec §27, §28, §29, §61, §132). Pure, deterministic and
// shared by the server (authoritative) and any client that wants to reflect the
// same rules. The server recomputes this on every mutating request.
// ============================================================================

export interface SubmissionTaskConfig {
  status: TaskStatus;
  /** Deadline in epoch ms, or null when the task has no deadline. */
  deadline: number | null;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  /** Resubmission deadline in epoch ms, or null to fall back to the task deadline. */
  resubmissionDeadline: number | null;
}

export interface SubmissionPolicyResult {
  canEditFiles: boolean;
  canSubmit: boolean;
  lockReason: string | null;
  statusOnSubmit: "SUBMITTED" | "LATE";
}

export function computeSubmissionPolicy(
  config: SubmissionTaskConfig,
  submissionStatus: SubmissionStatus,
  nowMs: number
): SubmissionPolicyResult {
  const isLate = config.deadline !== null && nowMs > config.deadline;
  const statusOnSubmit: "SUBMITTED" | "LATE" = isLate ? "LATE" : "SUBMITTED";

  const locked = (reason: string): SubmissionPolicyResult => ({
    canEditFiles: false,
    canSubmit: false,
    lockReason: reason,
    statusOnSubmit,
  });

  if (config.status === "ARCHIVED") {
    return locked("This practical has been archived.");
  }
  if (config.status === "CLOSED") {
    return locked("This practical is closed and is no longer accepting submissions.");
  }
  if (submissionStatus === "GRADED") {
    return locked("This submission has been graded and can no longer be changed.");
  }

  const alreadySubmitted = submissionStatus === "SUBMITTED" || submissionStatus === "LATE";

  if (alreadySubmitted) {
    if (!config.allowResubmission) {
      return locked("You have already submitted this practical. Resubmission is not allowed.");
    }
    // Resubmission window: explicit resubmission deadline, else the task deadline.
    const windowEnd = config.resubmissionDeadline ?? config.deadline;
    if (windowEnd !== null && nowMs > windowEnd) {
      return locked("The resubmission window has closed.");
    }
    return { canEditFiles: true, canSubmit: true, lockReason: null, statusOnSubmit };
  }

  // Not yet submitted (NOT_STARTED / DRAFT / MISSED).
  if (isLate && !config.allowLateSubmission) {
    return locked("The deadline has passed and late submissions are not allowed.");
  }

  return { canEditFiles: true, canSubmit: true, lockReason: null, statusOnSubmit };
}
