import { NavItem } from "@/types";

// Navigation definitions per role (spec §47). Added to incrementally as each
// module lands in a milestone — only nav items with real pages are listed
// (spec §80: no fake buttons).
export const NAV_ADMIN: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "layout-dashboard", activeMatch: "/admin/dashboard" },
  { label: "Subjects", href: "/admin/subjects", icon: "subjects", activeMatch: "/admin/subjects" },
  { label: "Faculty", href: "/admin/faculty", icon: "faculty", activeMatch: "/admin/faculty" },
  { label: "Students", href: "/admin/students", icon: "students", activeMatch: "/admin/students" },
];

export const NAV_FACULTY: NavItem[] = [
  { label: "Dashboard", href: "/faculty/dashboard", icon: "layout-dashboard", activeMatch: "/faculty/dashboard" },
  { label: "Subjects", href: "/faculty/subjects", icon: "subjects", activeMatch: "/faculty/subjects" },
  { label: "Sessions", href: "/faculty/sessions", icon: "sessions", activeMatch: "/faculty/sessions" },
  { label: "Tasks", href: "/faculty/tasks", icon: "tasks", activeMatch: "/faculty/tasks" },
];

export const NAV_STUDENT: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: "layout-dashboard", activeMatch: "/student/dashboard" },
];