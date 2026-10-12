import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentSubjects } from "@/lib/server/services/student";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StudentSubjectsPage() {
  const user = await getCurrentUser();
  const subjects = await getStudentSubjects(user!.student!.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Your enrolled subjects and how many practicals you have completed in each."
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects yet"
          description="You are not enrolled in any practical session. Contact your faculty or administrator."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => {
            const pct = s.taskCount > 0 ? Math.round((s.submittedCount / s.taskCount) * 100) : 0;
            return (
              <Link
                key={s.subjectId}
                href={`/student/subjects/${s.subjectId}`}
                className="group focus:outline-none"
              >
                <Card className="h-full transition-colors group-hover:border-navy-300 group-focus-visible:ring-2 group-focus-visible:ring-navy-600">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-navy-700" />
                          <span className="font-mono text-sm text-navy-700">{s.code}</span>
                        </CardTitle>
                        <CardDescription className="mt-1 truncate">{s.name}</CardDescription>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-surface-300 transition-colors group-hover:text-navy-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="slate" size="sm">
                        Semester {s.semester}
                      </Badge>
                      <Badge variant="outline" size="sm">
                        {s.department}
                      </Badge>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-surface-500">
                        <span>
                          {s.submittedCount} / {s.taskCount} submitted
                        </span>
                        <span className="tabular-nums">{pct}%</span>
                      </div>
                      <Progress value={pct} />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-surface-500">{s.pendingCount} pending</span>
                      {s.missedCount > 0 && (
                        <span className="text-rose-600">{s.missedCount} missed</span>
                      )}
                    </div>
                    {s.sessionNames.length > 0 && (
                      <p className="truncate text-xs text-surface-400">{s.sessionNames.join(" · ")}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
