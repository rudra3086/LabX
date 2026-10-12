import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil,
  CalendarClock,
  ClipboardList,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultyTaskDetail } from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { TaskStatusControls } from "@/components/faculty/task-status-controls";
import { TaskResources } from "@/components/faculty/task-resources";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  let task;
  try {
    task = await getFacultyTaskDetail(user!.faculty!.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }

  const badge = TASK_STATUS[task.status] ?? TASK_STATUS.DRAFT;
  const graded = task.counts.GRADED ?? 0;
  const submitted = (task.counts.SUBMITTED ?? 0) + (task.counts.LATE ?? 0) + graded;
  const pending = Math.max(task.enrolledStudents - submitted, 0);
  const draftSaves = task.counts.DRAFT ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${task.subjectCode} — ${task.sessionName}`}
        title={task.title}
        description={
          <>
            <Badge variant={badge.variant} size="sm" className="mr-2">
              {badge.label}
            </Badge>
            {task.maximumMarks} marks
            {task.deadline ? ` · due ${formatIST(task.deadline)}` : " · no deadline"}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/faculty/tasks/${task.id}/submissions`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
            >
              <ClipboardCheck className="h-4 w-4" /> Submissions
            </Link>
            <Link
              href={`/faculty/tasks/${task.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <TaskStatusControls
              taskId={task.id}
              status={task.status}
              sessionStatus={task.sessionStatus}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="Submitted"
          value={submitted}
          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          subtitle={`of ${task.enrolledStudents} enrolled`}
        />
        <StatCard
          title="Pending"
          value={pending}
          icon={<Clock className="h-3.5 w-3.5" />}
          subtitle="No submission yet"
        />
        <StatCard
          title="Late"
          value={task.counts.LATE ?? 0}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          subtitle="Submitted after deadline"
        />
        <StatCard
          title="Graded"
          value={graded}
          icon={<Users className="h-3.5 w-3.5" />}
          subtitle={`${draftSaves} in progress`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-surface-600">
              {task.description || "No description provided."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-navy-700" /> Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed text-surface-600">
              {task.instructions || "No instructions provided."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission requirements</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Deadline
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {task.deadline ? formatIST(task.deadline) : "No deadline"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Late submissions
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {task.allowLateSubmission ? "Allowed (marked late)" : "Not allowed"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              File types
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {task.requiredFileTypes || "Any accepted type"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Submission format
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {task.submissionFormat || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Naming convention
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {task.fileNamingConvention || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
              Created
            </p>
            <p className="mt-1 text-sm text-slate-700 flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-surface-400" />
              {formatIST(task.createdAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Reference materials</CardTitle>
          <span className="text-xs text-surface-400">{task.resources.length} file(s)</span>
        </CardHeader>
        <CardContent>
          <TaskResources
            taskId={task.id}
            initialResources={task.resources}
            locked={task.status === "ARCHIVED" || task.sessionStatus === "ARCHIVED"}
          />
        </CardContent>
      </Card>
    </div>
  );
}