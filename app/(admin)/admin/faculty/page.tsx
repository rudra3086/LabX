import { Plus } from "lucide-react";
import { getAdminFaculty } from "@/lib/server/services/admin";
import { FacultyList } from "@/components/admin/faculty-list";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function AdminFacultyPage() {
  const faculty = await getAdminFaculty();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty"
        description={`${faculty.length} faculty member${faculty.length === 1 ? "" : "s"} on the platform.`}
        actions={
          <ButtonLink href="/admin/faculty/create" icon={<Plus className="h-4 w-4" />}>
            Add faculty
          </ButtonLink>
        }
      />
      <FacultyList items={faculty} />
    </div>
  );
}