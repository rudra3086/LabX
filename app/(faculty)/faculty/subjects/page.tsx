import Link from "next/link";
import { BookOpen, Users, FolderKanban } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getFacultySubjects } from "@/lib/server/services/faculty";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function FacultySubjectsPage() {
  const user = await getCurrentUser();
  const subjects = await getFacultySubjects(user!.faculty!.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My subjects"
        description="Subjects you are assigned to teach, with your practical sessions and enrolled students."
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects assigned"
          description="An administrator has not yet assigned you to any subject. Once assigned, your subjects will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s) => (
            <Card key={s.subjectId} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[13px] text-navy-700">{s.code}</p>
                    <h3 className="mt-0.5 text-sm font-semibold tracking-tight text-slate-900">
                      {s.name}
                    </h3>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-surface-200 bg-surface-50 text-surface-500">
                    <BookOpen className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-[13px] text-surface-500">
                  {s.department} · Semester {s.semester}
                </p>

                <div className="mt-auto flex items-center gap-4 border-t border-surface-100 pt-4 text-[13px] text-surface-600">
                  <span className="inline-flex items-center gap-1.5">
                    <FolderKanban className="h-3.5 w-3.5 text-surface-400" />
                    {s.sessionCount} session{s.sessionCount === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-surface-400" />
                    {s.studentCount} student{s.studentCount === 1 ? "" : "s"}
                  </span>
                </div>

                <Link
                  href={`/faculty/sessions?subjectId=${s.subjectId}`}
                  className="text-[13px] font-medium text-navy-700 hover:text-navy-900"
                >
                  View sessions →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}