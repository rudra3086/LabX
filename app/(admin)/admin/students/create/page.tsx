import { StudentForm } from "@/components/admin/student-form";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminCreateStudentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add student"
        description="Create a student account so they can join practical sessions."
      />
      <StudentForm />
    </div>
  );
}