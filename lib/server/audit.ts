import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Non-fatal audit trail (spec §54). Logging failures must never break the
 * originating request, so errors are swallowed.
 */
export async function recordAudit(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const metadata =
    input.metadata === undefined || input.metadata === null
      ? Prisma.JsonNull
      : (input.metadata as Prisma.InputJsonValue);

  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", input.action, err);
  }
}