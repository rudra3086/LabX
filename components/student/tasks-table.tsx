import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { StudentSubmissionListItem } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { formatIST } from "@/lib/date";

export function TasksTable({
  tasks,
  showSubject = true,
}: {
  tasks: StudentSubmissionListItem[];
  showSubject?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Practical</TableHead>
          {showSubject && <TableHead>Subject / Session</TableHead>}
          <TableHead>Deadline</TableHead>
          <TableHead className="text-right">Marks</TableHead>
          <TableHead className="text-right">Files</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((t) => (
          <TableRow key={t.taskId}>
            <TableCell>
              <Link
                href={`/student/tasks/${t.taskId}`}
                className="font-medium text-slate-900 hover:text-navy-700"
              >
                {t.taskTitle}
              </Link>
            </TableCell>
            {showSubject && (
              <TableCell className="text-surface-600">
                <span className="font-mono text-[13px] text-navy-700">{t.subjectCode}</span>
                <span className="text-surface-400"> · </span>
                {t.sessionName}
              </TableCell>
            )}
            <TableCell className="text-[13px] text-surface-500">
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
              {t.marks !== null ? (
                <span className="font-medium text-slate-900">
                  {t.marks}
                  <span className="text-surface-400"> / {t.maximumMarks}</span>
                </span>
              ) : (
                t.maximumMarks
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums text-surface-600">{t.fileCount}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <StatusBadge status={t.viewStatus} />
                {t.status === "DRAFT" && (
                  <Badge variant="slate" size="sm">
                    Draft
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/student/tasks/${t.taskId}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-slate-900"
              >
                Open <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
