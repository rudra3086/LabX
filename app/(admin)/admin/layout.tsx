import AuthShell from "@/components/layout/auth-shell";
import { NAV_ADMIN } from "@/lib/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell role="ADMIN" roleLabel="Administrator" navItems={NAV_ADMIN}>
      {children}
    </AuthShell>
  );
}