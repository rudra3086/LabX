import {
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  CalendarClock,
  XCircle,
  Award,
  FileText,
  Trophy,
} from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentDashboardStats } from "@/lib/server/services/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { CommandBar } from "@/components/ui/command-bar";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeader } from "@/components/layout/page-header";
import { formatRelativeDeadline, formatIST, greetingFor } from "@/lib/date";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  const stats = await getStudentDashboardStats(user!.student!.id);
  const firstName = user!.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title={`${greetingFor()}, ${firstName}`}
        description="Your practical workload, deadlines and results in one place."
      />

      <CommandBar
        actions={
          <ButtonLink href="/student/tasks" size="sm" icon={<ListTodo className="h-4 w-4" />}>
            View tasks
          </ButtonLink>
        }
      >
        <ButtonLink href="/student/submissions" variant="ghost" size="sm" icon={<FileText className="h-4 w-4" />}>
          Submissions
        </ButtonLink>
        <ButtonLink href="/student/grades" variant="ghost" size="sm" icon={<Trophy className="h-4 w-4" />}>
          Grades
        </ButtonLink>
      </CommandBar>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard title="Assigned" value={stats.assignedTasks} icon={<ListTodo className="h-4 w-4" />} tone="brand" />
        <StatCard title="Submitted" value={stats.submittedTasks} icon={<CheckCircle2 className="h-4 w-4" />} tone="emerald" />
        <StatCard title="Pending" value={stats.pendingTasks} icon={<CalendarClock className="h-4 w-4" />} tone="sky" />
        <StatCard title="Late" value={stats.lateSubmissions} icon={<AlertTriangle className="h-4 w-4" />} tone="amber" />
        <StatCard title="Missed" value={stats.missedTasks} icon={<XCircle className="h-4 w-4" />} tone="rose" />
      </div>

      <Card className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-teal-100 bg-teal-50 text-teal-700">
          <Award className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-surface-500">Overall score</p>
          <p className="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
            {stats.averageScorePercent === null ? "—" : `${stats.averageScorePercent}%`}
          </p>
        </div>
        <p className="shrink-0 text-xs text-surface-400">Across graded practicals</p>
      </Card>

      <section className="space-y-3">
        <SectionHeader
          title="Upcoming tasks"
          meta={`${stats.upcoming.length} practicals ahead`}
          className="text-lg"
        />
        {stats.upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming practicals"
            description="You are all caught up. New practicals will appear here when faculty publishes them."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {stats.upcoming.map((task) => (
              <Card key={task.taskId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">
                        {task.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-base">
                        {task.subjectCode} · {task.subjectName} · {task.sessionName}
                      </CardDescription>
                    </div>
                    <StatusBadge status={task.viewStatus} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-surface-600">
                    <span>Maximum marks</span>
                    <span className="font-medium tabular-nums text-slate-900">{task.maximumMarks}</span>
                  </div>
                  <div className="flex items-center justify-between text-surface-600">
                    <span>Deadline</span>
                    <span className="font-medium text-slate-900">
                      {task.deadline ? formatIST(task.deadline) : "No deadline"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-surface-100 pt-2.5 text-xs text-surface-400">
                    <span>{formatRelativeDeadline(task.deadline)}</span>
                    {task.submissionStatus === "DRAFT" && <Badge variant="slate" size="sm">Draft saved</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Recent grades" meta={stats.recentGrades.length === 0 ? undefined : "Most recent first"} />
        {stats.recentGrades.length === 0 ? (
          <EmptyState
            title="No grades published yet"
            description="Once your faculty grades your practicals, the results appear here."
          />
        ) : (
          <Card>
            <div className="divide-y divide-surface-100">
              {stats.recentGrades.map((g) => (
                <div key={g.taskId} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{g.taskTitle}</p>
                    <p className="mt-0.5 text-xs text-surface-400">
                      {g.subjectCode} · {g.subjectName} · graded {formatIST(g.gradedAt)}
                    </p>
                    {g.remarks && (
                      <p className="mt-1 text-sm italic text-surface-500">“{g.remarks}”</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-900">
                      {g.marks}
                      <span className="text-sm font-normal text-surface-400"> / {g.maximumMarks}</span>
                    </p>
                    <p className="mt-0.5 text-xs tabular-nums text-surface-400">{g.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}