"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { CalendarEvent } from "@/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const todayKey = dateKey(new Date());
  const monthDays = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
      const day = index - firstDay + 1;
      return day > 0 && day <= daysInMonth ? new Date(month.getFullYear(), month.getMonth(), day) : null;
    });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.date));
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const upcoming = events
    .filter((event) => new Date(event.date).getTime() >= Date.now())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-navy-700">Planning</p>
          <h1 className="text-3xl font-semibold tracking-tight text-surface-900">Calendar</h1>
          <p className="mt-1 text-base text-surface-500">Keep schedules and task deadlines in view.</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-surface-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-navy-600" />Schedule</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Deadline</span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-fluentLg border border-surface-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-surface-900">{formatDate(month)}</h2>
            <div className="flex items-center gap-1">
              <button aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-fluent p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-900"><ChevronLeft className="h-5 w-5" /></button>
              <button aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-fluent p-2 text-surface-500 hover:bg-surface-100 hover:text-surface-900"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-surface-100 bg-surface-50">
            {WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-surface-500">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day, index) => {
              const key = day ? dateKey(day) : `empty-${index}`;
              const dayEvents = day ? eventsByDay.get(key) ?? [] : [];
              return (
                <div key={key} className={cn("min-h-[104px] border-b border-r border-surface-100 p-2", !day && "bg-surface-50/60")}>
                  {day && <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-sm", key === todayKey && "bg-navy-600 font-semibold text-white", key !== todayKey && "text-surface-700")}>{day.getDate()}</span>}
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((event) => (
                      <Link key={event.id} href={event.href} title={`${event.title} — ${event.subtitle}`} className={cn("block truncate rounded px-1.5 py-1 text-xs font-medium", event.type === "DEADLINE" ? "bg-amber-50 text-amber-800 hover:bg-amber-100" : "bg-navy-50 text-navy-800 hover:bg-navy-100")}>
                        {event.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="rounded-fluentLg border border-surface-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-navy-600" />
            <h2 className="text-lg font-semibold text-surface-900">Upcoming</h2>
          </div>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? <p className="text-sm text-surface-500">No upcoming schedules or deadlines.</p> : upcoming.map((event) => (
              <Link key={event.id} href={event.href} className="block rounded-fluent border border-surface-100 p-3 hover:border-navy-200 hover:bg-navy-50/40">
                <div className="flex items-start gap-2">
                  <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", event.type === "DEADLINE" ? "bg-amber-500" : "bg-navy-600")} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-surface-900">{event.title}</p>
                    <p className="mt-0.5 truncate text-xs text-surface-500">{event.subtitle}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-surface-600"><Clock3 className="h-3.5 w-3.5" />{formatEventDate(event.date)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
