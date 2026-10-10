import AuthShell from "@/components/layout/auth-shell";
import { NAV_FACULTY } from "@/lib/navigation";

export default function FacultyLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthShell role="FACULTY" roleLabel="Faculty" navItems={NAV_FACULTY}>
      {children}
    </AuthShell>
  );
}