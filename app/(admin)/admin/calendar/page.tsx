import { CalendarView } from "@/components/calendar/calendar-view";
import { getCalendarEvents } from "@/lib/server/services/calendar";
import { requireRole } from "@/lib/server/rbac";

export default async function AdminCalendarPage() {
  const user = await requireRole("ADMIN");
  const events = await getCalendarEvents(user.id, "ADMIN");
  return <CalendarView events={events} />;
}
