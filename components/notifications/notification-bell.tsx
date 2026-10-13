"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { NotificationItem } from "./notification-center";

export function NotificationBell({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const notificationsUrl =
    role.toLowerCase() === "student"
      ? "/student/notifications"
      : role.toLowerCase() === "faculty"
      ? "/faculty/notifications"
      : "#";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-surface-500 hover:bg-surface-100 hover:text-slate-800"
        aria-label="View notifications"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-surface-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-surface-100 px-3.5 py-2.5">
            <span className="text-xs font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-medium text-navy-700 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-surface-100 text-xs">
            {notifications.length === 0 ? (
              <p className="py-6 text-center text-surface-400">No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 ${!n.read ? "bg-navy-50/30" : "hover:bg-surface-50"}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-semibold text-slate-800 leading-snug">{n.title}</p>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-navy-600" />}
                  </div>
                  <p className="mt-0.5 text-surface-600 line-clamp-2">{n.message}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-navy-700 hover:underline"
                    >
                      Open
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {role.toLowerCase() === "student" && (
            <div className="border-t border-surface-100 p-2 text-center">
              <Link
                href="/student/notifications"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-navy-700 hover:underline"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
