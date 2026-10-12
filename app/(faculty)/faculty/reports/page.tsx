import { getCurrentUser } from "@/lib/server/rbac";
import { prisma } from "@/lib/server/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassReportView } from "@/components/reports/class-report-view";

export const dynamic = "force-dynamic";

export default async function FacultyReportsPage() {
  const user = await getCurrentUser();
  const faculty = user?.faculty;

  if (!faculty) {
    return (
      <EmptyState
        title="Faculty profile not found"
        description="Unable to load sessions for this faculty account."
      />
    );
  }

  const sessions = await prisma.practicalSession.findMany({
    where: { facultyId: faculty.id },
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  const sessionOptions = sessions.map((s) => ({
    id: s.id,
    name: s.name,
    subjectCode: s.subject.code,
    subjectName: s.subject.name,
  }));

  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Class Performance Reports"
        description="Detailed monthly practical performance, submission rates, and student roster analysis for your sessions."
      />

      {sessionOptions.length === 0 ? (
        <EmptyState
          title="No practical sessions found"
          description="Create a practical session first to generate class performance reports."
        />
      ) : (
        <ClassReportView
          sessions={sessionOptions}
          initialSessionId={sessionOptions[0].id}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth() + 1}
        />
      )}
    </div>
  );
}
