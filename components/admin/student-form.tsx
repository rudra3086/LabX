"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CheckCircle2, Copy } from "lucide-react";
import { studentUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import type { StudentListItem, SubjectListItem } from "@/lib/server/services/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export function StudentForm({
  initial,
  subjects,
}: {
  initial?: StudentListItem;
  subjects: Pick<SubjectListItem, "id" | "code" | "name" | "semester" | "department">[];
}) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [studentId, setStudentId] = useState(initial?.studentId ?? "");
  const [rollNumber, setRollNumber] = useState(initial?.rollNumber ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [semester, setSemester] = useState(String(initial?.semester ?? 1));
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [batch, setBatch] = useState(initial?.batch ?? "");
  const [subjectIds, setSubjectIds] = useState<string[]>(
    initial?.subjects.map((subject) => subject.subjectId) ?? []
  );
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initial?.status ?? "ACTIVE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

    const parsed = studentUpsertSchema.safeParse({
      studentId,
      rollNumber,
      name,
      email,
      semester,
      department,
      batch,
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
      const url = editing ? `/api/admin/students/${initial!.id}` : "/api/admin/students";
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
      router.push("/admin/students");
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
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">Student account created</h2>
            <p className="mt-1 text-sm leading-relaxed text-surface-500">
              Share the one-time temporary password below. The student should change it after first
              sign-in.
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
          <ButtonLink href="/admin/students" variant="outline">
            Back to students
          </ButtonLink>
          <ButtonLink href="/admin/students/create" variant="primary">
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
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {formError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full name"
          placeholder="Rudra Patel"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />

        <Input
          label="Email"
          type="email"
          placeholder="student@institution.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          helperText={editing ? undefined : "Used to sign in with the temporary password."}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Student ID"
          placeholder="24CS001"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          error={fieldErrors.studentId}
        />
        <Input
          label="Roll number"
          placeholder="24CS001"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          error={fieldErrors.rollNumber}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          options={SEMESTER_OPTIONS}
          error={fieldErrors.semester}
        />
        <div className="sm:col-span-2">
          <Input
            label="Department"
            placeholder="CSE"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            error={fieldErrors.department}
          />
        </div>
      </div>

      <Input
        label="Batch"
        placeholder="2024-2028 CSE-A"
        value={batch}
        onChange={(e) => setBatch(e.target.value)}
        error={fieldErrors.batch}
        helperText="Optional — shown to faculty to group the same cohort."
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-900">Assigned subjects</legend>
        <p className="text-xs text-surface-500">
          Faculty will only see this student when creating a session for one of these subjects.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex items-start gap-2 rounded-md border border-surface-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={subjectIds.includes(subject.id)}
                onChange={(event) =>
                  setSubjectIds((current) =>
                    event.target.checked
                      ? [...current, subject.id]
                      : current.filter((id) => id !== subject.id)
                  )
                }
              />
              <span>
                <span className="font-medium text-slate-900">{subject.code}</span>
                <span className="ml-1 text-surface-500">{subject.name}</span>
                <span className="block text-xs text-surface-400">
                  Semester {subject.semester} · {subject.department}
                </span>
              </span>
            </label>
          ))}
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
        <ButtonLink href="/admin/students" variant="outline">
          Cancel
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {editing ? "Save changes" : "Create student account"}
        </Button>
      </div>
    </form>
  );
}