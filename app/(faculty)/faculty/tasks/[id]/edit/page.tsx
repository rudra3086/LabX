import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultyTaskDetail } from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { TaskForm } from "@/components/faculty/task-form";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  try {
    const task = await getFacultyTaskDetail(user!.faculty!.id, params.id);
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${task.subjectCode} — ${task.sessionName}`}
          title="Edit task"
          description="Update the task details. Publishing is managed from the task page."
        />
        <TaskForm
          sessionId={task.sessionId}
          sessionLabel={`${task.subjectCode} — ${task.sessionName}`}
          initial={{
            id: task.id,
            sessionId: task.sessionId,
            title: task.title,
            description: task.description,
            instructions: task.instructions,
            maximumMarks: task.maximumMarks,
            deadline: task.deadline,
            allowLateSubmission: task.allowLateSubmission,
            submissionFormat: task.submissionFormat,
            fileNamingConvention: task.fileNamingConvention,
            requiredFileTypes: task.requiredFileTypes,
          }}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }
}