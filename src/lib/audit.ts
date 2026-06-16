import { prisma } from "./db";

export type AuditAction = "CREATE" | "UPDATE" | "STOCK_ADJUST" | "DELETE";

export async function logAudit(opts: {
  action: AuditAction;
  entity: string;
  entityId: string;
  entityName?: string | null;
  entitySku?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actor?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        entityName: opts.entityName ?? null,
        entitySku: opts.entitySku ?? null,
        before: opts.before ? JSON.stringify(opts.before) : null,
        after: opts.after ? JSON.stringify(opts.after) : null,
        actor: opts.actor ?? "admin",
      },
    });
  } catch {
    // Never let audit failure break the main operation
  }
}
