import { PageHeader } from "@/components/layout/page-header";
import { RagCopilot } from "@/components/rag/rag-copilot";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentSubjects } from "@/lib/server/services/student";

export const dynamic = "force-dynamic";

export default async function StudentAiVivaPage() {
  const user = await getCurrentUser();
  const subjects = await getStudentSubjects(user!.student!.id);
  return <div className="space-y-6"><PageHeader title="AI Viva Copilot" description="Ask questions and practise viva answers using your enrolled subject material." /><RagCopilot subjects={subjects.map((s) => ({ id: s.subjectId, code: s.code, name: s.name }))} /></div>;
}
