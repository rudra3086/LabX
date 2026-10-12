"use client";

import { useState } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RunRemindersButton() {
  const [result, setResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/jobs/reminders", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setResult({ kind: "error", message: body.error?.message ?? "Reminder pass failed." });
        return;
      }
      setResult({
        kind: "success",
        message: `Reminder pass complete: ${body.data.reminders} reminders, ${body.data.missed} missed-deadline notices queued.`,
      });
    } catch {
      setResult({ kind: "error", message: "Network error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        size="md"
        onClick={() => void run()}
        disabled={busy}
        leftIcon={
          busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BellRing className="h-4 w-4" />
          )
        }
      >
        {busy ? "Running..." : "Run deadline reminders"}
      </Button>
      {result && (
        <p
          role="status"
          className={
            result.kind === "success"
              ? "text-sm text-emerald-700"
              : "text-sm text-rose-700"
          }
        >
          {result.message}
        </p>
      )}
    </div>
  );
}