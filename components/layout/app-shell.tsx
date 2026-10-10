"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem, PublicUser } from "@/types";
import { Sidebar, MobileNavToggle } from "./sidebar";
import { initialsFor } from "./brand-mark";

function pageTitleFor(pathname: string): string {
  // e.g. /admin/dashboard -> "Dashboard", /student/tasks -> "Tasks"
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
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    startLogout(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    });
  };

  const pageTitle = pageTitleFor(pathname);

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">
        <Sidebar
          navItems={navItems}
          user={user}
          roleLabel={roleLabel}
          onLogout={() => void handleLogout()}
        />
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40"
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

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-surface-200 bg-white">
          <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <MobileNavToggle open={mobileOpen} onToggle={() => setMobileOpen((v) => !v)} />
              <div className="leading-tight">
                <p className="text-[11px] font-medium text-surface-400">{roleLabel}</p>
                <h1 className="text-sm font-semibold tracking-tight text-slate-900">
                  {pageTitle}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden md:flex md:items-center md:gap-2.5">
                <span className="text-right leading-tight">
                  <span className="block text-[13px] font-medium text-slate-800">{user.name}</span>
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-xs font-semibold text-navy-800">
                  {initialsFor(user.name)}
                </span>
              </span>
              <button
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-slate-800 disabled:opacity-60"
              >
                {isLoggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                <span>Log out</span>
              </button>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
          )}
        >
          {/* key forces scroll reset + fresh mount when navigating between dashboards */}
          <div key={pathname}>{children}</div>
        </main>
      </div>
    </div>
  );
}