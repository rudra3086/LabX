"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Trash2,
  FileText,
  Download,
  CircleAlert,
  Loader2,
  Send,
  CheckCircle2,
  Lock,
  History,
  Cloud,
  CloudOff,
  CloudUpload,
} from "lucide-react";
import type {
  StudentTaskDetail,
  SubmissionFileItem,
  SubmissionState,
  SubmissionVersionItem,
} from "@/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBytes } from "@/lib/utils";
import { formatIST } from "@/lib/date";
import {
  uploadWithProgress,
  describeUploadError,
  clientValidateFile,
} from "@/lib/upload-client";
import { useDebounce } from "@/hooks/use-debounce";

type SaveState = "idle" | "saving" | "saved" | "error";

function parseAllowed(requiredFileTypes: string | null): string[] | undefined {
  if (!requiredFileTypes) return undefined;
  const list = requiredFileTypes
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((e) => (e.startsWith(".") ? e : `.${e}`));
  return list.length > 0 ? list : undefined;
}

export function SubmissionWorkspace({ detail }: { detail: StudentTaskDetail }) {
  const router = useRouter();
  const { task, policy, submission: initial } = detail;

  const [state, setState] = useState<SubmissionState>(initial);
  const [notes, setNotes] = useState(initial.notes);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(initial.updatedAt);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SubmissionFileItem | null>(null);
  const [justSubmitted, setJustSubmitted] = useState<{
    status: "SUBMITTED" | "LATE";
    submittedAt: string;
    fileCount: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editable = policy.canEditFiles && !justSubmitted;
  const submittable = policy.canSubmit && !justSubmitted;
  const lastSavedRef = useRef(initial.notes);

  const debouncedNotes = useDebounce(notes, 1200);

  useEffect(() => {
    if (!editable) return;
    if (debouncedNotes === lastSavedRef.current) return;
    let cancelled = false;
    setSaveState("saving");
    (async () => {
      try {
        const res = await fetch(`/api/student/tasks/${task.id}/submission`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: debouncedNotes }),
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok || !body.success) {
          setSaveState("error");
          return;
        }
        lastSavedRef.current = debouncedNotes;
        setSavedAt(body.data.savedAt);
        setSaveState("saved");
      } catch {
        if (!cancelled) setSaveState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedNotes, editable, task.id]);

  const allowed = useMemo(() => parseAllowed(task.requiredFileTypes), [task.requiredFileTypes]);

  const latestFiles = useMemo(() => state.files.filter((f) => f.isLatest), [state.files]);
  const olderFiles = useMemo(() => state.files.filter((f) => !f.isLatest), [state.files]);
  const latestVersion = state.latestVersion ?? 0;

  const handleFiles = async (fileList: FileList | null) => {
    setError(null);
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const batchTooLarge = files.length > task.maxFiles;
    if (batchTooLarge) {
      setError(`This task allows at most ${task.maxFiles} file(s) per submission.`);
      return;
    }
    for (const f of files) {
      const invalid = clientValidateFile(f, { allowedExtensions: allowed, maxSizeMb: task.maxFileSizeMb });
      if (invalid) {
        setError(`${f.name}: ${invalid}`);
        return;
      }
    }

    const form = new FormData();
    for (const f of files) form.append("files", f);

    setBusy(true);
    setUploadProgress(0);
    try {
      const result = await uploadWithProgress<{ submission: SubmissionState }>(
        `/api/student/tasks/${task.id}/submission/files`,
        form,
        setUploadProgress
      );
      const body = result.body;
      if (!result.ok || !body || !body.success) {
        setError(describeUploadError(body, "The files could not be uploaded."));
        return;
      }
      setState(body.data.submission);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      setUploadProgress(null);
    }
  };

  const removeFile = async (file: SubmissionFileItem) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/tasks/${task.id}/submission/files/${file.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Could not remove the file.");
        return;
      }
      setState(body.data.submission);
    } catch {
      setError("Network error while removing the file.");
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/student/tasks/${task.id}/submission/submit`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "The practical could not be submitted.");
        return;
      }
      const data = body.data as { status: "SUBMITTED" | "LATE"; submittedAt: string };
      setJustSubmitted({
        status: data.status,
        submittedAt: data.submittedAt,
        fileCount: latestFiles.length,
      });
      setState((prev) => ({ ...prev, status: data.status, submittedAt: data.submittedAt }));
      router.refresh();
    } catch {
      setError("Network error while submitting.");
    } finally {
      setBusy(false);
      setConfirmSubmit(false);
    }
  };

  const saveIcon =
    saveState === "saving" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : saveState === "saved" ? (
      <Cloud className="h-3.5 w-3.5" />
    ) : saveState === "error" ? (
      <CloudOff className="h-3.5 w-3.5" />
    ) : (
      <CloudUpload className="h-3.5 w-3.5" />
    );

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Autosave failed — retrying on next edit"
        : savedAt
          ? `Saved automatically at ${formatIST(savedAt)}`
          : "Changes save automatically";

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {justSubmitted && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" /> Submission successful
          </p>
          <p className="mt-1 text-sm text-emerald-800/90">
            {justSubmitted.status === "LATE" ? "Submitted late" : "Submitted on time"} on{" "}
            {formatIST(justSubmitted.submittedAt)} · {justSubmitted.fileCount} file(s). You can view
            it from the Submissions section.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={justSubmitted ? justSubmitted.status : state.status} />
          {state.grade && (
            <Badge variant="teal" size="sm">
              Graded {state.grade.marks} / {state.grade.maximumMarks}
            </Badge>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-surface-500">
          {saveIcon} {saveLabel}
        </span>
      </div>

      {/* Practical notes / autosave (spec §26) */}
      <Textarea
        label="Practical notes"
        placeholder="Summarise your approach, observations or anything the faculty should know. This draft saves automatically."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={!editable}
        rows={5}
        helperText={
          editable
            ? "Autosaves as you type — files are uploaded separately."
            : policy.lockReason ?? "This submission is locked."
        }
      />

      {/* Files (spec §22, §25, §127) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold tracking-tight text-slate-900">
            Submitted files
            {latestVersion > 0 && (
              <span className="ml-2 text-xs font-normal text-surface-400">
                Current version {latestVersion}
              </span>
            )}
          </h4>
          {latestFiles.length > 0 && (
            <span className="text-xs text-surface-400">
              {latestFiles.length} / {task.maxFiles} files
            </span>
          )}
        </div>

        {latestFiles.length === 0 ? (
          <EmptyState
            title="No files uploaded yet"
            description="Upload your practical evidence (source code, screenshots, report) before submitting."
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-surface-100 rounded-lg border border-surface-200 bg-white shadow-card">
            {latestFiles.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-surface-200 bg-surface-50 text-surface-500">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{f.originalName}</p>
                  <p className="text-xs text-surface-400">
                    {formatBytes(f.sizeBytes)} · uploaded {formatIST(f.createdAt)}
                  </p>
                </div>
                <a
                  href={`/api/files/submissions/${f.id}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
                {editable && (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(f)}
                    disabled={busy}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    aria-label={`Remove ${f.originalName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {editable ? (
          <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50/50 p-4">
            <div className="flex items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50">
                <Upload className="h-4 w-4" /> Choose files
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple={task.maxFiles > 1}
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                  disabled={busy}
                />
              </label>
              {busy && uploadProgress !== null && (
                <span className="text-xs text-surface-500">Uploading… {uploadProgress}%</span>
              )}
            </div>
            <p className="mt-2 text-xs text-surface-400">
              Up to {task.maxFiles} file(s), max {task.maxFileSizeMb} MB each.
              {allowed ? ` Accepted: ${allowed.join(", ")}.` : " "}
              Uploading creates a new version; earlier versions are kept.
            </p>
          </div>
        ) : (
          !justSubmitted && (
            <p className="inline-flex items-center gap-1.5 text-sm text-surface-500">
              <Lock className="h-3.5 w-3.5" /> {policy.lockReason ?? "Submission is locked."}
            </p>
          )
        )}
      </div>

      {/* Submit (spec §27) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-100 pt-4">
        <p className="text-xs text-surface-400">
          {task.deadline ? `Deadline: ${formatIST(task.deadline)}` : "No deadline"}
          {task.allowLateSubmission ? " · late submissions accepted (marked late)" : ""}
        </p>
        <Button
          variant="accent"
          onClick={() => setConfirmSubmit(true)}
          disabled={busy || !submittable || latestFiles.length === 0}
          leftIcon={<Send className="h-4 w-4" />}
        >
          {state.status === "SUBMITTED" || state.status === "LATE" ? "Resubmit" : "Submit practical"}
        </Button>
      </div>

      {/* Version history (spec §25) */}
      {state.versions.length > 0 && (
        <details className="rounded-lg border border-surface-200 bg-white p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <History className="h-4 w-4 text-surface-400" /> Version history ({state.versions.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {state.versions.map((v: SubmissionVersionItem) => (
              <li key={v.versionNumber} className="flex items-center justify-between text-sm">
                <span className="text-surface-600">
                  Version {v.versionNumber} · {v.notes ?? "—"}
                </span>
                <span className="text-xs text-surface-400">{formatIST(v.createdAt)}</span>
              </li>
            ))}
          </ul>
          {olderFiles.length > 0 && (
            <div className="mt-3 border-t border-surface-100 pt-3">
              <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
                Previous files
              </p>
              <ul className="mt-2 space-y-1.5">
                {olderFiles.map((f) => (
                  <li key={f.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-surface-500">
                      v{f.versionNumber} · {f.originalName}
                    </span>
                    <a
                      href={`/api/files/submissions/${f.id}`}
                      className="text-xs font-medium text-navy-700 hover:underline"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </details>
      )}

      {state.grade && (
        <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4">
          <p className="text-sm font-semibold text-teal-900">
            Faculty grade: {state.grade.marks} / {state.grade.maximumMarks}{" "}
            <span className="font-normal text-teal-700">({state.grade.percentage}%)</span>
          </p>
          {state.grade.remarks && (
            <p className="mt-1 text-sm italic text-teal-900/90">“{state.grade.remarks}”</p>
          )}
          <p className="mt-1 text-xs text-teal-700/80">Graded {formatIST(state.grade.gradedAt)}</p>
        </div>
      )}

      <ConfirmDialog
        open={confirmSubmit}
        tone="default"
        title="Submit this practical?"
        description={
          <>
            You are about to submit <strong>{task.title}</strong> with {latestFiles.length} file(s).
            {task.allowResubmission
              ? " Resubmission is allowed until the resubmission window closes."
              : " After submission, editing is not allowed."}
          </>
        }
        confirmLabel={busy ? "Submitting…" : "Submit practical"}
        busy={busy}
        onConfirm={submit}
        onCancel={() => setConfirmSubmit(false)}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this file?"
        description={pendingDelete ? `"${pendingDelete.originalName}" will be removed from your submission.` : ""}
        confirmLabel="Remove file"
        busy={busy}
        onConfirm={() => pendingDelete && removeFile(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
