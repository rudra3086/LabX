import { notFound } from "next/navigation";
import { getAdminFacultyDetail, getAssignableSubjects } from "@/lib/server/services/admin";
import { FacultyForm } from "@/components/admin/faculty-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function AdminEditFacultyPage({ params }: { params: { id: string } }) {
  let faculty;
  try {
    faculty = await getAdminFacultyDetail(params.id);
  } catch {
    notFound();
  }
  const subjects = await getAssignableSubjects();
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${faculty.name}`}
        description={`${faculty.subjects.length} subject${faculty.subjects.length === 1 ? "" : "s"} assigned.`}
      />
      <FacultyForm initial={faculty} subjects={subjects} />
    </div>
  );
}