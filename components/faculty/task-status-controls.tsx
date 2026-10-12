"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Send, Lock, RotateCcw, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type TaskStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";

export function TaskStatusControls({
  taskId,
  status,
  sessionStatus,
}: {
  taskId: string;
  status: TaskStatus;
  sessionStatus: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const transition = async (next: TaskStatus) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Update failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error while updating the task.");
    } finally {
      setBusy(false);
      setConfirmArchive(false);
    }
  };

  if (status === "ARCHIVED") {
    return <p className="text-sm text-surface-400">This task is archived.</p>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "DRAFT" && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="h-3.5 w-3.5" />}
            onClick={() => transition("PUBLISHED")}
            disabled={busy || sessionStatus !== "ACTIVE"}
            title={
              sessionStatus !== "ACTIVE"
                ? "Activate the session before publishing"
                : undefined
            }
          >
            Publish task
          </Button>
        )}
        {status === "PUBLISHED" && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Lock className="h-3.5 w-3.5" />}
            onClick={() => transition("CLOSED")}
            disabled={busy}
          >
            Close submissions
          </Button>
        )}
        {status === "CLOSED" && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => transition("PUBLISHED")}
            disabled={busy || sessionStatus !== "ACTIVE"}
          >
            Reopen task
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Archive className="h-3.5 w-3.5" />}
          onClick={() => setConfirmArchive(true)}
          disabled={busy}
        >
          Archive
        </Button>
      </div>
      {sessionStatus !== "ACTIVE" && status !== "PUBLISHED" && status !== "CLOSED" && (
        <p className="text-xs text-surface-400">
          The session is {sessionStatus.toLowerCase()}; publish is unavailable.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      <ConfirmDialog
        open={confirmArchive}
        title="Archive this task?"
        description="The task will be hidden from students. Existing submissions are kept."
        confirmLabel="Archive task"
        busy={busy}
        onConfirm={() => transition("ARCHIVED")}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}