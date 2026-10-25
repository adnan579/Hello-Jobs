import type { Queryable } from '../db.ts';
import type { DpdpAuditLog } from '../../src/types/index.ts';

export async function audit(
  q: Queryable,
  e: { actorAccountId?: string; principalId: string; principalName: string; action: DpdpAuditLog['action'] | string; details: string; ip?: string }
): Promise<void> {
  await q.query(
    `INSERT INTO audit_logs (actor_account_id, principal_id, principal_name, action, details, ip)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [e.actorAccountId ?? null, e.principalId, e.principalName, e.action, e.details, e.ip ?? null]
  );
}

export async function notify(
  q: Queryable,
  n: { role: 'worker' | 'employer'; recipientId: string; eventType: string; title: string; body: string }
): Promise<void> {
  const { newId } = await import('./ids.ts');
  await q.query(
    `INSERT INTO notifications (id, recipient_role, recipient_id, event_type, title, body)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [newId('notif'), n.role, n.recipientId, n.eventType, n.title, n.body]
  );
}
