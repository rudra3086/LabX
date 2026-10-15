"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, Trash2, CircleAlert, KeyRound, Power, Loader2 } from "lucide-react";
import type { FacultyListItem } from "@/lib/server/services/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { EmptyState } from "@/components/ui/empty-state";
import { ResetPasswordDialog } from "@/components/admin/reset-password-dialog";

export function FacultyList({ items }: { items: FacultyListItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<FacultyListItem | null>(null);
  const [deleting, setDeleting] = useState<FacultyListItem | null>(null);
  const [resetting, setResetting] = useState<FacultyListItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (f) =>
        (status === "ALL" || f.status === status) &&
        (!q ||
          f.name.toLowerCase().includes(q) ||
          f.email.toLowerCase().includes(q) ||
          f.employeeId.toLowerCase().includes(q) ||
          f.department.toLowerCase().includes(q) ||
          f.subjects.some((s) => s.code.toLowerCase().includes(q)))
    );
  }, [items, search, status]);

  const setStatusFor = async (faculty: FacultyListItem, next: "ACTIVE" | "INACTIVE") => {
    if (next === "INACTIVE") {
      setConfirming(faculty);
      return;
    }
    await patchStatus(faculty, next);
  };

  const patchStatus = async (faculty: FacultyListItem, next: "ACTIVE" | "INACTIVE") => {
    setBusyId(faculty.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faculty/${faculty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Update failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error while updating the faculty member.");
    } finally {
      setBusyId(null);
      setConfirming(null);
    }
  };

  const deleteFaculty = async (faculty: FacultyListItem) => {
    setBusyId(faculty.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/faculty/${faculty.id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.error?.message ?? "Delete failed.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error while deleting the faculty member.");
    } finally {
      setBusyId(null);
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by name, email, ID, department or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="h-4 w-4" />}
            aria-label="Search faculty"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            placeholder="All statuses"
            options={[
              { value: "ALL", label: "All statuses" },
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "No faculty yet" : "No matching faculty"}
          description={
            items.length === 0
              ? "Add faculty so they can be assigned subjects and run practical sessions."
              : "Try a different search term or status filter."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Employee ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium text-slate-900">
                  {f.name}
                  {f.designation && (
                    <span className="block text-xs font-normal text-surface-400">{f.designation}</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm text-surface-500">{f.employeeId}</TableCell>
                <TableCell className="text-surface-600">{f.email}</TableCell>
                <TableCell className="text-surface-600">{f.department}</TableCell>
                <TableCell>
                  {f.subjects.length === 0 ? (
                    <span className="text-xs text-surface-400">Not assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {f.subjects.slice(0, 3).map((s) => (
                        <Badge key={s.subjectId} variant="navy" size="sm">
                          {s.code}
                        </Badge>
                      ))}
                      {f.subjects.length > 3 && (
                        <span className="text-xs text-surface-400">+{f.subjects.length - 3}</span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={f.status === "ACTIVE" ? "emerald" : "slate"} size="sm">
                    {f.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => void setStatusFor(f, f.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                      disabled={busyId === f.id}
                      aria-label={`${f.status === "ACTIVE" ? "Deactivate" : "Activate"} ${f.name}`}
                      title={f.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    >
                      {busyId === f.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                    <Link
                      href={`/admin/faculty/${f.id}/edit`}
                      aria-label={`Edit ${f.name}`}
                      title="Edit"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setResetting(f)}
                      disabled={busyId === f.id}
                      aria-label={`Reset password for ${f.name}`}
                      title="Reset password"
                    >
                      <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setDeleting(f)}
                      disabled={busyId === f.id}
                      aria-label={`Delete ${f.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title="Deactivate faculty member?"
        description={`${confirming?.name ?? ""} will be signed out and blocked from signing in. Existing sessions, tasks and grades are preserved.`}
        confirmLabel="Deactivate"
        busy={busyId !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && void patchStatus(confirming, "INACTIVE")}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Permanently delete faculty member?"
        description={`${deleting?.name ?? ""} and their account will be permanently removed. Their sessions, tasks, uploaded files and grades will also be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        busy={busyId !== null}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && void deleteFaculty(deleting)}
      />
      <ResetPasswordDialog
        name={resetting?.name ?? ""}
        endpoint={resetting ? `/api/admin/faculty/${resetting.id}/password` : ""}
        open={resetting !== null}
        onClose={() => setResetting(null)}
      />
    </div>
  );
}