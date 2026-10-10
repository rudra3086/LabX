import { Plus } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import {
  getFacultySessions,
  getFacultySubjects,
} from "@/lib/server/services/faculty";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { SessionsList } from "@/components/faculty/sessions-list";

export const dynamic = "force-dynamic";

export default async function FacultySessionsPage({
  searchParams,
}: {
  searchParams: { subjectId?: string };
}) {
  const user = await getCurrentUser();
  const facultyId = user!.faculty!.id;
  const subjectId = searchParams.subjectId;

  const [sessions, subjects] = await Promise.all([
    getFacultySessions(facultyId, subjectId),
    getFacultySubjects(facultyId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Practical sessions you run for your subjects. Activate a session to start publishing tasks."
        actions={
          <ButtonLink href="/faculty/sessions/create" icon={<Plus className="h-4 w-4" />}>
            New session
          </ButtonLink>
        }
      />
      <SessionsList
        sessions={sessions}
        subjects={subjects.map((s) => ({
          subjectId: s.subjectId,
          code: s.code,
          name: s.name,
        }))}
        initialSubjectId={subjectId}
      />
    </div>
  );
}