import Link from "next/link";
import { Award } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentGrades } from "@/lib/server/services/student";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StudentGradesPage() {
  const user = await getCurrentUser();
  const grades = await getStudentGrades(user!.student!.id);

  const average =
    grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
      : null;
  const best = grades.reduce((max, g) => Math.max(max, g.percentage), 0);
  const totalMarks = grades.reduce((sum, g) => sum + (g.marks ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades"
        description="Results published by your faculty for the practicals you submitted."
      />

      {grades.length === 0 ? (
        <EmptyState
          title="No grades yet"
          description="Once your faculty grades a practical, the result will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              title="Average"
              value={average === null ? "—" : `${average}%`}
              icon={<Award className="h-3.5 w-3.5" />}
            />
            <StatCard title="Best" value={`${best}%`} icon={<Award className="h-3.5 w-3.5" />} />
            <StatCard title="Graded" value={grades.length} icon={<Award className="h-3.5 w-3.5" />} />
            <StatCard title="Total marks" value={totalMarks} icon={<Award className="h-3.5 w-3.5" />} />
          </div>

          <Card>
            <div className="divide-y divide-surface-100">
              {grades.map((g) => (
                <div key={g.taskId} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/student/tasks/${g.taskId}`}
                      className="truncate text-sm font-medium text-slate-900 hover:text-navy-700"
                    >
                      {g.taskTitle}
                    </Link>
                    <p className="mt-0.5 text-xs text-surface-400">
                      {g.subjectCode} · {g.subjectName} · {g.sessionName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums text-slate-900">
                      {g.marks}
                      <span className="text-sm font-normal text-surface-400"> / {g.maximumMarks}</span>
                    </p>
                    <Badge
                      variant={g.percentage >= 40 ? "emerald" : "rose"}
                      size="sm"
                      className="mt-1"
                    >
                      {g.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
