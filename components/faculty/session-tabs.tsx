"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SessionTabs({ sessionId }: { sessionId: string }) {
  const pathname = usePathname();
  const base = `/faculty/sessions/${sessionId}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/students`, label: "Students" },
    { href: `${base}/tasks`, label: "Tasks" },
  ];

  return (
    <div className="flex items-center gap-1 border-b border-surface-200">
      {tabs.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-navy-700 text-navy-800"
                : "border-transparent text-surface-500 hover:text-slate-900"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}