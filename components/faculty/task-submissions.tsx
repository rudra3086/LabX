"use client";

import { useMemo, useState } from "react";
import {
  Download,
  FileText,
  CircleAlert,
  CheckCircle2,
  Loader2,
  Pencil,
  Award,
  History,
} from "lucide-react";
import type {
  TaskSubmissionsData,
  TaskSubmissionRow,
  GradingDetail,
  GradeResult,
} from "@/lib/server/services/faculty";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, cn } from "@/lib/utils";
import { formatIST } from "@/lib/date";

type Filter = "all" | "submitted" | "pending" | "late" | "graded" | "ungraded";

const SUBMITTED = new Set(["SUBMITTED", "LATE", "GRADED"]);

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "submitted", label: "Submitted" },
  { id: "pending", label: "Pending" },
  { id: "late", label: "Late" },
  { id: "graded", label: "Graded" },
  { id: "ungraded", label: "Ungraded" },
];

function matches(row: TaskSubmissionRow, filter: Filter): boolean {
  switch (filter) {
    case "submitted":
      return SUBMITTED.has(row.status);
    case "pending":
      return !SUBMITTED.has(row.status);
    case "late":
      return row.status === "LATE";
    case "graded":
      return row.status === "GRADED";
    case "ungraded":
      return row.status === "SUBMITTED" || row.status === "LATE";
    default:
      return true;
  }
}

