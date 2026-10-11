import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getTaskSubmissions } from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { TaskSubmissions } from "@/components/faculty/task-submissions";
import { formatIST } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function TaskSubmissionsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  let data;
  try {
    data = await getTaskSubmissions(user!.faculty!.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }

  const { task, counts } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${task.subjectCode} — ${task.sessionName}`}
        title={task.title}
        description={`Review submissions and assign marks and remarks. ${task.maximumMarks} marks${
          task.deadline ? ` · due ${formatIST(task.deadline)}` : " · no deadline"
        }.`}
        actions={
          <Link
            href={`/faculty/tasks/${task.id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to task
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Enrolled" value={counts.enrolled} />
        <StatCard title="Submitted" value={counts.submitted} />
        <StatCard title="Pending" value={counts.pending} />
        <StatCard title="Late" value={counts.late} />
        <StatCard title="Graded" value={counts.graded} />
        <StatCard title="Ungraded" value={counts.ungraded} />
      </div>

      <Card>
        <CardContent>
          <TaskSubmissions taskId={task.id} data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
