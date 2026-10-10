import { SubjectForm } from "@/components/admin/subject-form";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminCreateSubjectPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New subject"
        description="Add a subject that faculty can build practical sessions on."
      />
      <SubjectForm />
    </div>
  );
}