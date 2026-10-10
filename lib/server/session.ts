import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

export const SESSION_COOKIE = "smartlab_session";

export interface SessionPayload {
  sub: string; // user id
  role: Role;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET ?? "dev-only-insecure-secret";
  return new TextEncoder().encode(secret);
}

function sessionTtlHours(): number {
  const raw = Number(process.env.AUTH_SESSION_TTL_HOURS);
  return Number.isFinite(raw) && raw > 0 ? raw : 12;
}

export async function createSession(userId: string, role: Role): Promise<void> {
  const ttlHours = sessionTtlHours();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.role) return null;
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}