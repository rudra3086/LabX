import { ListTodo, CheckCircle2, CalendarClock, AlertTriangle, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/server/rbac";
import { getStudentTasks } from "@/lib/server/services/student";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { TasksTable } from "@/components/student/tasks-table";

export const dynamic = "force-dynamic";

const SUBMITTED = new Set(["SUBMITTED", "LATE", "GRADED"]);

export default async function StudentTasksPage() {
  const user = await getCurrentUser();
  const tasks = await getStudentTasks(user!.student!.id);

  const submitted = tasks.filter((t) => SUBMITTED.has(t.status)).length;
  const pending = tasks.filter(
    (t) => !SUBMITTED.has(t.status) && t.viewStatus !== "MISSED"
  ).length;
  const late = tasks.filter((t) => t.status === "LATE").length;
  const missed = tasks.filter((t) => t.viewStatus === "MISSED").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Every published practical across your enrolled sessions, with deadlines and submission status."
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="No practicals assigned yet"
          description="When your faculty publishes a practical task, it will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <StatCard title="Assigned" value={tasks.length} icon={<ListTodo className="h-3.5 w-3.5" />} />
            <StatCard title="Submitted" value={submitted} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
            <StatCard title="Pending" value={pending} icon={<CalendarClock className="h-3.5 w-3.5" />} />
            <StatCard title="Late" value={late} icon={<AlertTriangle className="h-3.5 w-3.5" />} />
            <StatCard title="Missed" value={missed} icon={<XCircle className="h-3.5 w-3.5" />} />
          </div>
          <TasksTable tasks={tasks} />
        </>
      )}
    </div>
  );
}
