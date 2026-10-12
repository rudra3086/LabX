"use client";

import { useEffect } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40"
        onClick={busy ? undefined : onCancel}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-fluentLg border border-surface-200 bg-white p-5 shadow-elevated"
      >
        <div className="flex items-start gap-3">
          <span
            className={
              tone === "danger"
                ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600"
                : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-100 text-surface-500"
            }
          >
            <TriangleAlert className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-surface-900">{title}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-surface-500">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "destructive" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={busy}
            leftIcon={busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}