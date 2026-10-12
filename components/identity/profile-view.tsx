import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initialsFor } from "@/components/layout/brand-mark";
import type { CurrentUser } from "@/lib/server/rbac";
import { roleLabel } from "@/lib/utils";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-surface-500">{label}</dt>
      <dd className="text-sm font-medium text-surface-900">{value || "—"}</dd>
    </div>
  );
}

function RoleDetails({ user }: { user: CurrentUser }) {
  if (user.role === "STUDENT") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-surface-100">
            <DetailRow label="Student ID" value={user.student?.studentId} />
            <DetailRow label="Roll number" value={user.student?.rollNumber} />
            <DetailRow label="Semester" value={String(user.student?.semester ?? "")} />
            <DetailRow label="Batch" value={user.student?.batch} />
          </dl>
        </CardContent>
      </Card>
    );
  }
  if (user.role === "FACULTY") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-surface-100">
            <DetailRow label="Employee ID" value={user.faculty?.employeeId} />
            <DetailRow label="Department" value={user.faculty?.department} />
            <DetailRow label="Designation" value={user.faculty?.designation} />
          </dl>
        </CardContent>
      </Card>
    );
  }
  return null;
}

export function ProfileView({ user }: { user: CurrentUser }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-600 text-2xl font-semibold text-white">
            {initialsFor(user.name)}
          </span>
          <div>
            <h2 className="text-base font-semibold text-surface-900">{user.name}</h2>
            <p className="mt-0.5 text-sm text-surface-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="navy">{roleLabel(user.role)}</Badge>
            <Badge variant={user.status === "ACTIVE" ? "emerald" : "rose"}>
              {user.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-surface-100">
              <DetailRow label="Full name" value={user.name} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Role" value={roleLabel(user.role)} />
              <DetailRow
                label="Department"
                value={user.department ?? user.faculty?.department ?? user.role === "ADMIN" ? "Administration" : undefined}
              />
              <DetailRow
                label="Member since"
                value={user.createdAt.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </dl>
          </CardContent>
        </Card>

        <RoleDetails user={user} />
      </div>
    </div>
  );
}