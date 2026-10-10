import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultySessionDetail } from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/faculty/task-form";

export const dynamic = "force-dynamic";

export default async function CreateTaskPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  try {
    const session = await getFacultySessionDetail(user!.faculty!.id, params.id);
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${session.subject.code} — ${session.name}`}
          title="New task"
          description="Describe the practical task. It starts as a draft; publish it once the session is active."
        />
        <TaskForm
          sessionId={session.id}
          sessionLabel={`${session.subject.code} — ${session.name}`}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }
}