export function TaskSubmissions({
  taskId,
  data,
}: {
  taskId: string;
  data: TaskSubmissionsData;
}) {
  const [rows, setRows] = useState<TaskSubmissionRow[]>(data.rows);
  const [filter, setFilter] = useState<Filter>("all");
  const [gradingFor, setGradingFor] = useState<TaskSubmissionRow | null>(null);
  const [detail, setDetail] = useState<GradingDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [marks, setMarks] = useState("");
  const [remarks, setRemarks] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<GradeResult | null>(null);

  const filtered = useMemo(() => rows.filter((r) => matches(r, filter)), [rows, filter]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      submitted: 0,
      pending: 0,
      late: 0,
      graded: 0,
      ungraded: 0,
    };
    for (const r of rows) {
      if (SUBMITTED.has(r.status)) c.submitted += 1;
      else c.pending += 1;
      if (r.status === "LATE") c.late += 1;
      if (r.status === "GRADED") c.graded += 1;
      if (r.status === "SUBMITTED" || r.status === "LATE") c.ungraded += 1;
    }
    return c;
  }, [rows]);

  const openGrading = async (row: TaskSubmissionRow) => {
    setGradingFor(row);
    setDetail(null);
    setDetailError(null);
    setConfirmation(null);
    setFormError(null);
    setMarks(row.marks !== null ? String(row.marks) : "");
    setRemarks("");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/faculty/tasks/${taskId}/submissions/${row.studentId}`);
      const body = await res.json();
      if (!res.ok || !body.success) {
        setDetailError(body.error?.message ?? "Could not load this submission.");
        return;
      }
      const d = body.data as GradingDetail;
      setDetail(d);
      setRemarks(d.submission.grade?.remarks ?? "");
      if (d.submission.grade) setMarks(String(d.submission.grade.marks));
    } catch {
      setDetailError("Network error while loading the submission.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeGrading = () => {
    setGradingFor(null);
    setDetail(null);
    setConfirmation(null);
    setFormError(null);
  };

  const save = async () => {
    if (!gradingFor) return;
    setFormError(null);
    const numeric = Number(marks);
    if (marks.trim() === "" || Number.isNaN(numeric)) {
      setFormError("Enter the marks obtained.");
      return;
    }
    if (numeric < 0 || numeric > data.task.maximumMarks) {
      setFormError(`Marks must be between 0 and ${data.task.maximumMarks}.`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/faculty/tasks/${taskId}/submissions/${gradingFor.studentId}/grade`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marks: numeric, remarks: remarks.trim() ? remarks : null }),
        }
      );
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFormError(body.error?.message ?? "Could not save the grade.");
        return;
      }
      const grade = body.data.grade as GradeResult;
      setConfirmation(grade);
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === gradingFor.studentId
            ? {
                ...r,
                status: "GRADED",
                marks: grade.marks,
                maximumMarks: grade.maximumMarks,
                isFinalized: grade.isFinalized,
                gradedAt: grade.gradedAt,
              }
            : r
        )
      );
    } catch {
      setFormError("Network error while saving the grade.");
    } finally {
      setSaving(false);
    }
  };

  const isEdit = gradingFor?.marks !== null && gradingFor?.marks !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors",
              filter === f.id
                ? "border-navy-700 bg-navy-800 text-white"
                : "border-surface-300 bg-white text-surface-600 hover:bg-surface-50"
            )}
          >
            {f.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[12px] tabular-nums",
                filter === f.id ? "bg-white/20 text-white" : "bg-surface-100 text-surface-500"
              )}
            >
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing to show"
          description={`No students match the "${filter}" filter for this practical.`}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Files</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const gradable = SUBMITTED.has(row.status);
              return (
                <TableRow key={row.studentId}>
                  <TableCell>
                    <p className="font-medium text-slate-900">{row.name}</p>
                    <p className="font-mono text-xs text-surface-400">{row.rollNumber}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-sm text-surface-500">
                    {row.submittedAt ? formatIST(row.submittedAt) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-surface-600">
                    {row.fileCount}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.marks !== null ? (
                      <span className="font-medium text-slate-900">
                        {row.marks}
                        <span className="text-surface-400"> / {row.maximumMarks}</span>
                      </span>
                    ) : (
                      <span className="text-surface-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {gradable ? (
                      <Button
                        variant={row.status === "GRADED" ? "outline" : "primary"}
                        size="sm"
                        onClick={() => openGrading(row)}
                        leftIcon={
                          row.status === "GRADED" ? (
                            <Pencil className="h-3.5 w-3.5" />
                          ) : (
                            <Award className="h-3.5 w-3.5" />
                          )
                        }
                      >
                        {row.status === "GRADED" ? "Edit grade" : "Grade"}
                      </Button>
                    ) : (
                      <span className="text-xs text-surface-400">Awaiting submission</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Modal
        isOpen={Boolean(gradingFor)}
        onClose={closeGrading}
        title={confirmation ? "Submission graded" : isEdit ? "Edit grade" : "Grade submission"}
        description={gradingFor ? `${gradingFor.name} · ${gradingFor.rollNumber}` : undefined}
        maxWidth="xl"
      >
        {confirmation ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="text-sm text-emerald-900">
                <p className="font-semibold">Submission graded</p>
                <p className="mt-1">
                  {confirmation.taskTitle} — {confirmation.marks} / {confirmation.maximumMarks}
                </p>
                {confirmation.remarks && (
                  <p className="mt-1 italic">“{confirmation.remarks}”</p>
                )}
                <p className="mt-1 text-xs text-emerald-700/80">
                  The student has been notified.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={closeGrading}>
                Done
              </Button>
            </div>
          </div>
        ) : detailLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-surface-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading submission…
          </div>
        ) : detailError ? (
          <p
            role="alert"
            className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
          >
            <CircleAlert className="h-3.5 w-3.5" /> {detailError}
          </p>
        ) : detail ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Info label="Task" value={detail.task.title} />
              <Info label="Status" value={detail.submission.status} />
              <Info
                label="Submitted"
                value={detail.submission.submittedAt ? formatIST(detail.submission.submittedAt) : "—"}
              />
              <Info label="Deadline" value={detail.task.deadline ? formatIST(detail.task.deadline) : "No deadline"} />
              <Info label="Maximum" value={String(detail.task.maximumMarks)} />
              <Info label="Files" value={String(detail.submission.files.filter((f) => f.isLatest).length)} />
            </div>

            {detail.submission.notes && (
              <div className="rounded-lg border border-surface-200 bg-surface-50/60 p-3">
                <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
                  Student notes
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-surface-600">
                  {detail.submission.notes}
                </p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-surface-400">
                Uploaded files
              </p>
              {detail.submission.files.length === 0 ? (
                <p className="text-sm text-surface-400">No files were uploaded.</p>
              ) : (
                <ul className="divide-y divide-surface-100 rounded-lg border border-surface-200">
                  {detail.submission.files
                    .filter((f) => f.isLatest)
                    .map((f) => (
                      <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                        <FileText className="h-4 w-4 shrink-0 text-surface-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {f.originalName}
                          </p>
                          <p className="text-xs text-surface-400">{formatBytes(f.sizeBytes)}</p>
                        </div>
                        <a
                          href={`/api/files/submissions/${f.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {detail.submission.versions.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-surface-400">
                  <History className="h-3.5 w-3.5" /> Version history
                </p>
                <ul className="space-y-1 text-sm">
                  {detail.submission.versions.map((v) => (
                    <li key={v.versionNumber} className="flex justify-between text-surface-500">
                      <span>
                        v{v.versionNumber} · {v.notes ?? "—"}
                      </span>
                      <span className="text-xs text-surface-400">{formatIST(v.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3 border-t border-surface-100 pt-4">
              <Input
                label={`Marks (out of ${detail.task.maximumMarks})`}
                type="number"
                inputMode="decimal"
                min={0}
                max={detail.task.maximumMarks}
                step="0.5"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                error={formError ?? undefined}
              />
              <Textarea
                label="Remarks"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Feedback for the student (e.g. implementation correctness, documentation)."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeGrading} disabled={saving}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={save}
                  isLoading={saving}
                  leftIcon={<Award className="h-4 w-4" />}
                >
                  {isEdit ? "Update grade" : "Save grade"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-surface-400">{label}</p>
      <p className="mt-0.5 truncate font-medium text-slate-700">{value}</p>
    </div>
  );
}
