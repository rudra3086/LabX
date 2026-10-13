"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Loader2, LogOut, Settings, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicUser } from "@/types";
import { UserAvatar } from "./user-avatar";

/**
 * Teams-style account menu (spec §47, full Fluent redesign). The avatar in the
 * title bar opens a popover with identity, a profile link and sign-out — the
 * same interaction pattern as the Microsoft Teams top-right account chip.
 */
export function UserMenu({
  user,
  roleLabel,
  onLogout,
  isLoggingOut,
}: {
  user: PublicUser;
  roleLabel: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const menuItem =
    "flex items-center gap-2.5 rounded-fluent px-2.5 py-2 text-sm transition-colors";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={cn(
          "flex items-center gap-1 rounded-fluent p-0.5 pr-1.5 transition-colors hover:bg-surface-100",
          open && "bg-surface-100"
        )}
      >
        <UserAvatar name={user.name} size="md" showPresence />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-surface-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-fluentLg border border-surface-200 bg-white shadow-elevated"
        >
          <div className="flex items-center gap-3 px-4 py-3.5">
            <UserAvatar name={user.name} size="lg" showPresence />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-surface-900">{user.name}</p>
              <p className="truncate text-xs text-surface-500">{user.email}</p>
              <span className="mt-1 inline-flex rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="border-t border-surface-100 p-1.5">
            {user.role === "ADMIN" ? (
              <Link
                href="/admin/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(menuItem, "text-surface-700 hover:bg-surface-100")}
              >
                <Settings className="h-4 w-4 text-surface-500" aria-hidden="true" />
                Settings
              </Link>
            ) : (
              <Link
                href={user.role === "FACULTY" ? "/faculty/profile" : "/student/profile"}
                onClick={() => setOpen(false)}
                role="menuitem"
                className={cn(menuItem, "text-surface-700 hover:bg-surface-100")}
              >
                <UserCircle2 className="h-4 w-4 text-surface-500" aria-hidden="true" />
                View profile
              </Link>
            )}
          </div>

          <div className="border-t border-surface-100 p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={onLogout}
              disabled={isLoggingOut}
              className={cn(
                menuItem,
                "w-full font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
              )}
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
