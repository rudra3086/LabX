import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultyTaskOverview } from "@/lib/server/services/faculty";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIST } from "@/lib/date";

export const dynamic = "force-dynamic";

const TASK_STATUS: Record<
  string,
  { label: string; variant: "slate" | "emerald" | "navy" | "amber" }
> = {
  DRAFT: { label: "Draft", variant: "slate" },
  PUBLISHED: { label: "Published", variant: "emerald" },
  CLOSED: { label: "Closed", variant: "amber" },
  ARCHIVED: { label: "Archived", variant: "slate" },
};

export default async function FacultyTasksPage() {
  const user = await getCurrentUser();
  const tasks = await getFacultyTaskOverview(user!.faculty!.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Every practical task across your sessions. Open a task to manage it or review its status."
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Tasks are created inside a session. Open a session and add its first practical task."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Subject / Session</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Marks</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => {
              const badge = TASK_STATUS[t.status] ?? TASK_STATUS.DRAFT;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <Link
                      href={`/faculty/tasks/${t.id}`}
                      className="font-medium text-slate-900 hover:text-navy-700"
                    >
                      {t.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-surface-600">
                    <span className="font-mono text-sm text-navy-700">
                      {t.subjectCode}
                    </span>
                    <span className="text-surface-400"> · </span>
                    {t.sessionName}
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
                    <span className="text-surface-400"> / {t.enrolledCount}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/faculty/tasks/${t.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
                    >
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}