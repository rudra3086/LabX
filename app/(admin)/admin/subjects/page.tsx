import { Plus } from "lucide-react";
import { getAdminSubjects } from "@/lib/server/services/admin";
import { SubjectsList } from "@/components/admin/subjects-list";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  const subjects = await getAdminSubjects();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description={`${subjects.length} subject${subjects.length === 1 ? "" : "s"} across the platform.`}
        actions={
          <ButtonLink href="/admin/subjects/create" icon={<Plus className="h-4 w-4" />}>
            New subject
          </ButtonLink>
        }
      />
      <SubjectsList items={subjects} />
    </div>
  );
}