import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/components/notifications/notification-center";

export const dynamic = "force-dynamic";

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="System events, deadline reminders, and updates across the platform."
      />

      <NotificationCenter />
    </div>
  );
}