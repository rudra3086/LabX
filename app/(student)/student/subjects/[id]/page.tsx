import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentSubjectDetail } from "@/lib/server/services/student";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { TasksTable } from "@/components/student/tasks-table";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StudentSubjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  let data;
  try {
    data = await getStudentSubjectDetail(user!.student!.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }

  const { subject, tasks } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Semester ${subject.semester} · ${subject.department}`}
        title={`${subject.code} — ${subject.name}`}
        description={
          subject.description ||
          `${subject.taskCount} practical(s) · ${subject.submittedCount} submitted · ${subject.pendingCount} pending`
        }
        actions={
          <Link
            href="/student/subjects"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            All subjects
          </Link>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No practicals in this subject"
          description="There are currently no published tasks for this subject."
        />
      ) : (
        <TasksTable tasks={tasks} showSubject={false} />
      )}
    </div>
  );
}
