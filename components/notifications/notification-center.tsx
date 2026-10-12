"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CalendarClock,
  Award,
  AlertCircle,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";

export interface NotificationItem {
  id: string;
  type: "TASK_CREATED" | "DEADLINE_REMINDER" | "DEADLINE_MISSED" | "SUBMISSION_GRADED" | "GENERAL";
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const PAGE_SIZE = 20;

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async (pageNum: number = 1) => {
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=${PAGE_SIZE}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
        setTotal(json.data.pagination.total);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "SUBMISSION_GRADED":
        return <Award className="h-4 w-4 text-emerald-600" />;
      case "DEADLINE_REMINDER":
      case "DEADLINE_MISSED":
        return <CalendarClock className="h-4 w-4 text-amber-600" />;
      case "TASK_CREATED":
        return <FileText className="h-4 w-4 text-navy-700" />;
      default:
        return <Bell className="h-4 w-4 text-surface-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-surface-200 bg-white p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-navy-700" />
          <h2 className="text-base font-semibold text-surface-900">Notifications</h2>
          {unreadCount > 0 ? (
            <Badge variant="rose" size="sm">
              {unreadCount} unread
            </Badge>
          ) : (
            <Badge variant="slate" size="sm">
              All caught up
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchNotifications(1)}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-surface-200 bg-white shadow-card">
        {loading ? (
          <div className="flex h-36 items-center justify-center text-sm text-surface-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center text-sm text-surface-400">
            No notifications found.
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {notifications.map((n) => {
              const formattedDate = new Date(n.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={n.id}
                  className={`flex items-start justify-between gap-4 p-4 transition-colors ${
                    !n.read ? "bg-navy-50/40" : "hover:bg-surface-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-surface-200 bg-white">
                      {getIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-surface-900">
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-navy-600" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-surface-600">{n.message}</p>
                      <span className="mt-1 block text-[11px] text-surface-400">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => !n.read && markAsRead(n.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-navy-700 hover:bg-navy-50"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markAsRead(n.id)}
                        title="Mark as read"
                        className="rounded p-1 text-surface-400 hover:bg-surface-100 hover:text-slate-700"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={(p) => {
          setPage(p);
          fetchNotifications(p);
        }}
      />
    </div>
  );
}
