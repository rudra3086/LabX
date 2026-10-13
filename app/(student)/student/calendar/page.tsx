import { CalendarView } from "@/components/calendar/calendar-view";
import { getCalendarEvents } from "@/lib/server/services/calendar";
import { requireRole } from "@/lib/server/rbac";

export default async function StudentCalendarPage() {
  const user = await requireRole("STUDENT");
  const events = await getCalendarEvents(user.id, "STUDENT");
  return <CalendarView events={events} />;
}
