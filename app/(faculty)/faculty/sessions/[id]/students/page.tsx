import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/server/rbac";
import {
  getFacultySessionDetail,
  getSessionStudents,
  getEnrollableStudents,
} from "@/lib/server/services/faculty";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { SessionTabs } from "@/components/faculty/session-tabs";
import { SessionRoster } from "@/components/faculty/session-roster";

export const dynamic = "force-dynamic";

export default async function SessionStudentsPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const facultyId = user!.faculty!.id;

  try {
    const session = await getFacultySessionDetail(facultyId, params.id);
    const [students, candidates] = await Promise.all([
      getSessionStudents(facultyId, params.id),
      getEnrollableStudents(facultyId, params.id),
    ]);

    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow={session.name}
          title="Students"
          description="Enroll students into this session. Only enrolled students can see and submit its tasks."
        />
        <SessionTabs sessionId={session.id} />
        <SessionRoster
          sessionId={session.id}
          initialStudents={students}
          initialCandidates={candidates}
          locked={session.status === "ARCHIVED"}
        />
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }
}