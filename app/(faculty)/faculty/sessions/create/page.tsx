import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultySubjects } from "@/lib/server/services/faculty";
import { PageHeader } from "@/components/layout/page-header";
import { SessionForm } from "@/components/faculty/session-form";

export const dynamic = "force-dynamic";

export default async function CreateSessionPage({
  searchParams,
}: {
  searchParams: { subjectId?: string };
}) {
  const user = await getCurrentUser();
  const subjects = await getFacultySubjects(user!.faculty!.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="New session"
        description="Create a practical session. It starts as a draft so you can add students and tasks before activating it."
      />
      <SessionForm
        subjects={subjects.map((s) => ({
          subjectId: s.subjectId,
          code: s.code,
          name: s.name,
          semester: s.semester,
        }))}
        defaultSubjectId={searchParams.subjectId}
      />
    </div>
  );
}