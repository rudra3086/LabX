import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunRemindersButton } from "@/components/admin/run-reminders-button";
import { requireRole } from "@/lib/server/rbac";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
      <dt className="shrink-0 text-[13px] text-surface-500">{label}</dt>
      <dd className="break-all text-right font-mono text-[13px] text-surface-800">{value}</dd>
    </div>
  );
}

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const [userCount, facultyCount, studentCount, subjectCount, sessionCount, taskCount, unread] =
    await Promise.all([
      prisma.user.count(),
      prisma.faculty.count(),
      prisma.student.count(),
      prisma.subject.count(),
      prisma.practicalSession.count(),
      prisma.task.count(),
      prisma.notification.count({ where: { read: false } }),
    ]);

  const dbUrl = new URL(process.env.DATABASE_URL ?? "postgresql://localhost:5432/labx");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Platform configuration, storage limits, and operational controls."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform</CardTitle>
            <CardDescription>
              Runtime configuration is read from the environment at build/run time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-surface-100">
              <ConfigRow label="App URL" value={process.env.APP_URL ?? "—"} />
              <ConfigRow label="Database host" value={`${dbUrl.hostname}:${dbUrl.port}`} />
              <ConfigRow label="Storage directory" value={process.env.STORAGE_DIR ?? "storage/"} />
              <ConfigRow
                label="Max file size"
                value={`${process.env.MAX_FILE_SIZE_MB ?? 25} MB`}
              />
              <ConfigRow
                label="Max files per submission"
                value={process.env.MAX_FILES_PER_SUBMISSION ?? "5"}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deadline reminders</CardTitle>
            <CardDescription>
              On-demand job that queues DEADLINE_REMINDER / DEADLINE_MISSED
              notifications (spec §99-102). Idempotent — safe to run on any
              schedule via an authenticated request or cron.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RunRemindersButton />
            <div className="rounded-fluent border border-surface-200 bg-surface-50 px-3 py-2 font-mono text-[12px] text-surface-500">
              POST /api/jobs/reminders
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              {[
                { label: "Users", value: userCount },
                { label: "Faculty", value: facultyCount },
                { label: "Students", value: studentCount },
                { label: "Subjects", value: subjectCount },
                { label: "Sessions", value: sessionCount },
                { label: "Tasks", value: taskCount },
                { label: "Unread notices", value: unread },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-fluent border border-surface-200 bg-surface-50/60 p-3"
                >
                  <p className="text-xl font-semibold tabular-nums text-surface-900">{s.value}</p>
                  <p className="mt-0.5 text-[12px] text-surface-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[13px] text-surface-500">Reminder job protection:</span>
              <Badge variant="emerald">Admin or job key</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}