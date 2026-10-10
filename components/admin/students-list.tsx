"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, CircleAlert } from "lucide-react";
import type { StudentListItem } from "@/lib/server/services/admin";
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

export function StudentsList({ items }: { items: StudentListItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<StudentListItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (s) =>
        (status === "ALL" || s.status === status) &&
        (!q ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q) ||
          s.rollNumber.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q))
    );
  }, [items, search, status]);

  const setStatusFor = async (student: StudentListItem, next: "ACTIVE" | "INACTIVE") => {
    if (next === "INACTIVE") {
      setConfirming(student);
      return;
    }
    await patchStatus(student, next);
  };

  const patchStatus = async (student: StudentListItem, next: "ACTIVE" | "INACTIVE") => {
    setBusyId(student.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
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
      setError("Network error while updating the student.");
    } finally {
      setBusyId(null);
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by name, email, ID, roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="h-4 w-4" />}
            aria-label="Search students"
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
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? "No students yet" : "No matching students"}
          description={
            items.length === 0
              ? "Add students so faculty can enrol them in practical sessions."
              : "Try a different search term or status filter."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll no</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-[13px] text-navy-700">{s.rollNumber}</TableCell>
                <TableCell className="font-mono text-[13px] text-surface-500">{s.studentId}</TableCell>
                <TableCell className="font-medium text-slate-900">{s.name}</TableCell>
                <TableCell className="text-surface-600">{s.email}</TableCell>
                <TableCell className="tabular-nums text-surface-600">{s.semester}</TableCell>
                <TableCell className="text-surface-600">{s.department}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "ACTIVE" ? "emerald" : "slate"} size="sm">
                    {s.status === "ACTIVE" ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void setStatusFor(s, s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id ? "Working…" : s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                    <Link
                      href={`/admin/students/${s.id}/edit`}
                      aria-label={`Edit ${s.name}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirming !== null}
        title="Deactivate student?"
        description={`${confirming?.name ?? ""} will be signed out and blocked from signing in. Existing submissions and grades are preserved.`}
        confirmLabel="Deactivate"
        busy={busyId !== null}
        onCancel={() => setConfirming(null)}
        onConfirm={() => confirming && void patchStatus(confirming, "INACTIVE")}
      />
    </div>
  );
}