import { Router } from 'express';
import { wrap, parse } from '../lib/http.ts';
import { packInput, paymentConfirm, unlockInput } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerWriter } from '../lib/guards.ts';
import { HttpError, badRequest, forbidden, notFound } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { audit, notify } from '../lib/audit.ts';
import { respond } from '../lib/respond.ts';
import { PACKS, fulfilOrder, packTotalPaise, verifyRazorpayPaymentSignature, verifyRazorpayWebhookSignature } from '../services/credits.ts';

export const creditsRouter = Router();

creditsRouter.post(
  '/credits/unlock-candidate',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const { candidateId } = parse(unlockInput, req.body);
    await req.ctx.db.tx(async (q) => {
      const emp = (await q.query('SELECT * FROM employers WHERE id = $1 FOR UPDATE', [eid])).rows[0];
      if (emp.kyb_status !== 'VERIFIED' || emp.paused) throw forbidden('Your factory must be verified before you can unlock worker phone numbers.');
      const w = (await q.query('SELECT id, name, trade FROM workers WHERE id = $1 AND directory_visible', [candidateId])).rows[0];
      if (!w) throw notFound('Candidate not found.');
      const already = await q.query('SELECT 1 FROM contact_unlocks WHERE employer_id = $1 AND worker_id = $2', [eid, candidateId]);
      if (already.rowCount) return; // idempotent: never charge twice
      if (emp.hunt_credits < 1) throw new HttpError(402, 'You are out of Hunt Credits. Please buy a credit pack.');

      const balance = emp.hunt_credits - 1;
      await q.query('UPDATE employers SET hunt_credits = $2, updated_at = now() WHERE id = $1', [eid, balance]);
      await q.query(`INSERT INTO contact_unlocks (employer_id, worker_id, source) VALUES ($1,$2,'credit')`, [eid, candidateId]);
      await q.query(
        `INSERT INTO credit_ledger (id, employer_id, change, reason, reference, balance_after) VALUES ($1,$2,-1,'CANDIDATE_INVITE_UNLOCK',$3,$4)`,
        [newId('led'), eid, `Unlocked phone & invited ${w.name} (${w.trade})`, balance]
      );
      await notify(q, { role: 'worker', recipientId: w.id, eventType: 'INVITE_RECEIVED', title: `Factory invite from ${emp.company_name}`, body: `${emp.company_name} (${emp.data?.industrialHub ?? ''}) viewed your trade card and invited you to apply.` });
      await audit(q, { actorAccountId: req.auth!.accountId, principalId: w.id, principalName: w.name, action: 'CONTACT_UNLOCKED', details: `${emp.company_name} unlocked your phone number to contact you about a job.` });
    });
    await respond(req, res);
  })
);

async function createRazorpayOrder(req: any, orderId: string, amountPaise: number): Promise<{ id: string }> {
  const { razorpayKeyId, razorpayKeySecret } = req.ctx.config.payments;
  const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
  const r = await req.ctx.deps.fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: orderId, notes: { employer: req.auth.employerId } }),
  });
  if (!r.ok) {
    console.error('[payments] razorpay order failed', r.status, (await r.text().catch(() => '')).slice(0, 300));
    throw new HttpError(502, 'Payment provider is unavailable. Please try again.');
  }
  return (await r.json()) as { id: string };
}

creditsRouter.post(
  '/credits/purchase',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const { packId } = parse(packInput, req.body);
    const mode = req.ctx.config.payments.mode;
    if (mode === 'off') throw new HttpError(503, 'Online payments are not switched on yet. Please contact Hello Jobs to buy credits.');
    const emp = (await req.ctx.db.query('SELECT kyb_status FROM employers WHERE id = $1', [eid])).rows[0];
    if (emp.kyb_status !== 'VERIFIED') throw forbidden('Verify your factory before buying credits.');

    const orderId = newId('ord');
    const amountPaise = packTotalPaise(packId);
    const pack = PACKS[packId];
    let providerOrderId: string | null = null;
    if (mode === 'razorpay') providerOrderId = (await createRazorpayOrder(req, orderId, amountPaise)).id;
    await req.ctx.db.query(
      `INSERT INTO payment_orders (id, employer_id, pack_id, credits, amount_paise, provider, provider_order_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [orderId, eid, packId, pack.credits, amountPaise, mode, providerOrderId]
    );
    res.json({
      mode, orderId, packLabel: pack.label, amountPaise, currency: 'INR',
      ...(mode === 'razorpay' ? { razorpayOrderId: providerOrderId, keyId: req.ctx.config.payments.razorpayKeyId } : {}),
    });
  })
);

creditsRouter.post(
  '/credits/confirm',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const body = parse(paymentConfirm, req.body);
    const out = await req.ctx.db.tx(async (q) => {
      const order = (await q.query('SELECT * FROM payment_orders WHERE id = $1 AND employer_id = $2 FOR UPDATE', [body.orderId, eid])).rows[0];
      if (!order) throw notFound('Order not found.');
      if (order.status === 'paid') return { invoiceNo: undefined };
      if (order.provider === 'razorpay') {
        const secret = req.ctx.config.payments.razorpayKeySecret!;
        if (!body.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) throw badRequest('Missing payment details.');
        if (body.razorpay_order_id !== order.provider_order_id) throw badRequest('Payment does not match this order.');
        if (!verifyRazorpayPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature, secret)) throw badRequest('Payment could not be verified.');
        return fulfilOrder(q, order.id, body.razorpay_payment_id);
      }
      if (order.provider === 'demo' && req.ctx.config.payments.mode === 'demo') return fulfilOrder(q, order.id, `demo-${order.id}`);
      throw badRequest('This order cannot be confirmed.');
    });
    await respond(req, res, { invoiceNo: out.invoiceNo });
  })
);

// Razorpay -> server. No cookies; authenticity comes from the HMAC signature over the raw body.
export const webhookRouter = Router();
webhookRouter.post(
  '/webhooks/razorpay',
  wrap(async (req, res) => {
    const secret = req.ctx.config.payments.razorpayWebhookSecret;
    const sig = String(req.headers['x-razorpay-signature'] ?? '');
    const raw: Buffer | undefined = (req as any).rawBody;
    if (!secret || !raw || !sig || !verifyRazorpayWebhookSignature(raw, sig, secret)) return res.status(400).json({ error: 'Bad signature' });

    const event = req.body as any;
    if (event?.event === 'payment.captured' || event?.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      const providerOrderId: string | undefined = payment?.order_id ?? event.payload?.order?.entity?.id;
      if (providerOrderId) {
        await req.ctx.db.tx(async (q) => {
          const order = (await q.query('SELECT * FROM payment_orders WHERE provider_order_id = $1 FOR UPDATE', [providerOrderId])).rows[0];
          if (!order) return;
          if (payment?.amount != null && Number(payment.amount) !== Number(order.amount_paise)) {
            console.error('[payments] amount mismatch for order', order.id);
            return;
          }
          await fulfilOrder(q, order.id, payment?.id ?? null);
        });
      }
    }
    res.json({ ok: true });
  })
);
