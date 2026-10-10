import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/server/prisma";
import { verifyPassword } from "@/lib/server/password";
import { createSession } from "@/lib/server/session";
import { handleApiError, jsonError, jsonSuccess } from "@/lib/server/http";
import { toPublicUser } from "@/lib/server/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = flattenZodErrors(parsed.error);
      return jsonError(
        422,
        "VALIDATION_ERROR",
        "Please fix the errors in the form.",
        fieldErrors
      );
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: { student: true, faculty: true },
    });

    if (!user) {
      // Uniform failure message: do not reveal whether the email exists.
      return jsonError(401, "UNAUTHORIZED", "Invalid email or password.");
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return jsonError(401, "UNAUTHORIZED", "Invalid email or password.");
    }

    if (user.status !== "ACTIVE") {
      return jsonError(
        403,
        "FORBIDDEN",
        "Your account is inactive. Please contact the administrator."
      );
    }

    await createSession(user.id, user.role);
    return jsonSuccess(
      { user: toPublicUser(user) },
      "Logged in successfully."
    );
  } catch (err) {
    return handleApiError(err);
  }
}

function flattenZodErrors(error: ZodError): Record<string, string[]> {
  const flat: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    flat[key] = flat[key] ?? [];
    flat[key].push(issue.message);
  }
  return flat;
}