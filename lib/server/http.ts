import { NextResponse } from "next/server";

// Consistent API envelope per spec §84.
export interface ApiErrorBody {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[] | undefined>;

  constructor(
    message: string,
    status = 400,
    code = "BAD_REQUEST",
    fieldErrors?: Record<string, string[] | undefined>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

export function jsonSuccess<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    { success: true, data, ...(message ? { message } : {}) },
    { status }
  );
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[] | undefined>
) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } },
    { status }
  );
}

export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return jsonError(err.status, err.code, err.message, err.fieldErrors);
  }
  console.error("[api] unexpected error", err);
  return jsonError(500, "INTERNAL_ERROR", "An unexpected error occurred.");
}

/**
 * Maps a Prisma unique-constraint error to a friendly 409 response (spec §52:
 * emails, student IDs, faculty IDs and roll numbers must be unique).
 */
export function prismaConflict(err: unknown, fields: Record<string, string>) {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "P2002"
  ) {
    const target = (err as { meta?: { target?: unknown } }).meta?.target;
    const key = Array.isArray(target) && typeof target[0] === "string" ? target[0] : "unknown";
    return new ApiError(
      fields[key] ?? "A record with these details already exists.",
      409,
      "CONFLICT",
      { [key]: [fields[key] ?? "Already exists"] }
    );
  }
  return err;
}