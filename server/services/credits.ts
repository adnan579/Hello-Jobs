import crypto from 'node:crypto';
import type { Queryable } from '../db.ts';
import { newId } from '../lib/ids.ts';
import { audit } from '../lib/audit.ts';

export const GST_PERCENT = 18;

/** Prices are owned by the server. The browser can only choose a pack id. */
export const PACKS = {
  PACK_10: { credits: 10, basePaise: 99_900, label: 'Starter Shift Pack (10 Credits)' },
  PACK_25: { credits: 25, basePaise: 199_900, label: 'Plant Growth Pack (25 Credits)' },
  PACK_100: { credits: 100, basePaise: 599_900, label: 'Multi-Plant Enterprise (100 Credits)' },
} as const;
export type PackId = keyof typeof PACKS;

export function packTotalPaise(id: PackId): number {
  const base = PACKS[id].basePaise;
  return base + Math.round((base * GST_PERCENT) / 100);
}

export const TRIAL_CREDITS = 3;

function financialYear(d = new Date()): string {
  const ist = new Date(d.getTime() + 5.5 * 3_600_000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

export function verifyRazorpayPaymentSignature(orderId: string, paymentId: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyRazorpayWebhookSignature(rawBody: Buffer, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Credits an order exactly once. Safe to call from the browser confirmation AND the webhook:
 * only the call that flips status created -> paid adds credits.
 */
export async function fulfilOrder(q: Queryable, orderId: string, providerPaymentId: string | null): Promise<{ fulfilled: boolean; invoiceNo?: string }> {
  const upd = await q.query(
    `UPDATE payment_orders SET status = 'paid', provider_payment_id = $2, paid_at = now()
      WHERE id = $1 AND status = 'created' RETURNING *`,
    [orderId, providerPaymentId]
  );
  const order = upd.rows[0];
  if (!order) return { fulfilled: false };

  const emp = (await q.query('SELECT hunt_credits, gstin, company_name FROM employers WHERE id = $1 FOR UPDATE', [order.employer_id])).rows[0];
  const balance = emp.hunt_credits + order.credits;
  await q.query('UPDATE employers SET hunt_credits = $2, updated_at = now() WHERE id = $1', [order.employer_id, balance]);
  const seq = (await q.query<{ n: number }>("SELECT nextval('invoice_seq')::int AS n")).rows[0].n;
  const invoiceNo = `HJ/${financialYear()}/${String(seq).padStart(6, '0')}`;
  const pack = PACKS[order.pack_id as PackId];
  await q.query(
    `INSERT INTO credit_ledger (id, employer_id, change, reason, reference, balance_after, invoice_no, amount_inr)
     VALUES ($1,$2,$3,'CREDIT_PACK_PURCHASE',$4,$5,$6,$7)`,
    [newId('led'), order.employer_id, order.credits, `${pack?.label ?? order.pack_id} · GSTIN ${emp.gstin ?? ''}`, balance, invoiceNo, Number(order.amount_paise) / 100]
  );
  await audit(q, { principalId: order.employer_id, principalName: emp.company_name, action: 'CREDITS_PURCHASED', details: `${order.credits} credits, invoice ${invoiceNo}, provider ${order.provider}` });
  return { fulfilled: true, invoiceNo };
}

export async function grantTrialCredits(q: Queryable, employerId: string): Promise<void> {
  const already = await q.query(`SELECT 1 FROM credit_ledger WHERE employer_id = $1 AND reason = 'PILOT_TRIAL_GRANT'`, [employerId]);
  if (already.rowCount) return;
  const e = (await q.query('SELECT hunt_credits FROM employers WHERE id = $1 FOR UPDATE', [employerId])).rows[0];
  const balance = e.hunt_credits + TRIAL_CREDITS;
  await q.query('UPDATE employers SET hunt_credits = $2 WHERE id = $1', [employerId, balance]);
  await q.query(
    `INSERT INTO credit_ledger (id, employer_id, change, reason, reference, balance_after) VALUES ($1,$2,$3,'PILOT_TRIAL_GRANT',$4,$5)`,
    [newId('led'), employerId, TRIAL_CREDITS, 'Welcome credits for your verified factory', balance]
  );
}
