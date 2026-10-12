import { getCurrentUser } from "@/lib/server/rbac";
import { PageHeader } from "@/components/layout/page-header";
import { StudentReportView } from "@/components/reports/student-report-view";

export const dynamic = "force-dynamic";

export default async function StudentReportsPage() {
  const user = await getCurrentUser();
  const student = user?.student;
  const now = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Performance Report"
        description="Your consolidated monthly practical work summary, marks, subject breakdowns, and faculty remarks."
      />

      {student && (
        <StudentReportView
          studentId={student.id}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth() + 1}
        />
      )}
    </div>
  );
}
