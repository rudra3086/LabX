import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const dynamic = "force-dynamic";

export default function StudentNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Upcoming deadline reminders, graded practical updates, and announcements."
      />

      <NotificationCenter />
    </div>
  );
}
