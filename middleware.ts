import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { Role } from "@prisma/client";

const SESSION_COOKIE = "smartlab_session";

const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  FACULTY: "/faculty/dashboard",
  STUDENT: "/student/dashboard",
};

const PROTECTED_PREFIXES: Record<Role, string[]> = {
  ADMIN: ["/admin"],
  FACULTY: ["/faculty"],
  STUDENT: ["/student"],
};

function getSecret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-only-insecure-secret"
  );
}

async function verifyToken(token: string): Promise<{ sub: string; role: Role } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.role) return null;
    const role = payload.role as Role;
    if (!(role in ROLE_HOME)) return null;
    return { sub: payload.sub, role };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/api");

  if (isPublic) {
    // Logged-in users visiting /login should go straight to their dashboard.
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedPrefixes = PROTECTED_PREFIXES[session.role];
  const inArea = allowedPrefixes.some((p) => pathname.startsWith(p));

  if (pathname === "/") {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  if (!inArea) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};