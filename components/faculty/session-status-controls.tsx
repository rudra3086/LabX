"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Play, CheckCircle2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type SessionStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export function SessionStatusControls({
  sessionId,
  status,
}: {
  sessionId: string;
  status: SessionStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const transition = async (next: SessionStatus) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/sessions/${sessionId}`, {
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
      setError("Network error while updating the session.");
    } finally {
      setBusy(false);
      setConfirmArchive(false);
    }
  };

  if (status === "ARCHIVED") {
    return <p className="text-sm text-surface-400">This session is archived.</p>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === "DRAFT" && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play className="h-3.5 w-3.5" />}
            onClick={() => transition("ACTIVE")}
            disabled={busy}
          >
            Activate session
          </Button>
        )}
        {status === "ACTIVE" && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
            onClick={() => transition("COMPLETED")}
            disabled={busy}
          >
            Complete session
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
        title="Archive this session?"
        description="The session and its tasks become read-only. You can still view past submissions and grades."
        confirmLabel="Archive session"
        busy={busy}
        onConfirm={() => transition("ARCHIVED")}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}