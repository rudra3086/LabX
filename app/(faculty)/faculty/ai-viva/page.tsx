import { PageHeader } from "@/components/layout/page-header";
import { RagCopilot } from "@/components/rag/rag-copilot";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultySubjects } from "@/lib/server/services/faculty";

export const dynamic = "force-dynamic";

export default async function FacultyAiVivaPage() {
  const user = await getCurrentUser();
  const subjects = await getFacultySubjects(user!.faculty!.id);
  return <div className="space-y-6"><PageHeader title="AI Viva Copilot" description="Index subject material and validate grounded answers from your course PDFs." /><RagCopilot subjects={subjects.map((s) => ({ id: s.subjectId, code: s.code, name: s.name }))} faculty /></div>;
}
