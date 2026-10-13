import { NavItem } from "@/types";

// Navigation definitions per role (spec §47). Only nav items with real pages
// are listed (spec §80: no fake buttons/dead links).
export const NAV_ADMIN: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "layout-dashboard", activeMatch: "/admin/dashboard" },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects", activeMatch: "/admin/subjects" },
  { label: "Faculty", href: "/admin/faculty", icon: "faculty", activeMatch: "/admin/faculty" },
  { label: "Students", href: "/admin/students", icon: "students", activeMatch: "/admin/students" },
  { label: "Calendar", href: "/admin/calendar", icon: "calendar", activeMatch: "/admin/calendar" },
  { label: "Reports", href: "/admin/reports", icon: "reports", activeMatch: "/admin/reports" },
  { label: "Notifications", href: "/admin/notifications", icon: "notifications", activeMatch: "/admin/notifications" },
  { label: "Settings", href: "/admin/settings", icon: "settings", activeMatch: "/admin/settings" },
];

export const NAV_FACULTY: NavItem[] = [
  { label: "Dashboard", href: "/faculty/dashboard", icon: "layout-dashboard", activeMatch: "/faculty/dashboard" },
  { label: "Subjects", href: "/faculty/subjects", icon: "subjects", activeMatch: "/faculty/subjects" },
  { label: "Sessions", href: "/faculty/sessions", icon: "sessions", activeMatch: "/faculty/sessions" },
  { label: "Tasks", href: "/faculty/tasks", icon: "tasks", activeMatch: "/faculty/tasks" },
  { label: "Calendar", href: "/faculty/calendar", icon: "calendar", activeMatch: "/faculty/calendar" },
  { label: "Students", href: "/faculty/students", icon: "students", activeMatch: "/faculty/students" },
  { label: "Reports", href: "/faculty/reports", icon: "reports", activeMatch: "/faculty/reports" },
  { label: "Notifications", href: "/faculty/notifications", icon: "notifications", activeMatch: "/faculty/notifications" },
];

export const NAV_STUDENT: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: "layout-dashboard", activeMatch: "/student/dashboard" },
  { label: "Subjects", href: "/student/subjects", icon: "subjects", activeMatch: "/student/subjects" },
  { label: "Tasks", href: "/student/tasks", icon: "tasks", activeMatch: "/student/tasks" },
  { label: "Calendar", href: "/student/calendar", icon: "calendar", activeMatch: "/student/calendar" },
  { label: "Submissions", href: "/student/submissions", icon: "submissions", activeMatch: "/student/submissions" },
  { label: "Grades", href: "/student/grades", icon: "grades", activeMatch: "/student/grades" },
  { label: "Reports", href: "/student/reports", icon: "reports", activeMatch: "/student/reports" },
  { label: "Notifications", href: "/student/notifications", icon: "notifications", activeMatch: "/student/notifications" },
];