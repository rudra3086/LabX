import { notFound } from "next/navigation";
import { getAdminStudentDetail, getAssignableSubjects } from "@/lib/server/services/admin";
import { StudentForm } from "@/components/admin/student-form";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export default async function AdminEditStudentPage({ params }: { params: { id: string } }) {
  let student;
  const subjects = await getAssignableSubjects();
  try {
    student = await getAdminStudentDetail(params.id);
  } catch {
    notFound();
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${student.name}`}
        description={`${student.rollNumber} · ${student.department}, semester ${student.semester}`}
      />
      <StudentForm initial={student} subjects={subjects} />
    </div>
  );
}