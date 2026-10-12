"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Pencil, ArrowRight, Users, FileText } from "lucide-react";
import type { SessionListItem } from "@/lib/server/services/faculty";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button-link";
import { formatIST } from "@/lib/date";

const SESSION_STATUS: Record<
  SessionListItem["status"],
  { label: string; variant: "slate" | "emerald" | "navy" | "amber" }
> = {
  DRAFT: { label: "Draft", variant: "slate" },
  ACTIVE: { label: "Active", variant: "emerald" },
  COMPLETED: { label: "Completed", variant: "navy" },
  ARCHIVED: { label: "Archived", variant: "slate" },
};

export function SessionsList({
  sessions,
  subjects,
  initialSubjectId,
}: {
  sessions: SessionListItem[];
  subjects: { subjectId: string; code: string; name: string }[];
  initialSubjectId?: string;
}) {
  const [search, setSearch] = useState("");
  const [subjectId, setSubjectId] = useState(initialSubjectId ?? "ALL");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (subjectId !== "ALL" && s.subjectId !== subjectId) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.subjectCode.toLowerCase().includes(q) ||
        s.subjectName.toLowerCase().includes(q) ||
        (s.batch ?? "").toLowerCase().includes(q)
      );
    });
  }, [sessions, search, subjectId]);

  const subjectOptions = [
    { value: "ALL", label: "All subjects" },
    ...subjects.map((s) => ({ value: s.subjectId, label: `${s.code} — ${s.name}` })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search sessions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftElement={<Search className="h-4 w-4" />}
            aria-label="Search sessions"
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            aria-label="Filter by subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            options={subjectOptions}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={sessions.length === 0 ? "No sessions yet" : "No matching sessions"}
          description={
            sessions.length === 0
              ? "Create a practical session for one of your subjects to start adding students and tasks."
              : "Try a different search term or subject filter."
          }
          action={
            sessions.length === 0 ? (
              <ButtonLink href="/faculty/sessions/create">Create session</ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="text-right">Students</TableHead>
              <TableHead className="text-right">Tasks</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link
                    href={`/faculty/sessions/${s.id}`}
                    className="font-medium text-slate-900 hover:text-navy-700"
                  >
                    {s.name}
                  </Link>
                  <p className="text-xs text-surface-400">Semester {s.semester}</p>
                </TableCell>
                <TableCell className="text-surface-600">
                  <span className="font-mono text-sm text-navy-700">{s.subjectCode}</span>
                </TableCell>
                <TableCell className="text-surface-600">{s.batch ?? "—"}</TableCell>
                <TableCell className="text-sm text-surface-500">
                  {s.startDate ? formatIST(s.startDate, false) : "—"}
                  {s.endDate ? ` → ${formatIST(s.endDate, false)}` : ""}
                </TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-surface-400" /> {s.studentCount}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-surface-600">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-surface-400" /> {s.taskCount}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={SESSION_STATUS[s.status].variant} size="sm">
                    {SESSION_STATUS[s.status].label}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/faculty/sessions/${s.id}/tasks`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
                    >
                      Tasks <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/faculty/sessions/${s.id}/edit`}
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
      {filtered.length > 0 && (
        <p className="px-1 text-xs text-surface-400">
          Showing {filtered.length} of {sessions.length} session{sessions.length === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}