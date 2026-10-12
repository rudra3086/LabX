import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Users, FileText, CalendarClock } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultySessionDetail } from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { SessionTabs } from "@/components/faculty/session-tabs";
import { SessionStatusControls } from "@/components/faculty/session-status-controls";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatIST } from "@/lib/date";

export const dynamic = "force-dynamic";

const SESSION_STATUS: Record<
  string,
  { label: string; variant: "slate" | "emerald" | "navy" | "amber" }
> = {
  DRAFT: { label: "Draft", variant: "slate" },
  ACTIVE: { label: "Active", variant: "emerald" },
  COMPLETED: { label: "Completed", variant: "navy" },
  ARCHIVED: { label: "Archived", variant: "slate" },
};

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  let session;
  try {
    session = await getFacultySessionDetail(user!.faculty!.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }

  const badge = SESSION_STATUS[session.status] ?? SESSION_STATUS.DRAFT;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${session.subject.code} — ${session.subject.name}`}
        title={session.name}
        description={
          <>
            <Badge variant={badge.variant} size="sm" className="mr-2">
              {badge.label}
            </Badge>
            Semester {session.semester}
            {session.batch ? ` · Batch ${session.batch}` : ""}
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/faculty/sessions/${session.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <SessionStatusControls sessionId={session.id} status={session.status} />
          </div>
        }
      />

      <SessionTabs sessionId={session.id} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Enrolled students"
          value={session.studentCount}
          icon={<Users className="h-3.5 w-3.5" />}
          subtitle="Active roster"
        />
        <StatCard
          title="Tasks"
          value={session.taskCount}
          icon={<FileText className="h-3.5 w-3.5" />}
          subtitle="All statuses"
        />
        <StatCard
          title="Start date"
          value={session.startDate ? formatIST(session.startDate, false) : "—"}
          icon={<CalendarClock className="h-3.5 w-3.5" />}
        />
        <StatCard
          title="End date"
          value={session.endDate ? formatIST(session.endDate, false) : "—"}
          icon={<CalendarClock className="h-3.5 w-3.5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-surface-600">
            {session.description || "No description provided for this session."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/faculty/sessions/${session.id}/students`}
          className="rounded-lg border border-surface-200 bg-white p-5 shadow-card transition-colors hover:border-navy-300 hover:bg-surface-50"
        >
          <div className="flex items-center gap-2 text-slate-900">
            <Users className="h-4 w-4 text-navy-700" />
            <span className="text-sm font-semibold tracking-tight">Manage students</span>
          </div>
          <p className="mt-1 text-sm text-surface-500">
            Add or remove students from this session&apos;s roster.
          </p>
        </Link>
        <Link
          href={`/faculty/sessions/${session.id}/tasks`}
          className="rounded-lg border border-surface-200 bg-white p-5 shadow-card transition-colors hover:border-navy-300 hover:bg-surface-50"
        >
          <div className="flex items-center gap-2 text-slate-900">
            <FileText className="h-4 w-4 text-navy-700" />
            <span className="text-sm font-semibold tracking-tight">Practical tasks</span>
          </div>
          <p className="mt-1 text-sm text-surface-500">
            Create tasks, set deadlines and publish them to students.
          </p>
        </Link>
      </div>
    </div>
  );
}