import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

import { requireRole } from "@/lib/server/rbac";
import { toPublicUser } from "@/lib/server/user";
import { AppShell } from "./app-shell";
import { NavItem } from "@/types";

/**
 * Server-side authenticated layout (spec §8/§9): verifies the role before
 * rendering any screen. The middleware is a UX layer; this layout is the real
 * server-side enforcement.
 */
export default async function AuthShell({
  role,
  roleLabel,
  navItems,
  children,
}: {
  role: Role;
  roleLabel: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  let user = null;
  try {
    user = await requireRole(role);
  } catch {
    redirect("/login");
  }

  return (
    <AppShell user={toPublicUser(user)} roleLabel={roleLabel} navItems={navItems}>
      {children}
    </AppShell>
  );
}