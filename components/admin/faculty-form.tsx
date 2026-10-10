"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CheckCircle2, Copy } from "lucide-react";
import { facultyUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import type { FacultyListItem } from "@/lib/server/services/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export interface AssignableSubject {
  id: string;
  code: string;
  name: string;
}

export function FacultyForm({
  initial,
  subjects,
}: {
  initial?: FacultyListItem;
  subjects: AssignableSubject[];
}) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [employeeId, setEmployeeId] = useState(initial?.employeeId ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [designation, setDesignation] = useState(initial?.designation ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(
    initial?.subjects.map((s) => s.subjectId) ?? []
  );
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initial?.status ?? "ACTIVE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleSubject = (id: string) => {
    setSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const copyPassword = async () => {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = facultyUpsertSchema.safeParse({
      name,
      employeeId,
      email,
      department,
      designation,
      subjectIds,
    });
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(zodFieldErrors(parsed.error))) {
        if (v?.length) flat[k] = v[0];
      }
      setFieldErrors(flat);
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editing ? `/api/admin/faculty/${initial!.id}` : "/api/admin/faculty";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, ...(editing ? { status } : {}) }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFormError(body.error?.message ?? "Save failed. Please try again.");
        if (body.error?.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(body.error.fieldErrors as Record<string, string[] | undefined>)) {
            if (v?.length) flat[k] = v[0];
          }
          setFieldErrors(flat);
        }
        return;
      }
      if (!editing && body.data.tempPassword) {
        setTempPassword(body.data.tempPassword as string);
        return;
      }
      router.push("/admin/faculty");
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tempPassword) {
    return (
      <div className="max-w-xl rounded-lg border border-surface-200 bg-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Faculty account created</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-surface-500">
              Share the one-time temporary password below. The faculty member should change it after
              first sign-in.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-surface-200 bg-surface-50 px-4 py-3">
          <code className="font-mono text-sm font-medium text-navy-800">{tempPassword}</code>
          <Button variant="outline" size="sm" onClick={() => void copyPassword()}>
            <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-surface-100 pt-5">
          <ButtonLink href="/admin/faculty" variant="outline">
            Back to faculty
          </ButtonLink>
          <ButtonLink href="/admin/faculty/create" variant="primary">
            Add another
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-2xl space-y-5 rounded-lg border border-surface-200 bg-white p-6 shadow-card"
    >
      {formError && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {formError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          placeholder="Prof. Priya Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <Input
          label="Employee ID"
          placeholder="EMP1024"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          error={fieldErrors.employeeId}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="faculty@institution.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        helperText={editing ? undefined : "Used to sign in with the temporary password."}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Department"
          placeholder="CSE"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          error={fieldErrors.department}
        />
        <Input
          label="Designation"
          placeholder="Assistant Professor"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          error={fieldErrors.designation}
        />
      </div>

      <fieldset>
        <legend className="block text-[13px] font-medium text-slate-700">
          Assigned subjects
        </legend>
        <p className="mt-0.5 text-xs text-surface-500">
          Faculty can manage practical sessions and tasks for these subjects.
        </p>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-md border border-surface-200 p-2">
          {subjects.length === 0 ? (
            <p className="px-2 py-2 text-xs text-surface-400">
              No active subjects yet — create subjects first.
            </p>
          ) : (
            <div className="grid gap-0.5 sm:grid-cols-2">
              {subjects.map((s) => {
                const checked = subjectIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSubject(s.id)}
                      className="h-4 w-4 rounded border-surface-300 accent-navy-800"
                    />
                    <span className="min-w-0 truncate text-[13px] text-slate-800">
                      <span className="font-mono text-xs text-navy-700">{s.code}</span>{" "}
                      <span className="text-surface-500">{s.name}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </fieldset>

      {editing && (
        <div className="w-full sm:w-56">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-surface-100 pt-5">
        <ButtonLink href="/admin/faculty" variant="outline">
          Cancel
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {editing ? "Save changes" : "Create faculty account"}
        </Button>
      </div>
    </form>
  );
}