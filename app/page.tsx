import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/rbac";

const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  FACULTY: "/faculty/dashboard",
  STUDENT: "/student/dashboard",
} as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user ? ROLE_HOME[user.role] : "/login");
}