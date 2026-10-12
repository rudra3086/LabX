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
  LogOut,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem, PublicUser } from "@/types";
import { initialsFor } from "./brand-mark";

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
};

/**
 * Teams-style navigation rail (spec §47, full Fluent redesign). A narrow
 * vertical rail of app icons with labels, a purple active indicator, and the
 * signed-in user pinned to the bottom.
 */
export function Sidebar({
  navItems,
  user,
  onNavigate,
  onLogout,
}: {
  navItems: NavItem[];
  user: PublicUser;
  roleLabel: string;
  onNavigate?: () => void;
  onLogout?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[76px] flex-col items-center border-r border-surface-200 bg-[#EBEBEB] py-2">
      <Link
        href="/"
        aria-label="SmartLab home"
        className="mb-1 flex h-11 w-11 items-center justify-center rounded-fluent bg-navy-600 text-white shadow-card"
      >
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </Link>

      <nav
        className="flex w-full flex-1 flex-col items-stretch gap-0.5 overflow-y-auto pt-2"
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
                "group relative mx-1 flex flex-col items-center gap-1 rounded-fluent px-1 py-2.5 transition-colors",
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
                  "text-center text-[10px] leading-tight",
                  active ? "font-semibold" : "font-normal"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-1 flex flex-col items-center gap-1 border-t border-surface-300/60 px-1 pt-2">
        <span
          aria-hidden="true"
          title={user.name}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-600 text-[12px] font-semibold text-white"
        >
          {initialsFor(user.name)}
        </span>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-fluent text-surface-500 transition-colors hover:bg-white/70 hover:text-surface-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-fluent border border-surface-300 text-surface-600 lg:hidden"
    >
      {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </button>
  );
}
