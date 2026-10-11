"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  CircleAlert,
  Loader2,
  Paperclip,
} from "lucide-react";
import type { TaskResourceRow } from "@/lib/server/services/faculty";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatBytes } from "@/lib/utils";
import { formatIST } from "@/lib/date";
import { uploadWithProgress, describeUploadError } from "@/lib/upload-client";

export function TaskResources({
  taskId,
  initialResources,
  locked = false,
}: {
  taskId: string;
  initialResources: TaskResourceRow[];
  locked?: boolean;
}) {
  const [resources, setResources] = useState<TaskResourceRow[]>(initialResources);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaskResourceRow | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle("");
    setFile(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    if (title.trim()) form.append("title", title.trim());

    setBusy(true);
    setProgress(0);
    try {
      const result = await uploadWithProgress<{ resource: TaskResourceRow }>(
        `/api/faculty/tasks/${taskId}/resources`,
        form,
        setProgress
      );
      const body = result.body;
      if (!result.ok || !body || !body.success) {
        setError(describeUploadError(body, "The resource could not be uploaded."));
        return;
      }
      const created = body.data.resource;
      setResources((prev) => [created, ...prev]);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (resource: TaskResourceRow) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/tasks/${taskId}/resources/${resource.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Could not remove the resource.");
        return;
      }
      setResources((prev) => prev.filter((r) => r.id !== resource.id));
    } catch {
      setError("Network error while removing the resource.");
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {resources.length === 0 ? (
        <EmptyState
          title="No reference materials yet"
          description="Upload guidelines, sample files (PDF, DOC/DOCX, PPT/PPTX, images or archives) for students to use while performing this practical."
        />
      ) : (
        <ul className="divide-y divide-surface-100 rounded-lg border border-surface-200 bg-white shadow-card">
          {resources.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-surface-200 bg-surface-50 text-surface-500">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-slate-800">{r.title}</p>
                <p className="truncate text-xs text-surface-400">
                  {r.originalName} · {formatBytes(r.sizeBytes)} · {formatIST(r.createdAt)}
                </p>
              </div>
              <a
                href={`/api/files/resources/${r.id}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </a>
              {!locked && (
                <button
                  type="button"
                  onClick={() => setPendingDelete(r)}
                  disabled={busy}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  aria-label={`Remove ${r.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!locked && (
        <form
          onSubmit={upload}
          className="rounded-lg border border-dashed border-surface-300 bg-surface-50/50 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="Reference title (optional)"
              placeholder="Defaults to the file name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={busy}
            />
            <div className="flex items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50">
                <Paperclip className="h-4 w-4" />
                {file ? "Change file" : "Choose file"}
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={busy}
                />
              </label>
              <Button type="submit" disabled={busy || !file} leftIcon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}>
                Upload
              </Button>
            </div>
          </div>
          {file && (
            <p className="mt-2 text-xs text-surface-500">
              {file.name} · {formatBytes(file.size)}
              {progress !== null && busy ? ` · uploading ${progress}%` : ""}
            </p>
          )}
          <p className="mt-2 text-xs text-surface-400">
            PDF, Office documents, images, archives, CSV and source files up to 25 MB.
          </p>
        </form>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove reference material?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be permanently deleted from this task.`
            : ""
        }
        confirmLabel="Remove"
        busy={busy}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
