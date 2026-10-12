"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Pencil, CircleAlert } from "lucide-react";
import type { SubjectListItem } from "@/lib/server/services/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";

export function SubjectsList({ items }: { items: SubjectListItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (s) =>
        (status === "ALL" || s.status === status) &&
        (!q ||
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q))
    );
  }, [items, search, status]);

  const toggle = async (subject: SubjectListItem) => {
    const next = subject.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setBusyId(subject.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/subjects/${subject.id}`, {
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
      setError("Network error while updating the subject.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search by code, name or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="h-4 w-4" />}
            aria-label="Search subjects"
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
          title={items.length === 0 ? "No subjects yet" : "No matching subjects"}
          description={
            items.length === 0
              ? "Create the first subject, then faculty can build practical sessions on top of it."
              : "Try a different search term or status filter."
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Faculty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm text-navy-700">{s.code}</TableCell>
                <TableCell className="font-medium text-slate-900">{s.name}</TableCell>
                <TableCell className="tabular-nums text-surface-500">{s.semester}</TableCell>
                <TableCell className="text-surface-600">{s.department}</TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">{s.sessionCount}</TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">{s.facultyCount}</TableCell>
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
                      onClick={() => void toggle(s)}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id ? "Working…" : s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </Button>
                    <Link
                      href={`/admin/subjects/${s.id}/edit`}
                      aria-label={`Edit ${s.name}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
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
    </div>
  );
}