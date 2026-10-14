import { StudentForm } from "@/components/admin/student-form";
import { PageHeader } from "@/components/layout/page-header";
import { getAssignableSubjects } from "@/lib/server/services/admin";

export default async function AdminCreateStudentPage() {
  const subjects = await getAssignableSubjects();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add student"
        description="Create a student account so they can join practical sessions."
      />
      <StudentForm subjects={subjects} />
    </div>
  );
}