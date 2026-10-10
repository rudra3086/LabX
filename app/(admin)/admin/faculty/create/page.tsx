import { getAssignableSubjects } from "@/lib/server/services/admin";
import { FacultyForm } from "@/components/admin/faculty-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function AdminCreateFacultyPage() {
  const subjects = await getAssignableSubjects();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add faculty"
        description="Create a faculty account and assign the subjects they will teach."
      />
      <FacultyForm subjects={subjects} />
    </div>
  );
}