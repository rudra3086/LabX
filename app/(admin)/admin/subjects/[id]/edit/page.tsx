import { notFound } from "next/navigation";
import { getAdminSubject } from "@/lib/server/services/admin";
import { SubjectForm } from "@/components/admin/subject-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function AdminEditSubjectPage({ params }: { params: { id: string } }) {
  let subject;
  try {
    subject = await getAdminSubject(params.id);
  } catch {
    notFound();
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${subject.code} — ${subject.name}`}
        description={`${subject.facultyCount} faculty assigned · ${subject.sessionCount} practical sessions.`}
      />
      <SubjectForm initial={subject} />
    </div>
  );
}