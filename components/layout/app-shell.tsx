"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem, PublicUser } from "@/types";
import { Sidebar, MobileNavToggle } from "./sidebar";
import { initialsFor } from "./brand-mark";
import { NotificationBell } from "@/components/notifications/notification-bell";

function pageTitleFor(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const label = parts.length > 0 ? parts[parts.length - 1] : "Dashboard";
  if (label === "dashboard") return "Dashboard";
  if (label.includes("-")) {
    return label
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const ROLE_TEAM: Record<string, string> = {
  Administrator: "SmartLab Administration",
  Faculty: "Teaching Team",
  Student: "My Learning",
};

export function AppShell({
  user,
  roleLabel,
  navItems,
  children,
}: {
  user: PublicUser;
  roleLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    startLogout(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Route to the most relevant list per role (spec §67).
    const target =
      user.role === "ADMIN"
        ? `/admin/students?q=${encodeURIComponent(q)}`
        : user.role === "FACULTY"
          ? `/faculty/students?q=${encodeURIComponent(q)}`
          : `/student/tasks?q=${encodeURIComponent(q)}`;
    router.push(target);
  };

  const pageTitle = pageTitleFor(pathname);
  const teamName = ROLE_TEAM[roleLabel] ?? "SmartLab";

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Desktop rail */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">
        <Sidebar
          navItems={navItems}
          user={user}
          roleLabel={roleLabel}
          onLogout={() => void handleLogout()}
        />
      </div>

      {/* Mobile rail */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-surface-900/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              navItems={navItems}
              user={user}
              roleLabel={roleLabel}
              onLogout={() => void handleLogout()}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-[76px]">
        {/* Teams title / command bar */}
        <header className="sticky top-0 z-20 border-b border-surface-200 bg-white">
          <div className="flex h-12 items-center gap-3 px-3 sm:px-4">
            <MobileNavToggle open={mobileOpen} onToggle={() => setMobileOpen((v) => !v)} />

            <div className="hidden min-w-0 items-center gap-2 sm:flex">
              <span className="truncate text-[13px] font-semibold text-surface-900">
                {teamName}
              </span>
              <span className="text-surface-300">/</span>
              <span className="truncate text-[13px] text-surface-500">{pageTitle}</span>
            </div>

            <form
              onSubmit={handleSearch}
              role="search"
              className="relative ml-auto hidden max-w-md flex-1 items-center md:flex"
            >
              <Search className="pointer-events-none absolute left-2.5 h-4 w-4 text-surface-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search"
                className="h-8 w-full rounded-fluent border border-surface-300 bg-surface-50 pl-8 pr-3 text-[13px] text-surface-900 placeholder:text-surface-400 focus:bg-white focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-600"
              />
            </form>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <NotificationBell role={user.role} />
              <span className="mx-1 hidden h-6 w-px bg-surface-200 md:block" />
              <span className="hidden items-center gap-2 md:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 text-[11px] font-semibold text-white">
                  {initialsFor(user.name)}
                </span>
              </span>
              <button
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="inline-flex h-8 items-center gap-1.5 rounded-fluent px-2.5 text-[13px] font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 disabled:opacity-60"
              >
                {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <div key={pathname}>{children}</div>
        </main>
      </div>
    </div>
  );
}
