import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentSubmissions } from "@/lib/server/services/student";
import { PageHeader } from "@/components/layout/page-header";
import { TasksTable } from "@/components/student/tasks-table";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StudentSubmissionsPage() {
  const user = await getCurrentUser();
  const submissions = await getStudentSubmissions(user!.student!.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submissions"
        description="Practicals you have started, submitted or missed, with their current status."
      />

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Upload and submit your first practical — it will then appear here with its status."
        />
      ) : (
        <TasksTable tasks={submissions} />
      )}
    </div>
  );
}
