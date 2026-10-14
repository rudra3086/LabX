"use client";

import { useState } from "react";
import { CheckCircle2, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ResetPasswordDialog({
  name,
  endpoint,
  open,
  onClose,
}: {
  name: string;
  endpoint: string;
  open: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const close = () => {
    if (!busy) {
      setTemporaryPassword(null);
      setError(null);
      setCopied(false);
      onClose();
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const body = await response.json();
      if (!response.ok || !body.success) {
        setError(body.error?.message ?? "Could not reset the password.");
        return;
      }
      setTemporaryPassword(body.data.temporaryPassword);
    } catch {
      setError("Network error while resetting the password.");
    } finally {
      setBusy(false);
    }
  };

  if (temporaryPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40" onClick={close} aria-hidden="true" />
        <div role="dialog" aria-modal="true" className="relative w-full max-w-sm rounded-fluentLg border border-surface-200 bg-white p-5 shadow-elevated">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-surface-900">Temporary password generated</h2>
              <p className="mt-1 text-sm leading-relaxed text-surface-500">
                Share this password with {name}. It will not be shown again.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-surface-200 bg-surface-50 px-3 py-2">
            <code className="font-mono text-sm font-medium text-navy-800">{temporaryPassword}</code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(temporaryPassword);
                setCopied(true);
              }}
            >
              <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="mt-5 flex justify-end">
            <Button variant="primary" size="sm" onClick={close}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ConfirmDialog
      open={open}
      title={`Reset ${name}'s password?`}
      description={
        error
          ? error
          : "The existing password will stop working immediately. A new temporary password will be shown once."
      }
      confirmLabel="Reset password"
      tone="default"
      busy={busy}
      onCancel={close}
      onConfirm={() => void reset()}
    />
  );
}
