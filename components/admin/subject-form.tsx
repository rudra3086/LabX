"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { subjectUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import type { SubjectListItem } from "@/lib/server/services/admin";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export function SubjectForm({ initial }: { initial?: SubjectListItem }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [semester, setSemester] = useState(String(initial?.semester ?? 1));
  const [department, setDepartment] = useState(initial?.department ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(initial?.status ?? "ACTIVE");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = subjectUpsertSchema.safeParse({
      code,
      name,
      semester,
      department,
      description,
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
      const url = editing ? `/api/admin/subjects/${initial!.id}` : "/api/admin/subjects";
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
      router.push("/admin/subjects");
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-5 rounded-lg border border-surface-200 bg-white p-6 shadow-card">
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
          label="Subject code"
          placeholder="CS301"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={fieldErrors.code}
          autoComplete="off"
          helperText="Short, unique code — shown to faculty and students."
        />
        <Select
          label="Semester"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          options={SEMESTER_OPTIONS}
          error={fieldErrors.semester}
        />
      </div>

      <Input
        label="Subject name"
        placeholder="Database Management System"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />

      <Input
        label="Department"
        placeholder="CSE"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        error={fieldErrors.department}
      />

      <Textarea
        label="Description"
        placeholder="Briefly describe the practical scope of this subject."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description}
        rows={4}
      />

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
        <ButtonLink href="/admin/subjects" variant="outline">
          Cancel
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {editing ? "Save changes" : "Create subject"}
        </Button>
      </div>
    </form>
  );
}