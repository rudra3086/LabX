import { getCurrentUser } from "@/lib/server/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getFacultyEnrolledStudents } from "@/lib/server/services/faculty";
import { FacultyStudentsView } from "@/components/faculty/faculty-students-view";

export const dynamic = "force-dynamic";

export default async function FacultyStudentsPage() {
  const user = await getCurrentUser();
  const faculty = user?.faculty;

  if (!faculty) {
    return (
      <EmptyState
        title="Faculty profile not found"
        description="Unable to load students for this faculty account."
      />
    );
  }

  const students = await getFacultyEnrolledStudents(faculty.id);
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrolled Students"
        description="Students participating in your practical sessions, along with their individual performance reports."
      />

      <FacultyStudentsView
        students={students}
        currentYear={now.getFullYear()}
        currentMonth={now.getMonth() + 1}
      />
    </div>
  );
}
