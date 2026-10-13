"use client";

import { useMemo, useState } from "react";
import { Search, UsersRound, X, CircleAlert, Loader2 } from "lucide-react";
import type { SessionStudentRow } from "@/lib/server/services/faculty";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export function SessionRoster({
  sessionId,
  initialStudents,
  initialCandidates,
  locked = false,
}: {
  sessionId: string;
  initialStudents: SessionStudentRow[];
  initialCandidates: SessionStudentRow[];
  locked?: boolean;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<SessionStudentRow | null>(null);

  const reload = async () => {
    const [enrolledRes, candidatesRes] = await Promise.all([
      fetch(`/api/faculty/sessions/${sessionId}/students`),
      fetch(`/api/faculty/sessions/${sessionId}/students/candidates`),
    ]);
    const enrolledBody = await enrolledRes.json();
    const candidatesBody = await candidatesRes.json();
    if (enrolledBody.success) setStudents(enrolledBody.data.students);
    if (candidatesBody.success) setCandidates(candidatesBody.data.candidates);
  };

  const batches = useMemo(
    () =>
      Array.from(new Set(candidates.map((candidate) => candidate.batch).filter(Boolean) as string[])).sort(),
    [candidates]
  );

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.rollNumber.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [candidates, search]);

  const toggleBatch = (batch: string) => {
    setSelectedBatches((prev) => {
      const next = new Set(prev);
      if (next.has(batch)) next.delete(batch);
      else next.add(batch);
      return next;
    });
  };

  const addSelected = async () => {
    if (selectedBatches.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/sessions/${sessionId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchNames: Array.from(selectedBatches) }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Could not add students.");
        return;
      }
      setSelectedBatches(new Set());
      await reload();
    } catch {
      setError("Network error while adding students.");
    } finally {
      setBusy(false);
    }
  };

  const removeStudent = async (student: SessionStudentRow) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/faculty/sessions/${sessionId}/students`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: [student.id] }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Could not remove the student.");
        return;
      }
      await reload();
    } catch {
      setError("Network error while removing the student.");
    } finally {
      setBusy(false);
      setPendingRemove(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">
            Enrolled students
          </h3>
          <span className="text-xs text-surface-400">{students.length} enrolled</span>
        </div>
        {students.length === 0 ? (
          <EmptyState
            title="No students enrolled"
            description="Assign complete batches to this session. Every active student in a selected batch will receive this session's tasks."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll no</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm text-navy-700">
                    {s.rollNumber}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{s.name}</TableCell>
                  <TableCell className="text-surface-500">{s.email}</TableCell>
                  <TableCell className="text-surface-600">{s.batch ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {locked ? (
                      <span className="text-xs text-surface-400">Locked</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPendingRemove(s)}
                        disabled={busy}
                        leftIcon={<X className="h-3.5 w-3.5" />}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {!locked && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold tracking-tight text-slate-900">
              Add students
            </h3>
            <Button
              variant="accent"
              size="sm"
              onClick={addSelected}
              disabled={busy || selectedBatches.size === 0}
              leftIcon={busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UsersRound className="h-3.5 w-3.5" />}
            >
              Assign selected batch{selectedBatches.size === 1 ? "" : "es"}{selectedBatches.size > 0 ? ` (${selectedBatches.size})` : ""}
            </Button>
          </div>

          <div className="w-full max-w-sm">
            <Input
              placeholder="Search available batches or students…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftElement={<Search className="h-4 w-4" />}
              aria-label="Search batches"
            />
          </div>

          {batches.length === 0 ? (
            <p className="rounded-lg border border-dashed border-surface-200 px-4 py-6 text-center text-sm text-surface-400">
              {candidates.length === 0
                ? "All active students with a batch are already enrolled in this session."
                : "No batches are available."}
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-surface-200 bg-white shadow-card">
              <ul className="divide-y divide-surface-100">
                {batches
                  .filter(
                      (batch) =>
                        batch.toLowerCase().includes(search.trim().toLowerCase()) ||
                        filteredCandidates.some((candidate) => candidate.batch === batch)
                  )
                  .map((batch) => {
                      const checked = selectedBatches.has(batch);
                      const count = candidates.filter((candidate) => candidate.batch === batch).length;
                      return (
                        <li key={batch}>
                          <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-surface-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBatch(batch)}
                              className="h-4 w-4 rounded border-surface-300 text-navy-700 focus:ring-navy-600"
                            />
                            <span className="font-medium text-slate-800">Batch {batch}</span>
                            <Badge variant="slate" size="sm" className="ml-auto">
                              {count} student{count === 1 ? "" : "s"}
                            </Badge>
                          </label>
                        </li>
                      );
                  })}
              </ul>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        title="Remove student from session?"
        description={
          pendingRemove
            ? `${pendingRemove.name} (${pendingRemove.rollNumber}) will be removed from this session. Their account is unaffected.`
            : ""
        }
        confirmLabel="Remove"
        busy={busy}
        onConfirm={() => pendingRemove && removeStudent(pendingRemove)}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  );
}