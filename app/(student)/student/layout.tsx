import AuthShell from "@/components/layout/auth-shell";
import { NAV_STUDENT } from "@/lib/navigation";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell role="STUDENT" roleLabel="Student" navItems={NAV_STUDENT}>
      {children}
    </AuthShell>
  );
}