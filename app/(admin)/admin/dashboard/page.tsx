import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  FileText,
  FolderKanban,
  GraduationCap,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { getAdminDashboardStats } from "@/lib/server/services/dashboard";
import { StatCard } from "@/components/ui/stat-card";
import { CommandBar } from "@/components/ui/command-bar";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader, SectionHeader } from "@/components/layout/page-header";

const QUICK_ACTIONS = [
  {
    href: "/admin/subjects/create",
    label: "Create subject",
    description: "Add a subject code, semester and department.",
    icon: BookOpen,
  },
  {
    href: "/admin/faculty/create",
    label: "Add faculty",
    description: "Register teaching staff and assign subjects.",
    icon: GraduationCap,
  },
  {
    href: "/admin/students",
    label: "Manage students",
    description: "Search, edit and update student records.",
    icon: Users,
  },
  {
    href: "/admin/reports",
    label: "View reports",
    description: "Platform-wide performance and submission data.",
    icon: FileText,
  },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Dashboard"
        description="Platform overview — subjects, faculty, students and activity at a glance."
      />

      <CommandBar
        actions={
          <ButtonLink href="/admin/subjects/create" size="sm" icon={<Plus className="h-4 w-4" />}>
            Create subject
          </ButtonLink>
        }
      >
        <ButtonLink href="/admin/faculty/create" variant="ghost" size="sm" icon={<GraduationCap className="h-4 w-4" />}>
          Add faculty
        </ButtonLink>
        <ButtonLink href="/admin/students" variant="ghost" size="sm" icon={<Users className="h-4 w-4" />}>
          Students
        </ButtonLink>
        <ButtonLink href="/admin/settings" variant="ghost" size="sm" icon={<Settings className="h-4 w-4" />}>
          Settings
        </ButtonLink>
      </CommandBar>

      <section className="space-y-3">
        <SectionHeader title="Platform at a glance" meta="Live from PostgreSQL" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <StatCard title="Students" value={stats.totalStudents} icon={<Users className="h-4 w-4" />} tone="brand" />
          <StatCard title="Faculty" value={stats.totalFaculty} icon={<GraduationCap className="h-4 w-4" />} tone="emerald" />
          <StatCard title="Subjects" value={stats.totalSubjects} icon={<BookOpen className="h-4 w-4" />} tone="sky" />
          <StatCard title="Active sessions" value={stats.activeSessions} icon={<FolderKanban className="h-4 w-4" />} tone="amber" />
          <StatCard title="Tasks" value={stats.totalTasks} icon={<FileText className="h-4 w-4" />} tone="slate" />
          <StatCard title="Submissions" value={stats.totalSubmissions} icon={<Database className="h-4 w-4" />} tone="brand" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Quick actions" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start gap-3 rounded-fluentLg border border-surface-200 bg-white p-4 shadow-card transition-all hover:border-navy-200 hover:shadow-elevated"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-fluent bg-navy-50 text-navy-700">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-surface-900">
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-surface-300 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-surface-500">
                    {action.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
