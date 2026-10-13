"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Users,
  FolderKanban,
  Trophy,
  FileText,
  Bell,
  UserCircle,
  Menu,
  X,
  Settings,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/types";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "layout-dashboard": LayoutDashboard,
  subjects: BookOpen,
  faculty: GraduationCap,
  students: Users,
  sessions: FolderKanban,
  tasks: FileText,
  submissions: FileText,
  grades: Trophy,
  reports: FileText,
  notifications: Bell,
  profile: UserCircle,
  settings: Settings,
  calendar: CalendarDays,
};

/**
 * Teams-style navigation rail (spec §47, full Fluent redesign). A narrow
 * vertical rail of app icons with labels, a purple active indicator, and the
 * signed-in user pinned to the bottom.
 */
export function Sidebar({
  navItems,
  onNavigate,
}: {
  navItems: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[84px] flex-col items-center border-r border-surface-200 bg-[#EBEBEB] py-2">
      <Link
        href="/"
        aria-label="SmartLab home"
        className="mb-1 flex h-11 w-11 items-center justify-center rounded-fluent bg-navy-600 text-white shadow-card"
      >
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </Link>

      <nav
        className="flex w-full flex-1 flex-col items-stretch gap-0.5 overflow-y-auto overflow-x-hidden pt-2"
        aria-label="Main navigation"
      >
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] ?? LayoutDashboard;
          const active = pathname.startsWith(item.activeMatch);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative mx-1 flex w-full flex-col items-center gap-1 rounded-fluent px-1.5 py-2.5 transition-colors",
                active
                  ? "bg-white text-navy-700 shadow-card"
                  : "text-surface-600 hover:bg-white/60 hover:text-surface-900"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-navy-600"
                />
              )}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-navy-600" : "text-surface-500 group-hover:text-surface-700"
                )}
              />
              <span
                className={cn(
                  "max-w-[68px] truncate text-center text-sm leading-tight",
                  active ? "font-semibold" : "font-normal"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}

export function MobileNavToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
      className="inline-flex h-9 w-9 items-center justify-center rounded-fluent border border-surface-300 text-surface-600 lg:hidden"
    >
      {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </button>
  );
}
