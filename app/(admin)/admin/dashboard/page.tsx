import { Users, GraduationCap, BookOpen, FolderKanban, FileText, Database } from "lucide-react";
import { getAdminDashboardStats } from "@/lib/server/services/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, SectionHeader } from "@/components/layout/page-header";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform overview"
        description="Institution-wide snapshot of subjects, faculty, students and practical activity."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Students" value={stats.totalStudents} icon={<Users className="h-3.5 w-3.5" />} />
        <StatCard title="Faculty" value={stats.totalFaculty} icon={<GraduationCap className="h-3.5 w-3.5" />} />
        <StatCard title="Subjects" value={stats.totalSubjects} icon={<BookOpen className="h-3.5 w-3.5" />} />
        <StatCard title="Active sessions" value={stats.activeSessions} icon={<FolderKanban className="h-3.5 w-3.5" />} />
        <StatCard title="Tasks" value={stats.totalTasks} icon={<FileText className="h-3.5 w-3.5" />} />
        <StatCard title="Submissions" value={stats.totalSubmissions} icon={<Database className="h-3.5 w-3.5" />} />
      </div>

      <section className="space-y-3">
        <SectionHeader title="Getting started" meta="Rollout plan" />
        <Card>
          <CardHeader>
            <CardTitle>Management modules arrive progressively</CardTitle>
            <CardDescription>
              The administration console is delivered in milestones. Each module is backed by
              the PostgreSQL database — nothing is simulated.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-surface-600">
            <ul className="list-disc space-y-1 pl-4">
              <li>Subject, faculty and student management</li>
              <li>Practical session and task publishing by faculty</li>
              <li>Student submissions and file uploads</li>
              <li>Grading, and monthly performance reports</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}