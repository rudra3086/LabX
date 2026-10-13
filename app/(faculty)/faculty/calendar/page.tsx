import { CalendarView } from "@/components/calendar/calendar-view";
import { getCalendarEvents } from "@/lib/server/services/calendar";
import { requireRole } from "@/lib/server/rbac";

export default async function FacultyCalendarPage() {
  const user = await requireRole("FACULTY");
  const events = await getCalendarEvents(user.id, "FACULTY");
  return <CalendarView events={events} />;
}
