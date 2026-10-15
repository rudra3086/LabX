"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { sessionUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { getTodayDateInput } from "@/lib/date";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export interface SessionFormSubject {
  subjectId: string;
  code: string;
  name: string;
  semester: number;
}

export interface SessionFormInitial {
  id: string;
  subjectId: string;
  name: string;
  semester: number;
  batch: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

const SEMESTER_OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: String(i + 1),
  label: `Semester ${i + 1}`,
}));

export function SessionForm({
  subjects,
  initial,
  defaultSubjectId,
}: {
  subjects: SessionFormSubject[];
  initial?: SessionFormInitial;
  defaultSubjectId?: string;
}) {
  const router = useRouter();
  const editing = Boolean(initial);

  const firstSubject =
    subjects.find((s) => s.subjectId === defaultSubjectId) ?? subjects[0];

  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? firstSubject?.subjectId ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [semester, setSemester] = useState(
    String(initial?.semester ?? firstSubject?.semester ?? 1)
  );
  const [batch, setBatch] = useState(initial?.batch ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ? initial.startDate.slice(0, 10) : "");
  const [endDate, setEndDate] = useState(initial?.endDate ? initial.endDate.slice(0, 10) : "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubjectChange = (value: string) => {
    setSubjectId(value);
    if (!editing) {
      const subject = subjects.find((s) => s.subjectId === value);
      if (subject) setSemester(String(subject.semester));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = sessionUpsertSchema.safeParse({
      subjectId,
      name,
      semester,
      batch,
      startDate,
      endDate,
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
      const url = editing
        ? `/api/faculty/sessions/${initial!.id}`
        : "/api/faculty/sessions";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFormError(body.error?.message ?? "Save failed. Please try again.");
        if (body.error?.fieldErrors) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(
            body.error.fieldErrors as Record<string, string[] | undefined>
          )) {
            if (v?.length) flat[k] = v[0];
          }
          setFieldErrors(flat);
        }
        return;
      }
      const id = editing ? initial!.id : body.data?.session?.id;
      router.push(id ? `/faculty/sessions/${id}` : "/faculty/sessions");
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="max-w-2xl rounded-lg border border-surface-200 bg-white p-6 shadow-card">
        <p className="text-sm font-semibold text-slate-800">No subjects assigned</p>
        <p className="mt-1 text-sm text-surface-500">
          You need at least one subject before you can create a practical session.
          Ask an administrator to assign you a subject.
        </p>
        <div className="mt-4">
          <ButtonLink href="/faculty/sessions" variant="outline">
            Back to sessions
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
        <Select
          label="Subject"
          value={subjectId}
          onChange={(e) => handleSubjectChange(e.target.value)}
          options={subjects.map((s) => ({
            value: s.subjectId,
            label: `${s.code} — ${s.name}`,
          }))}
          error={fieldErrors.subjectId}
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
        label="Session name"
        placeholder="DBMS Lab — Batch A"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={fieldErrors.name}
      />

      <Input
        label="Batch"
        placeholder="2025-2026 / A"
        value={batch}
        onChange={(e) => setBatch(e.target.value)}
        error={fieldErrors.batch}
        helperText="Optional. Helps distinguish parallel lab groups."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          type="date"
          label="Start date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          error={fieldErrors.startDate}
        />
        <Input
          type="date"
          label="End date"
          value={endDate}
          min={getTodayDateInput()}
          onChange={(e) => setEndDate(e.target.value)}
          error={fieldErrors.endDate}
        />
      </div>

      <Textarea
        label="Description"
        placeholder="What will students cover in this practical session?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description}
        rows={4}
      />

      <div className="flex items-center justify-end gap-2 border-t border-surface-100 pt-5">
        <ButtonLink
          href={editing ? `/faculty/sessions/${initial!.id}` : "/faculty/sessions"}
          variant="outline"
        >
          Cancel
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {editing ? "Save changes" : "Create session"}
        </Button>
      </div>
    </form>
  );
}