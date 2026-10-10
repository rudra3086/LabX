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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem, PublicUser } from "@/types";
import { BrandMark, initialsFor } from "./brand-mark";

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
};

const NAV_SECTION: Record<string, string> = {
  Administrator: "Administration",
  Faculty: "Teaching",
  Student: "My Learning",
};

export function Sidebar({
  navItems,
  user,
  roleLabel,
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
  const section = NAV_SECTION[roleLabel] ?? "Navigation";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-surface-200 bg-white">
      <div className="flex h-16 items-center border-b border-surface-100 px-4">
        <BrandMark />
      </div>

      <p className="px-4 pb-1.5 pt-4 text-xs font-semibold text-surface-400">{section}</p>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4" aria-label="Main navigation">
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
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-100 font-medium text-navy-900"
                  : "font-normal text-surface-600 hover:bg-surface-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-navy-700" : "text-surface-400"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-surface-100 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px] font-semibold text-navy-800"
        >
          {initialsFor(user.name)}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-medium text-slate-800">{user.name}</span>
          <span className="block truncate text-xs text-surface-400">{user.email}</span>
        </span>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-slate-700"
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-surface-200 text-surface-600 lg:hidden"
    >
      {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
    </button>
  );
}