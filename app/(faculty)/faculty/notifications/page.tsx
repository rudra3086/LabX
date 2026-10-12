import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const dynamic = "force-dynamic";

export default function FacultyNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Deadline reminders for your tasks, late submissions, and platform updates."
      />

      <NotificationCenter />
    </div>
  );
}