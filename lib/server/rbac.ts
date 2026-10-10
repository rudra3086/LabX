import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { readSession } from "./session";
import { ApiError } from "./http";

export async function getCurrentUser() {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      student: true,
      faculty: true,
    },
  });
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("Authentication required.", 401, "AUTH_REQUIRED");
  }
  if (user.status !== "ACTIVE") {
    throw new ApiError("Your account is inactive.", 403, "FORBIDDEN");
  }
  return user;
}

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiError("You are not authorized to perform this action.", 403, "FORBIDDEN");
  }
  return user;
}