"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { taskUpsertSchema, zodFieldErrors } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export interface TaskFormInitial {
  id: string;
  sessionId: string;
  title: string;
  description: string | null;
  instructions: string | null;
  maximumMarks: number;
  deadline: string | null;
  allowLateSubmission: boolean;
  submissionFormat: string | null;
  fileNamingConvention: string | null;
  requiredFileTypes: string | null;
}

/** ISO string → value for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function TaskForm({
  sessionId,
  sessionLabel,
  initial,
}: {
  sessionId: string;
  sessionLabel: string;
  initial?: TaskFormInitial;
}) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [maximumMarks, setMaximumMarks] = useState(String(initial?.maximumMarks ?? 10));
  const [deadline, setDeadline] = useState(toLocalInput(initial?.deadline ?? null));
  const [allowLateSubmission, setAllowLateSubmission] = useState(
    initial?.allowLateSubmission ?? true
  );
  const [submissionFormat, setSubmissionFormat] = useState(initial?.submissionFormat ?? "");
  const [fileNamingConvention, setFileNamingConvention] = useState(
    initial?.fileNamingConvention ?? ""
  );
  const [requiredFileTypes, setRequiredFileTypes] = useState(
    initial?.requiredFileTypes ?? ""
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = taskUpsertSchema.safeParse({
      title,
      description,
      instructions,
      maximumMarks,
      deadline,
      allowLateSubmission,
      submissionFormat,
      fileNamingConvention,
      requiredFileTypes,
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
      const url = editing ? `/api/faculty/tasks/${initial!.id}` : "/api/faculty/tasks";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing ? parsed.data : { sessionId, ...parsed.data }
        ),
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
      const id = editing ? initial!.id : body.data?.task?.id;
      router.push(id ? `/faculty/tasks/${id}` : `/faculty/sessions/${sessionId}/tasks`);
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-3xl space-y-5 rounded-lg border border-surface-200 bg-white p-6 shadow-card"
    >
      {formError && (
        <p
          role="alert"
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
        >
          <CircleAlert className="h-3.5 w-3.5" /> {formError}
        </p>
      )}

      <p className="text-sm text-surface-500">
        Session: <span className="font-medium text-slate-700">{sessionLabel}</span>
      </p>

      <Input
        label="Task title"
        placeholder="Normalize a relational schema to 3NF"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={fieldErrors.title}
      />

      <Textarea
        label="Short description"
        placeholder="One or two lines summarising the practical task."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={fieldErrors.description}
        rows={3}
      />

      <Textarea
        label="Instructions"
        placeholder="Objective, problem statement, requirements, expected output…"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        error={fieldErrors.instructions}
        rows={8}
        helperText="Detailed instructions students must read before submitting (spec §18)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          type="number"
          min={1}
          step="0.5"
          label="Maximum marks"
          value={maximumMarks}
          onChange={(e) => setMaximumMarks(e.target.value)}
          error={fieldErrors.maximumMarks}
        />
        <Input
          type="datetime-local"
          label="Deadline"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          error={fieldErrors.deadline}
          helperText="Leave empty if there is no deadline."
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={allowLateSubmission}
          onChange={(e) => setAllowLateSubmission(e.target.checked)}
          className="h-4 w-4 rounded border-surface-300 text-navy-700 focus:ring-navy-600"
        />
        Allow late submissions (marked as late)
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Submission format"
          placeholder="Single PDF report + source zip"
          value={submissionFormat}
          onChange={(e) => setSubmissionFormat(e.target.value)}
          error={fieldErrors.submissionFormat}
        />
        <Input
          label="File naming convention"
          placeholder="RollNo_TaskTitle.pdf"
          value={fileNamingConvention}
          onChange={(e) => setFileNamingConvention(e.target.value)}
          error={fieldErrors.fileNamingConvention}
        />
      </div>

      <Input
        label="Required file types"
        placeholder=".pdf, .zip, .sql"
        value={requiredFileTypes}
        onChange={(e) => setRequiredFileTypes(e.target.value)}
        error={fieldErrors.requiredFileTypes}
        helperText="Comma-separated list of accepted extensions."
      />

      <div className="flex items-center justify-end gap-2 border-t border-surface-100 pt-5">
        <ButtonLink
          href={
            editing
              ? `/faculty/tasks/${initial!.id}`
              : `/faculty/sessions/${sessionId}/tasks`
          }
          variant="outline"
        >
          Cancel
        </ButtonLink>
        <Button type="submit" isLoading={isSubmitting}>
          {editing ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}