import { prisma } from "@/lib/server/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { AdminReportView } from "@/components/reports/admin-report-view";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const sessions = await prisma.practicalSession.findMany({
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
        title="Institutional Performance Reports"
        description="Platform-wide aggregated practical statistics, subject-level comparisons, and session performance reports."
      />

      <AdminReportView
        sessions={sessionOptions}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth() + 1}
      />
    </div>
  );
}
