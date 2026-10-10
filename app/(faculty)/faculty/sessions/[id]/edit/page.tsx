import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/rbac";
import {
  getFacultySessionDetail,
  getFacultySubjects,
} from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { SessionForm } from "@/components/faculty/session-form";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const facultyId = user!.faculty!.id;

  try {
    const [session, subjects] = await Promise.all([
      getFacultySessionDetail(facultyId, params.id),
      getFacultySubjects(facultyId),
    ]);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Edit session"
          title={session.name}
          description="Update session details. Status changes are managed from the session page."
        />
        <SessionForm
          subjects={subjects.map((s) => ({
            subjectId: s.subjectId,
            code: s.code,
            name: s.name,
            semester: s.semester,
          }))}
          initial={{
            id: session.id,
            subjectId: session.subjectId,
            name: session.name,
            semester: session.semester,
            batch: session.batch,
            startDate: session.startDate,
            endDate: session.endDate,
            description: session.description,
          }}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }
}