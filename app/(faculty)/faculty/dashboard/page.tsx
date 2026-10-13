import {
  CalendarClock,
  ClipboardCheck,
  FileText,
  Plus,
  Users,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultyDashboardStats } from "@/lib/server/services/dashboard";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, SectionHeader } from "@/components/layout/page-header";

export default async function FacultyDashboardPage() {
  const user = await getCurrentUser();
  const facultyId = user!.faculty!.id;
  const stats = await getFacultyDashboardStats(facultyId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teaching"
        title={`Welcome, ${user!.name.split(" ")[0]}`}
        description="Pending work, deadlines and student performance across your practical sessions."
      />

      <CommandBar
        actions={
          <ButtonLink href="/faculty/sessions/create" size="sm" icon={<Plus className="h-4 w-4" />}>
            New session
          </ButtonLink>
        }
      >
        <ButtonLink href="/faculty/sessions" variant="ghost" size="sm" icon={<CalendarClock className="h-4 w-4" />}>
          Sessions
        </ButtonLink>
        <ButtonLink href="/faculty/tasks" variant="ghost" size="sm" icon={<FileText className="h-4 w-4" />}>
          Tasks
        </ButtonLink>
        <ButtonLink href="/faculty/reports" variant="ghost" size="sm" icon={<ClipboardCheck className="h-4 w-4" />}>
          Reports
        </ButtonLink>
      </CommandBar>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          title="Pending submissions"
          value={stats.pendingSubmissions}
          icon={<Inbox className="h-4 w-4" />}
          tone="amber"
          subtitle="Students who have not submitted"
        />
        <StatCard
          title="Ungraded"
          value={stats.ungradedSubmissions}
          icon={<ClipboardCheck className="h-4 w-4" />}
          tone="brand"
          subtitle="Submitted work awaiting marks"
        />
        <StatCard
          title="Late"
          value={stats.lateSubmissions}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="rose"
          subtitle="Submitted after the deadline"
        />
        <StatCard
          title="Upcoming deadlines"
          value={stats.upcomingDeadlines}
          icon={<CalendarClock className="h-4 w-4" />}
          tone="sky"
          subtitle="Published tasks closing soon"
        />
      </div>

      <section className="space-y-3">
        <SectionHeader title="Your subjects" meta={`${stats.subjects.length} assigned`} />
        {stats.subjects.length === 0 ? (
          <EmptyState
            title="No subjects assigned"
            description="Subjects assigned to you will appear here once the administrator links them."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.subjects.map((sub) => (
              <Card key={sub.subjectId}>
                <CardHeader>
                  <CardTitle>
                    <span className="font-normal text-surface-400">{sub.code}</span>
                    <span className="mx-1.5 text-surface-200">/</span>
                    {sub.name}
                  </CardTitle>
                  <CardDescription>
                    {sub.sessionName}
                    {sub.batch ? ` · ${sub.batch}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between text-surface-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-surface-400" /> Students
                    </span>
                    <span className="font-medium tabular-nums text-slate-900">{sub.students}</span>
                  </div>
                  <div className="flex items-center justify-between text-surface-600">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-surface-400" /> Tasks
                    </span>
                    <span className="font-medium tabular-nums text-slate-900">{sub.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between text-surface-600">
                    <span>Submission rate</span>
                    <span className="font-medium tabular-nums text-slate-900">
                      {sub.submissionRatePercent === null ? "—" : `${sub.submissionRatePercent}%`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-surface-600">
                    <span>Average score</span>
                    <span className="font-medium tabular-nums text-slate-900">
                      {sub.averageScorePercent === null ? "—" : `${sub.averageScorePercent}%`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-surface-100 pt-2.5 text-xs text-surface-400">
                    <span>{sub.upcomingDeadlines} upcoming deadline{sub.upcomingDeadlines === 1 ? "" : "s"}</span>
                    <span>{sub.gradedSubmissions} graded</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Students needing attention"
          meta={stats.studentsNeedingAttention.length === 0 ? undefined : "Rule-based flags"}
        />
        {stats.studentsNeedingAttention.length === 0 ? (
          <EmptyState
            title="No students need attention"
            description="No flags for low performance, high missed or late submissions were triggered."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll no</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Missed</TableHead>
                <TableHead>Flags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.studentsNeedingAttention.map((st) => (
                <TableRow key={st.studentId}>
                  <TableCell className="font-medium text-slate-900">{st.name}</TableCell>
                  <TableCell className="tabular-nums text-surface-500">{st.rollNumber}</TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">
                    {st.averagePercent === null ? "—" : `${st.averagePercent}%`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">{st.missedCount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {st.flags.map((f) => (
                        <span
                          key={f}
                          className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-medium text-amber-800"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}