"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { loginSchema } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";

const ROLE_HOME = {
  ADMIN: "/admin/dashboard",
  FACULTY: "/faculty/dashboard",
  STUDENT: "/student/dashboard",
} as const;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        flat[issue.path[0]] = issue.message;
      }
      setFieldErrors(flat);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setFormError(body.error?.message ?? "Unable to log in. Please try again.");
        return;
      }

      const role = body.data.user.role as keyof typeof ROLE_HOME;
      const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : ROLE_HOME[role];
      router.replace(safeNext);
      router.refresh();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
      <div className="h-1 w-full bg-navy-600" />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-4">
            <BrandMark withWordmark={false} />
            <div className="text-center">
              <h1 className="text-xl font-semibold tracking-tight text-surface-900">SmartLab</h1>
              <p className="mt-1 text-sm text-surface-500">
                Academic practical management for students and faculty
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-fluentLg border border-surface-200 bg-white p-6 shadow-elevated"
          >
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fieldErrors.email}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
              />
            </div>

            {formError && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700"
              >
                {formError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-5 w-full"
              isLoading={isSubmitting}
              rightIcon={!isSubmitting ? <LogIn className="h-4 w-4" /> : undefined}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-5 rounded-md border border-surface-200 bg-surface-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-surface-400">
              Development demo accounts
            </p>
            <div className="mt-2 space-y-0.5 text-xs leading-relaxed text-surface-500">
              <p>admin@smartlab.dev · faculty.ds@smartlab.dev · student01@smartlab.dev</p>
              <p>
                Password: <span className="font-mono font-medium text-slate-600">password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-surface-400">
        SmartLab · Academic Practical Work Platform
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#F5F5F5]">
          <div className="h-1 w-full bg-navy-600" />
          <div className="flex flex-1 items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
              <div className="mb-8 flex flex-col items-center gap-4">
                <BrandMark withWordmark={false} />
                <div className="text-center">
                  <h1 className="text-xl font-semibold tracking-tight text-surface-900">SmartLab</h1>
                </div>
              </div>
              <div className="animate-pulse space-y-4 rounded-fluentLg border border-surface-200 bg-white p-6 shadow-elevated">
                <div className="h-8 rounded-md bg-surface-100" />
                <div className="h-8 rounded-md bg-surface-100" />
                <div className="h-10 rounded-md bg-surface-100" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}