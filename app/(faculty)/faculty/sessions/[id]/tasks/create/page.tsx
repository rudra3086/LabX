import { notFound } from "next/navigation";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
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
        {session.studentCount === 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              This session has no enrolled students yet.{" "}
              <Link
                href={`/faculty/sessions/${session.id}/students`}
                className="font-semibold underline underline-offset-2"
              >
                Enroll students in the session
              </Link>{" "}
              after creating the task so they can receive and submit it.
            </p>
          </div>
        )}
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