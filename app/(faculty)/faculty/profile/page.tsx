import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileView } from "@/components/identity/profile-view";
import { getCurrentUser } from "@/lib/server/rbac";

export const dynamic = "force-dynamic";

export default async function FacultyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your account and staff details."
      />
      <ProfileView user={user} />
    </div>
  );
}