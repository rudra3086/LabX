import { notFound } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Download, FileText, User2 } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentTaskDetail } from "@/lib/server/services/student";
import { ApiError } from "@/lib/server/http";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmissionWorkspace } from "@/components/student/submission-workspace";
import { formatIST } from "@/lib/date";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StudentTaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();

  let detail;
  try {
    detail = await getStudentTaskDetail(user!.student!.id, params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status < 500) notFound();
    throw err;
  }

  const { task, subject, session, resources, submission, viewStatus } = detail;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${subject.code} — ${session.name}`}
        title={task.title}
        description={
          <>
            <StatusBadge status={viewStatus} />
            <span className="ml-2">
              {task.maximumMarks} marks
              {task.deadline ? ` · due ${formatIST(task.deadline)}` : " · no deadline"}
            </span>
          </>
        }
        actions={
          <Link
            href="/student/tasks"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
          >
            All tasks
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmissionWorkspace detail={detail} />
            </CardContent>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-surface-600">
                  {task.description || "No description provided."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-navy-700" /> Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm leading-relaxed text-surface-600">
                  {task.instructions || "No instructions provided."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Deadline">
                {task.deadline ? formatIST(task.deadline) : "No deadline"}
              </Row>
              <Row label="Late submissions">
                {task.allowLateSubmission ? "Allowed (marked late)" : "Not allowed"}
              </Row>
              <Row label="Resubmission">
                {task.allowResubmission
                  ? task.resubmissionDeadline
                    ? `Until ${formatIST(task.resubmissionDeadline)}`
                    : "Allowed"
                  : "Not allowed"}
              </Row>
              <Row label="Files">{`Max ${task.maxFiles} · ${task.maxFileSizeMb} MB each`}</Row>
              <Row label="File types">{task.requiredFileTypes || "Any accepted type"}</Row>
              {task.submissionFormat && <Row label="Format">{task.submissionFormat}</Row>}
              {task.fileNamingConvention && (
                <Row label="Naming">{task.fileNamingConvention}</Row>
              )}
              <Row label="Faculty">
                <span className="inline-flex items-center gap-1.5">
                  <User2 className="h-3.5 w-3.5 text-surface-400" />
                  {session.facultyName}
                </span>
              </Row>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Reference materials</CardTitle>
              <span className="text-xs text-surface-400">{resources.length} file(s)</span>
            </CardHeader>
            <CardContent>
              {resources.length === 0 ? (
                <EmptyState
                  title="No reference materials"
                  description="Your faculty has not shared any supporting files for this practical."
                  className="py-8"
                />
              ) : (
                <ul className="divide-y divide-surface-100">
                  {resources.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-surface-200 bg-surface-50 text-surface-500">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{r.title}</p>
                        <p className="text-xs text-surface-400">
                          {r.originalName} · {formatBytes(r.sizeBytes)}
                        </p>
                      </div>
                      <a
                        href={`/api/files/resources/${r.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-2.5 text-xs font-medium text-surface-700 transition-colors hover:bg-surface-50"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {submission.grade && (
            <Card>
              <CardHeader>
                <CardTitle>Grade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {submission.grade.marks}
                  <span className="text-sm font-normal text-surface-400">
                    {" "}
                    / {submission.grade.maximumMarks}
                  </span>
                </p>
                <p className="text-xs tabular-nums text-surface-400">
                  {submission.grade.percentage}% · graded {formatIST(submission.grade.gradedAt)}
                </p>
                {!submission.grade.isFinalized && (
                  <Badge variant="amber" size="sm">
                    Provisional
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-surface-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{children}</span>
    </div>
  );
}
