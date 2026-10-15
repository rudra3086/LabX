import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import {
  getFacultySessionDetail,
  getSessionTasks,
} from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { SessionTabs } from "@/components/faculty/session-tabs";
import { SessionTasks } from "@/components/faculty/session-tasks";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function SessionTasksPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const facultyId = user!.faculty!.id;

  try {
    const session = await getFacultySessionDetail(facultyId, params.id);
    const tasks = await getSessionTasks(facultyId, params.id);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={session.name}
          title="Tasks"
          description="Create practical tasks and publish them to the session's students."
          actions={
            <ButtonLink
              href={`/faculty/sessions/${session.id}/tasks/create`}
              icon={<Plus className="h-4 w-4" />}
            >
              New task
            </ButtonLink>
          }
        />
        <SessionTabs sessionId={session.id} />
        <SessionTasks
          sessionId={session.id}
          tasks={tasks}
          sessionStatus={session.status}
          enrolledCount={session.studentCount}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }
}