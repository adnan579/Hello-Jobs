import { db } from "./db";

export const AUDIT = {
  LOGIN: "LOGIN",
  WORKER_APPLIED: "WORKER_APPLIED",
  CONTACT_REVEALED_ON_INVITE: "CONTACT_REVEALED_ON_INVITE",
  STAGE_CHANGED: "STAGE_CHANGED",
  JOB_STATUS_CHANGED: "JOB_STATUS_CHANGED",
  KYB_SUBMITTED: "KYB_SUBMITTED",
  KYB_REVIEWED: "KYB_REVIEWED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  ADMIN_CREATED: "ADMIN_CREATED",
} as const;
export type AuditAction = (typeof AUDIT)[keyof typeof AUDIT];

export type AuditEntry = {
  actorId?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  /** IDs, enums and counts only. Never phone numbers, names or other personal data. */
  metadata?: Record<string, string | number | boolean | null>;
};

/**
 * Write an audit entry. Pass a transaction client to make the entry commit or
 * roll back together with the action it describes.
 */
export async function audit(entry: AuditEntry, client: Pick<typeof db, "auditLog"> = db): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? undefined,
    },
  });
}
