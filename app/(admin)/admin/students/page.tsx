import { Plus } from "lucide-react";
import { getAdminStudents } from "@/lib/server/services/admin";
import { StudentsList } from "@/components/admin/students-list";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const students = await getAdminStudents();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${students.length} student${students.length === 1 ? "" : "s"} on the platform.`}
        actions={
          <ButtonLink href="/admin/students/create" icon={<Plus className="h-4 w-4" />}>
            Add student
          </ButtonLink>
        }
      />
      <StudentsList items={students} />
    </div>
  );
}