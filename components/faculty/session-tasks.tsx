"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pencil,
  ArrowRight,
  Send,
  Lock,
  RotateCcw,
  Archive,
  CircleAlert,
  CalendarClock,
} from "lucide-react";
import type { SessionTaskRow } from "@/lib/server/services/faculty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIST } from "@/lib/date";

const TASK_STATUS: Record<
  SessionTaskRow["status"],
  { label: string; variant: "slate" | "emerald" | "navy" | "amber" }
> = {
  DRAFT: { label: "Draft", variant: "slate" },
  PUBLISHED: { label: "Published", variant: "emerald" },
  CLOSED: { label: "Closed", variant: "amber" },
  ARCHIVED: { label: "Archived", variant: "slate" },
};

export function SessionTasks({
  tasks,
  sessionStatus,
  enrolledCount,
}: {
  tasks: SessionTaskRow[];
  sessionStatus: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  enrolledCount: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<SessionTaskRow | null>(null);

  const changeStatus = async (task: SessionTaskRow, status: string) => {
    setBusyId(task.id);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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
      setBusyId(null);
      setArchiveTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}
      {sessionStatus !== "ACTIVE" && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This session is {sessionStatus.toLowerCase()}. Tasks can be prepared as
          drafts, but they can only be published once the session is active.
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-surface-200 px-4 py-8 text-center text-sm text-surface-400">
          No tasks yet. Add the first practical task for this session.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
              <TableHead className="text-right">Graded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link
                    href={`/faculty/tasks/${t.id}`}
                    className="font-medium text-slate-900 hover:text-navy-700"
                  >
                    {t.title}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-surface-500">
                  {t.deadline ? (
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5 text-surface-400" />
                      {formatIST(t.deadline)}
                    </span>
                  ) : (
                    "No deadline"
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">
                  {t.maximumMarks}
                </TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">
                  {t.submittedCount}
                  <span className="text-surface-400"> / {enrolledCount}</span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">
                  {t.gradedCount}
                </TableCell>
                <TableCell>
                  <Badge variant={TASK_STATUS[t.status].variant} size="sm">
                    {TASK_STATUS[t.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {t.status === "DRAFT" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeStatus(t, "PUBLISHED")}
                        disabled={busyId === t.id || sessionStatus !== "ACTIVE"}
                        leftIcon={<Send className="h-3.5 w-3.5" />}
                        title={
                          sessionStatus !== "ACTIVE"
                            ? "Activate the session to publish tasks"
                            : undefined
                        }
                      >
                        Publish
                      </Button>
                    )}
                    {t.status === "PUBLISHED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeStatus(t, "CLOSED")}
                        disabled={busyId === t.id}
                        leftIcon={<Lock className="h-3.5 w-3.5" />}
                      >
                        Close
                      </Button>
                    )}
                    {t.status === "CLOSED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeStatus(t, "PUBLISHED")}
                        disabled={busyId === t.id || sessionStatus !== "ACTIVE"}
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                      >
                        Reopen
                      </Button>
                    )}
                    {t.status !== "ARCHIVED" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setArchiveTarget(t)}
                        disabled={busyId === t.id}
                        leftIcon={<Archive className="h-3.5 w-3.5" />}
                      >
                        Archive
                      </Button>
                    )}
                    <Link
                      href={`/faculty/tasks/${t.id}/edit`}
                      aria-label={`Edit ${t.title}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <Link
                      href={`/faculty/tasks/${t.id}`}
                      aria-label={`Open ${t.title}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archive this task?"
        description={
          archiveTarget
            ? `"${archiveTarget.title}" will be hidden from students. Submissions already made are kept.`
            : ""
        }
        confirmLabel="Archive task"
        busy={busyId === archiveTarget?.id}
        onConfirm={() => archiveTarget && changeStatus(archiveTarget, "ARCHIVED")}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}