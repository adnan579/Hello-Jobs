import { Router } from 'express';
import type { Request } from 'express';
import { z } from 'zod';
import { wrap, parse, clientIp } from '../lib/http.ts';
import { adminVerify, reportPatch } from '../lib/schemas.ts';
import { requireAdmin } from '../auth/session.ts';
import { HttpError, badRequest, conflict, forbidden, notFound } from '../lib/errors.ts';
import { audit, notify } from '../lib/audit.ts';
import { fmtDateTime } from '../lib/format.ts';
import { newId } from '../lib/ids.ts';
import { maskPhone, formatPhone } from '../lib/phone.ts';
import { ADMIN_ROLES } from '../lib/permissions.ts';
import { hashPassword, passwordProblem } from '../lib/password.ts';
import { reviewConfig } from '../lib/doctor.ts';
import { grantTrialCredits } from '../services/credits.ts';
import { createAdminAccount } from '../services/adminAccounts.ts';
import type { Queryable } from '../db.ts';

export const adminRouter = Router();

// ---------- helpers ----------
const PAGE = 25;
const pageOf = (req: Request) => {
  const page = Math.max(1, Math.min(10_000, parseInt(String(req.query.page ?? '1'), 10) || 1));
  return { page, limit: PAGE, offset: (page - 1) * PAGE };
};
const text = (v: unknown, max = 100) => String(v ?? '').trim().slice(0, max);
const like = (v: string) => `%${v.replace(/[%_\\]/g, (c) => '\\' + c)}%`;
const who = (req: Request) => `${req.admin!.displayName} <${req.admin!.email}>`;
const reasonField = z.string().trim().min(5, 'Please write a reason (at least 5 characters).').max(300);

async function log(q: Queryable, req: Request, p: { id: string; name: string; action: string; details: string }) {
  await audit(q, { actorAccountId: req.admin!.accountId, principalId: p.id, principalName: p.name, action: p.action, details: `${p.details} (by ${req.admin!.email})`, ip: clientIp(req) });
}

const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : null);

// ---------- overview ----------
adminRouter.get(
  '/admin/overview',
  requireAdmin('dashboard'),
  wrap(async (req, res) => {
    const db = req.ctx.db;
    const one = async (sql: string) => (await db.query(sql)).rows[0];
    const [w, e, j, a, o, v, rp, gr, pay, cr, series] = await Promise.all([
      one(`SELECT count(*)::int total, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int week FROM workers`),
      one(`SELECT count(*)::int total, count(*) FILTER (WHERE kyb_status='VERIFIED')::int verified, count(*) FILTER (WHERE kyb_status='PENDING')::int pending, count(*) FILTER (WHERE paused)::int paused FROM employers`),
      one(`SELECT count(*) FILTER (WHERE is_active AND moderation_status='Approved' AND expires_at > now())::int live, count(*) FILTER (WHERE moderation_status='Paused')::int hidden FROM jobs`),
      one(`SELECT count(*)::int total, count(*) FILTER (WHERE status='Joined')::int joined FROM applications`),
      one(`SELECT count(*) FILTER (WHERE status='Issued')::int issued, count(*) FILTER (WHERE status IN ('Accepted','Joined Confirmed'))::int accepted FROM offers`),
      one(`SELECT count(*)::int pending, COALESCE(EXTRACT(EPOCH FROM now() - min(created_at))/3600, 0)::float oldest_hours FROM verification_records WHERE status='PENDING'`),
      one(`SELECT count(*)::int open FROM reports WHERE status NOT IN ('Resolved','Dismissed')`),
      one(`SELECT count(*) FILTER (WHERE status <> 'Resolved')::int open, count(*) FILTER (WHERE status <> 'Resolved' AND sla_due_at < now())::int overdue FROM grievances`),
      one(`SELECT COALESCE(sum(amount_paise) FILTER (WHERE status='paid'),0)::float/100 total, COALESCE(sum(amount_paise) FILTER (WHERE status='paid' AND paid_at > now() - interval '30 days'),0)::float/100 last30, count(*) FILTER (WHERE status='paid')::int orders FROM payment_orders`),
      one(`SELECT COALESCE(sum(hunt_credits),0)::int outstanding FROM employers`),
      db.query(`SELECT to_char(d, 'YYYY-MM-DD') AS day,
                  (SELECT count(*)::int FROM workers WHERE created_at::date = d) AS workers,
                  (SELECT count(*)::int FROM employers WHERE created_at::date = d) AS employers
                FROM generate_series(current_date - 29, current_date, interval '1 day') d ORDER BY d`),
    ]);
    res.json({
      workers: w, employers: e, jobs: j, applications: a, offers: o,
      verification: { pending: v.pending, oldestHours: Math.round(v.oldest_hours) },
      reports: rp, grievances: gr, revenue: pay, credits: cr, signups: series.rows,
    });
  })
);

// ---------- verification queue ----------
adminRouter.get(
  '/admin/verifications',
  requireAdmin('verification'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const status = text(req.query.status, 20), kind = text(req.query.kind, 40);
    const where = ['($1 = \'\' OR status = $1)', '($2 = \'\' OR kind = $2)'];
    const args = [status, kind];
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM verification_records WHERE ${where.join(' AND ')}`, args)).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT v.*, r.email AS reviewer FROM verification_records v LEFT JOIN admin_credentials r ON r.account_id = v.reviewer_account_id
        WHERE ${where.join(' AND ').replace(/status/g, 'v.status').replace(/kind/g, 'v.kind')}
        ORDER BY (v.status='PENDING') DESC, v.created_at DESC LIMIT ${limit} OFFSET ${offset}`, args)).rows;
    res.json({
      total,
      rows: rows.map((r: any) => ({
        id: r.id, kind: r.kind, status: r.status, subjectId: r.subject_id, subjectName: r.subject_name, subjectType: r.subject_type,
        documentNumber: r.data?.documentNumber ?? r.data?.gstin ?? '', evidence: r.data?.evidenceLabel ?? '', notes: r.data?.reviewerNotes ?? '',
        submittedAt: iso(r.created_at), reviewedAt: iso(r.reviewed_at), reviewer: r.reviewer ?? null,
      })),
    });
  })
);

adminRouter.post(
  '/admin/verify',
  requireAdmin('verification'),
  wrap(async (req, res) => {
    const body = parse(adminVerify, req.body);
    const status = body.status.toUpperCase() as 'VERIFIED' | 'REJECTED';
    if (status === 'REJECTED' && !(body.reviewerNotes || body.reasonCode)) throw badRequest('Please give a reason when rejecting.');
    try {
      await req.ctx.db.tx(async (q) => {
        const rec = (await q.query('SELECT * FROM verification_records WHERE id = $1 FOR UPDATE', [body.recordId])).rows[0];
        if (!rec) throw notFound('Verification record not found.');
        const data = { ...rec.data, reviewerNotes: body.reviewerNotes, reasonCode: body.reasonCode, reviewerName: who(req), reviewedAtLabel: fmtDateTime(new Date()) };
        await q.query('UPDATE verification_records SET status = $2, data = $3, reviewer_account_id = $4, reviewed_at = now() WHERE id = $1', [rec.id, status, JSON.stringify(data), req.admin!.accountId]);
        if (rec.kind === 'FACTORY_GSTIN_KYB') {
          if (status === 'VERIFIED') {
            await q.query(`UPDATE employers SET kyb_status = 'VERIFIED', kyb_verified_at = now() WHERE id = $1`, [rec.subject_id]);
            await grantTrialCredits(q, rec.subject_id);
          } else {
            await q.query(`UPDATE employers SET kyb_status = 'CANCELLED_GSTIN', kyb_verified_at = NULL WHERE id = $1`, [rec.subject_id]);
          }
          await notify(q, { role: 'employer', recipientId: rec.subject_id, eventType: 'VERIFICATION_RESULT', title: status === 'VERIFIED' ? 'Your factory is verified' : 'Factory verification was not approved', body: status === 'VERIFIED' ? 'Your jobs are now visible to workers and you can search the talent directory.' : `Reason: ${body.reasonCode ?? body.reviewerNotes ?? 'see notes'}. Please check your GSTIN and contact support.` });
        } else {
          await notify(q, { role: 'worker', recipientId: rec.subject_id, eventType: 'VERIFICATION_RESULT', title: status === 'VERIFIED' ? 'Your document was verified' : 'Your document could not be verified', body: status === 'VERIFIED' ? `${rec.kind === 'WORKER_NCVT_CERT' ? 'Your ITI certificate' : 'Your skill video'} now shows a verified badge.` : `Reason: ${body.reasonCode ?? body.reviewerNotes ?? 'see notes'}. You can submit it again.` });
        }
        await log(q, req, { id: rec.subject_id, name: rec.subject_name, action: 'VERIFICATION_REVIEWED', details: `${rec.kind} marked ${status}${body.reviewerNotes ? `: ${body.reviewerNotes}` : ''}` });
      });
    } catch (e: any) {
      if (e?.code === '23505') throw new HttpError(409, 'Another factory already holds this verified GSTIN. Resolve the conflict before approving.');
      throw e;
    }
    res.json({ ok: true });
  })
);

// ---------- workers ----------
adminRouter.get(
  '/admin/workers',
  requireAdmin('users.view'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const q = text(req.query.q), status = text(req.query.status, 20);
    const digits = q.replace(/\D/g, '');
    const args = [q ? like(q) : '', digits.length >= 4 ? like(digits) : '', status];
    const where = `($1 = '' OR w.name ILIKE $1 OR w.id ILIKE $1 OR w.current_city ILIKE $1 OR ($2 <> '' AND w.phone LIKE $2)) AND ($3 = '' OR a.status = $3)`;
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM workers w JOIN accounts a ON a.id = w.account_id WHERE ${where}`, args)).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT w.id, w.name, w.phone, w.trade, w.current_city, w.home_state, w.created_at, a.status, a.last_login_at,
              (SELECT count(*)::int FROM applications x WHERE x.worker_id = w.id) AS applications
         FROM workers w JOIN accounts a ON a.id = w.account_id WHERE ${where} ORDER BY w.created_at DESC LIMIT ${limit} OFFSET ${offset}`, args)).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, name: r.name, phone: maskPhone(r.phone), trade: r.trade, city: r.current_city, state: r.home_state, status: r.status, applications: r.applications, joinedAt: iso(r.created_at), lastLoginAt: iso(r.last_login_at) })) });
  })
);

adminRouter.get(
  '/admin/workers/:id',
  requireAdmin('users.view'),
  wrap(async (req, res) => {
    const db = req.ctx.db;
    const w = (await db.query(`SELECT w.*, a.status AS account_status, a.last_login_at FROM workers w JOIN accounts a ON a.id = w.account_id WHERE w.id = $1`, [req.params.id])).rows[0];
    if (!w) throw notFound('Worker not found.');
    const [apps, offers, ver, cons] = await Promise.all([
      db.query(`SELECT a.id, a.status, a.created_at, j.title, e.company_name FROM applications a JOIN jobs j ON j.id = a.job_id JOIN employers e ON e.id = a.employer_id WHERE a.worker_id = $1 ORDER BY a.created_at DESC LIMIT 50`, [w.id]),
      db.query(`SELECT o.id, o.status, o.data, o.created_at, e.company_name FROM offers o JOIN employers e ON e.id = o.employer_id WHERE o.worker_id = $1 ORDER BY o.created_at DESC LIMIT 50`, [w.id]),
      db.query(`SELECT id, kind, status, created_at FROM verification_records WHERE subject_id = $1 ORDER BY created_at DESC`, [w.id]),
      db.query(`SELECT * FROM consent_records WHERE worker_id = $1 ORDER BY created_at DESC LIMIT 1`, [w.id]),
    ]);
    // Opening someone's full record is itself recorded.
    await log(db, req, { id: w.id, name: w.name, action: 'ADMIN_VIEWED_PERSONAL_DATA', details: 'Opened full worker record' });
    res.json({
      worker: { id: w.id, name: w.name, phone: formatPhone(w.phone), trade: w.trade, category: w.category, city: w.current_city, state: w.home_state, expectedSalary: w.expected_salary, directoryVisible: w.directory_visible, status: w.account_status, joinedAt: iso(w.created_at), lastLoginAt: iso(w.last_login_at), about: w.data?.about ?? '' },
      applications: apps.rows.map((r: any) => ({ id: r.id, status: r.status, job: r.title, company: r.company_name, at: iso(r.created_at) })),
      offers: offers.rows.map((r: any) => ({ id: r.id, status: r.status, company: r.company_name, monthlyInHand: r.data?.monthlyInHand, at: iso(r.created_at) })),
      verifications: ver.rows.map((r: any) => ({ id: r.id, kind: r.kind, status: r.status, at: iso(r.created_at) })),
      consent: cons.rows[0] ? { policyVersion: cons.rows[0].policy_version, directory: cons.rows[0].directory_discovery, whatsapp: cons.rows[0].whatsapp_job_alerts, withdrawn: cons.rows[0].is_withdrawn, at: iso(cons.rows[0].created_at) } : null,
    });
  })
);

const suspendInput = z.object({ suspend: z.boolean(), reason: reasonField });

adminRouter.post(
  '/admin/workers/:id/suspend',
  requireAdmin('users.suspend'),
  wrap(async (req, res) => {
    const { suspend, reason } = parse(suspendInput, req.body);
    await req.ctx.db.tx(async (q) => {
      const w = (await q.query('SELECT id, name, account_id FROM workers WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!w) throw notFound('Worker not found.');
      await q.query(`UPDATE accounts SET status = $2 WHERE id = $1 AND status <> 'erased'`, [w.account_id, suspend ? 'suspended' : 'active']);
      if (suspend) await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [w.account_id]);
      await log(q, req, { id: w.id, name: w.name, action: suspend ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESTORED', details: `Worker ${suspend ? 'suspended' : 'restored'}: ${reason}` });
    });
    res.json({ ok: true });
  })
);

// ---------- employers ----------
adminRouter.get(
  '/admin/employers',
  requireAdmin('users.view'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const q = text(req.query.q), kyb = text(req.query.kyb, 20);
    const args = [q ? like(q) : '', kyb];
    const where = `($1 = '' OR e.company_name ILIKE $1 OR e.gstin ILIKE $1 OR e.id ILIKE $1) AND ($2 = '' OR e.kyb_status = $2)`;
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM employers e WHERE ${where}`, args)).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT e.id, e.company_name, e.gstin, e.kyb_status, e.hunt_credits, e.paused, e.created_at, a.status AS account_status,
              (SELECT count(*)::int FROM jobs j WHERE j.employer_id = e.id) AS jobs
         FROM employers e JOIN accounts a ON a.id = e.owner_account_id WHERE ${where} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`, args)).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, company: r.company_name, gstin: r.gstin, kyb: r.kyb_status, credits: r.hunt_credits, paused: r.paused, status: r.account_status, jobs: r.jobs, joinedAt: iso(r.created_at) })) });
  })
);

adminRouter.get(
  '/admin/employers/:id',
  requireAdmin('users.view'),
  wrap(async (req, res) => {
    const db = req.ctx.db;
    const e = (await db.query(`SELECT e.*, a.status AS account_status, a.phone FROM employers e JOIN accounts a ON a.id = e.owner_account_id WHERE e.id = $1`, [req.params.id])).rows[0];
    if (!e) throw notFound('Factory not found.');
    const [jobs, team, orders, ledger, ver] = await Promise.all([
      db.query(`SELECT id, title, is_active, moderation_status, vacancies_left, created_at FROM jobs WHERE employer_id = $1 ORDER BY created_at DESC LIMIT 50`, [e.id]),
      db.query(`SELECT m.member_role, m.name, a.phone, a.status FROM employer_members m JOIN accounts a ON a.id = m.account_id WHERE m.employer_id = $1`, [e.id]),
      db.query(`SELECT id, pack_id, credits, amount_paise, status, provider, created_at FROM payment_orders WHERE employer_id = $1 ORDER BY created_at DESC LIMIT 20`, [e.id]),
      db.query(`SELECT id, change, reason, reference, balance_after, invoice_no, created_at FROM credit_ledger WHERE employer_id = $1 ORDER BY created_at DESC LIMIT 30`, [e.id]),
      db.query(`SELECT id, kind, status, created_at FROM verification_records WHERE subject_id = $1 ORDER BY created_at DESC`, [e.id]),
    ]);
    await log(db, req, { id: e.id, name: e.company_name, action: 'ADMIN_VIEWED_PERSONAL_DATA', details: 'Opened full factory record' });
    res.json({
      employer: { id: e.id, company: e.company_name, gstin: e.gstin, kyb: e.kyb_status, credits: e.hunt_credits, paused: e.paused, status: e.account_status, hr: e.data?.hrManagerName ?? '', hrPhone: e.data?.hrPhone ?? '', hub: e.data?.industrialHub ?? '', state: e.data?.state ?? '', joinedAt: iso(e.created_at) },
      jobs: jobs.rows.map((r: any) => ({ id: r.id, title: r.title, active: r.is_active, moderation: r.moderation_status, vacancies: r.vacancies_left, at: iso(r.created_at) })),
      team: team.rows.map((r: any) => ({ role: r.member_role, name: r.name, phone: formatPhone(r.phone), status: r.status })),
      orders: orders.rows.map((r: any) => ({ id: r.id, pack: r.pack_id, credits: r.credits, amount: Number(r.amount_paise) / 100, status: r.status, provider: r.provider, at: iso(r.created_at) })),
      ledger: ledger.rows.map((r: any) => ({ id: r.id, change: r.change, reason: r.reason, reference: r.reference, balance: r.balance_after, invoice: r.invoice_no, at: iso(r.created_at) })),
      verifications: ver.rows.map((r: any) => ({ id: r.id, kind: r.kind, status: r.status, at: iso(r.created_at) })),
    });
  })
);

adminRouter.post(
  '/admin/employers/:id/pause',
  requireAdmin('users.suspend'),
  wrap(async (req, res) => {
    const { paused, reason } = parse(z.object({ paused: z.boolean(), reason: reasonField }), req.body);
    await req.ctx.db.tx(async (q) => {
      const e = (await q.query('UPDATE employers SET paused = $2, updated_at = now() WHERE id = $1 RETURNING id, company_name', [req.params.id, paused])).rows[0];
      if (!e) throw notFound('Factory not found.');
      await log(q, req, { id: e.id, name: e.company_name, action: paused ? 'FACTORY_PAUSED' : 'FACTORY_RESUMED', details: `${paused ? 'Paused' : 'Resumed'}: ${reason}` });
    });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/admin/employers/:id/suspend',
  requireAdmin('users.suspend'),
  wrap(async (req, res) => {
    const { suspend, reason } = parse(suspendInput, req.body);
    await req.ctx.db.tx(async (q) => {
      const e = (await q.query('SELECT id, company_name FROM employers WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!e) throw notFound('Factory not found.');
      const ids = (await q.query('SELECT account_id FROM employer_members WHERE employer_id = $1', [e.id])).rows.map((r: any) => r.account_id);
      await q.query(`UPDATE accounts SET status = $2 WHERE id = ANY($1::uuid[]) AND status <> 'erased'`, [ids, suspend ? 'suspended' : 'active']);
      await q.query('UPDATE employers SET paused = $2 WHERE id = $1', [e.id, suspend]);
      if (suspend) await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = ANY($1::uuid[]) AND revoked_at IS NULL', [ids]);
      await log(q, req, { id: e.id, name: e.company_name, action: suspend ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESTORED', details: `Factory ${suspend ? 'suspended' : 'restored'}: ${reason}` });
    });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/admin/employers/:id/reopen-verification',
  requireAdmin('verification'),
  wrap(async (req, res) => {
    const { reason } = parse(z.object({ reason: reasonField }), req.body);
    await req.ctx.db.tx(async (q) => {
      const e = (await q.query('SELECT id, company_name, gstin, data FROM employers WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!e) throw notFound('Factory not found.');
      await q.query(`UPDATE employers SET kyb_status = 'PENDING', kyb_verified_at = NULL WHERE id = $1`, [e.id]);
      await q.query(
        `INSERT INTO verification_records (id, subject_id, subject_name, subject_type, kind, status, method, data) VALUES ($1,$2,$3,'employer','FACTORY_GSTIN_KYB','PENDING','GST_REGISTRY_LOOKUP',$4)`,
        [newId('ver'), e.id, e.company_name, JSON.stringify({ documentNumber: e.gstin, evidenceLabel: `Re-check requested: ${reason}` })]
      );
      await log(q, req, { id: e.id, name: e.company_name, action: 'VERIFICATION_REOPENED', details: `Factory sent back to verification: ${reason}` });
    });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/admin/employers/:id/credits',
  requireAdmin('credits.adjust'),
  wrap(async (req, res) => {
    const { change, reason } = parse(z.object({ change: z.number().int().min(-10_000).max(10_000).refine((n) => n !== 0, 'Enter a number other than 0.'), reason: reasonField }), req.body);
    const balance = await req.ctx.db.tx(async (q) => {
      const e = (await q.query('SELECT id, company_name, hunt_credits FROM employers WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!e) throw notFound('Factory not found.');
      const next = e.hunt_credits + change;
      if (next < 0) throw conflict(`The factory only has ${e.hunt_credits} credits, so it cannot go down by ${-change}.`);
      await q.query('UPDATE employers SET hunt_credits = $2 WHERE id = $1', [e.id, next]);
      await q.query(`INSERT INTO credit_ledger (id, employer_id, change, reason, reference, balance_after) VALUES ($1,$2,$3,'ADMIN_ADJUSTMENT',$4,$5)`, [newId('led'), e.id, change, `${reason} (${req.admin!.email})`, next]);
      await notify(q, { role: 'employer', recipientId: e.id, eventType: 'VERIFICATION_RESULT', title: change > 0 ? `${change} credits added to your account` : `${-change} credits removed from your account`, body: reason });
      await log(q, req, { id: e.id, name: e.company_name, action: 'CREDITS_ADJUSTED', details: `${change > 0 ? '+' : ''}${change} credits, balance ${next}: ${reason}` });
      return next;
    });
    res.json({ ok: true, balance });
  })
);

// ---------- jobs ----------
adminRouter.get(
  '/admin/jobs',
  requireAdmin('jobs.moderate'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const q = text(req.query.q), mod = text(req.query.moderation, 30);
    const args = [q ? like(q) : '', mod];
    const where = `($1 = '' OR j.title ILIKE $1 OR e.company_name ILIKE $1 OR j.id ILIKE $1) AND ($2 = '' OR j.moderation_status = $2)`;
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM jobs j JOIN employers e ON e.id = j.employer_id WHERE ${where}`, args)).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT j.id, j.title, j.trade, j.industrial_hub, j.take_home_salary, j.is_active, j.moderation_status, j.vacancies_left, j.expires_at, j.created_at, j.data->'flaggedKeywords' AS flagged,
              e.id AS employer_id, e.company_name, e.kyb_status, e.paused
         FROM jobs j JOIN employers e ON e.id = j.employer_id WHERE ${where} ORDER BY (j.moderation_status <> 'Approved') DESC, j.created_at DESC LIMIT ${limit} OFFSET ${offset}`, args)).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, title: r.title, trade: r.trade, hub: r.industrial_hub, pay: r.take_home_salary, active: r.is_active, moderation: r.moderation_status, vacancies: r.vacancies_left, flagged: r.flagged ?? [], employerId: r.employer_id, company: r.company_name, kyb: r.kyb_status, paused: r.paused, expiresAt: iso(r.expires_at), postedAt: iso(r.created_at) })) });
  })
);

adminRouter.post(
  '/admin/jobs/:id/moderate',
  requireAdmin('jobs.moderate'),
  wrap(async (req, res) => {
    const { action, reason } = parse(z.object({ action: z.enum(['hide', 'restore']), reason: reasonField }), req.body);
    await req.ctx.db.tx(async (q) => {
      const j = (await q.query('SELECT j.id, j.title, j.employer_id, e.company_name FROM jobs j JOIN employers e ON e.id = j.employer_id WHERE j.id = $1 FOR UPDATE OF j', [req.params.id])).rows[0];
      if (!j) throw notFound('Job not found.');
      await q.query('UPDATE jobs SET moderation_status = $2, updated_at = now() WHERE id = $1', [j.id, action === 'hide' ? 'Paused' : 'Approved']);
      await notify(q, { role: 'employer', recipientId: j.employer_id, eventType: 'VERIFICATION_RESULT', title: action === 'hide' ? `Job hidden: ${j.title}` : `Job restored: ${j.title}`, body: action === 'hide' ? `Our team hid this job. Reason: ${reason}` : 'Our team restored this job.' });
      await log(q, req, { id: j.id, name: `${j.title} (${j.company_name})`, action: action === 'hide' ? 'JOB_HIDDEN' : 'JOB_RESTORED', details: `Job ${action === 'hide' ? 'hidden' : 'restored'}: ${reason}` });
    });
    res.json({ ok: true });
  })
);

// ---------- fee complaints ----------
adminRouter.get(
  '/admin/reports',
  requireAdmin('reports'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const status = text(req.query.status, 40);
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM reports WHERE ($1 = '' OR status = $1)`, [status])).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT r.*, (SELECT paused FROM employers e WHERE lower(e.company_name) = lower(r.data->>'reportedCompany') LIMIT 1) AS company_paused
         FROM reports r WHERE ($1 = '' OR r.status = $1) ORDER BY (r.status NOT IN ('Resolved','Dismissed')) DESC, r.created_at DESC LIMIT ${limit} OFFSET ${offset}`, [status])).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, status: r.status, company: r.data.reportedCompany, thekedar: r.data.thekedarName ?? '', issue: r.data.issueType, details: r.data.details, amount: r.data.amountDemanded ?? null, reporterPhone: r.data.reporterPhone ? maskPhone(String(r.data.reporterPhone)) : '', note: r.data.outcomeNote ?? '', companyPaused: r.company_paused ?? null, at: iso(r.created_at) })) });
  })
);

adminRouter.patch(
  '/admin/reports/:id',
  requireAdmin('reports'),
  wrap(async (req, res) => {
    const body = parse(reportPatch, req.body);
    await req.ctx.db.tx(async (q) => {
      const r = (await q.query('SELECT * FROM reports WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!r) throw notFound('Report not found.');
      const data = { ...r.data, ...(body.outcomeNote ? { outcomeNote: body.outcomeNote } : {}) };
      await q.query('UPDATE reports SET status = $2, data = $3, updated_at = now() WHERE id = $1', [r.id, body.status, JSON.stringify(data)]);
      let paused = 0;
      if (body.pauseFactoryPostings) paused = (await q.query(`UPDATE employers SET paused = true WHERE lower(company_name) = lower($1)`, [r.data.reportedCompany])).rowCount ?? 0;
      if (body.resumeFactoryPostings) await q.query(`UPDATE employers SET paused = false WHERE lower(company_name) = lower($1)`, [r.data.reportedCompany]);
      await log(q, req, { id: r.id, name: `Report against ${r.data.reportedCompany}`, action: 'MODERATION_ACTION', details: `Marked "${body.status}"${body.pauseFactoryPostings ? ` (factory paused: ${paused} account(s))` : ''}${body.resumeFactoryPostings ? ' (factory resumed)' : ''}${body.outcomeNote ? `: ${body.outcomeNote}` : ''}` });
    });
    res.json({ ok: true });
  })
);

// ---------- privacy grievances ----------
adminRouter.get(
  '/admin/grievances',
  requireAdmin('grievances'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const status = text(req.query.status, 40);
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM grievances WHERE ($1 = '' OR status = $1)`, [status])).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT * FROM grievances WHERE ($1 = '' OR status = $1) ORDER BY (status <> 'Resolved') DESC, sla_due_at ASC LIMIT ${limit} OFFSET ${offset}`, [status])).rows;
    const now = Date.now();
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, status: r.status, name: r.data.dataPrincipalName, phone: r.data.dataPrincipalPhone ? formatPhone(String(r.data.dataPrincipalPhone)) : '', role: r.data.role, category: r.data.category, description: r.data.description, note: r.data.adminNote ?? '', dueAt: iso(r.sla_due_at), overdue: r.status !== 'Resolved' && new Date(r.sla_due_at).getTime() < now, at: iso(r.created_at) })) });
  })
);

adminRouter.patch(
  '/admin/grievances/:id',
  requireAdmin('grievances'),
  wrap(async (req, res) => {
    const { status, note } = parse(z.object({ status: z.enum(['Registered with DPO', 'Under Investigation', 'Resolved']), note: z.string().trim().max(500).optional() }), req.body);
    if (status === 'Resolved' && !note) throw badRequest('Please write what was done before resolving.');
    await req.ctx.db.tx(async (q) => {
      const g = (await q.query('SELECT id, data FROM grievances WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!g) throw notFound('Grievance not found.');
      await q.query('UPDATE grievances SET status = $2, data = $3 WHERE id = $1', [g.id, status, JSON.stringify({ ...g.data, ...(note ? { adminNote: note } : {}) })]);
      await log(q, req, { id: g.id, name: 'Privacy grievance', action: 'GRIEVANCE_UPDATED', details: `Marked "${status}"${note ? `: ${note}` : ''}` });
    });
    res.json({ ok: true });
  })
);

// ---------- money ----------
adminRouter.get(
  '/admin/orders',
  requireAdmin('payments.view'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const status = text(req.query.status, 20), eid = text(req.query.employerId, 60);
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM payment_orders WHERE ($1 = '' OR status = $1) AND ($2 = '' OR employer_id = $2)`, [status, eid])).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT o.*, e.company_name FROM payment_orders o JOIN employers e ON e.id = o.employer_id WHERE ($1 = '' OR o.status = $1) AND ($2 = '' OR o.employer_id = $2) ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`, [status, eid])).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, employerId: r.employer_id, company: r.company_name, pack: r.pack_id, credits: r.credits, amount: Number(r.amount_paise) / 100, status: r.status, provider: r.provider, providerPaymentId: r.provider_payment_id, at: iso(r.created_at), paidAt: iso(r.paid_at) })) });
  })
);

adminRouter.get(
  '/admin/ledger',
  requireAdmin('payments.view'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const eid = text(req.query.employerId, 60), reason = text(req.query.reason, 40);
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM credit_ledger WHERE ($1 = '' OR employer_id = $1) AND ($2 = '' OR reason = $2)`, [eid, reason])).rows[0].n;
    const rows = (await req.ctx.db.query(
      `SELECT l.*, e.company_name FROM credit_ledger l JOIN employers e ON e.id = l.employer_id WHERE ($1 = '' OR l.employer_id = $1) AND ($2 = '' OR l.reason = $2) ORDER BY l.created_at DESC LIMIT ${limit} OFFSET ${offset}`, [eid, reason])).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, employerId: r.employer_id, company: r.company_name, change: r.change, reason: r.reason, reference: r.reference, balance: r.balance_after, invoice: r.invoice_no, amount: r.amount_inr === null ? null : Number(r.amount_inr), at: iso(r.created_at) })) });
  })
);

// ---------- notifications ----------
adminRouter.get(
  '/admin/notifications',
  requireAdmin('notifications'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const total = (await req.ctx.db.query('SELECT count(*)::int n FROM notifications')).rows[0].n;
    const rows = (await req.ctx.db.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`)).rows;
    res.json({ total, rows: rows.map((r: any) => ({ id: r.id, to: `${r.recipient_role} ${r.recipient_id}`, type: r.event_type, channel: r.channel, title: r.title, body: r.body, read: r.read, at: iso(r.created_at) })) });
  })
);

// ---------- audit log ----------
function auditQuery(req: Request) {
  const q = text(req.query.q), action = text(req.query.action, 60), actor = text(req.query.actor, 120);
  return {
    where: `($1 = '' OR l.principal_name ILIKE $1 OR l.details ILIKE $1 OR l.principal_id ILIKE $1) AND ($2 = '' OR l.action = $2) AND ($3 = '' OR c.email ILIKE $3)`,
    args: [q ? like(q) : '', action, actor ? like(actor) : ''],
  };
}

adminRouter.get(
  '/admin/audit',
  requireAdmin('audit'),
  wrap(async (req, res) => {
    const { limit, offset } = pageOf(req);
    const { where, args } = auditQuery(req);
    const total = (await req.ctx.db.query(`SELECT count(*)::int n FROM audit_logs l LEFT JOIN admin_credentials c ON c.account_id = l.actor_account_id WHERE ${where}`, args)).rows[0].n;
    const rows = (await req.ctx.db.query(`SELECT l.*, c.email AS actor_email FROM audit_logs l LEFT JOIN admin_credentials c ON c.account_id = l.actor_account_id WHERE ${where} ORDER BY l.created_at DESC, l.id DESC LIMIT ${limit} OFFSET ${offset}`, args)).rows;
    const actions = (await req.ctx.db.query('SELECT DISTINCT action FROM audit_logs ORDER BY action')).rows.map((r: any) => r.action);
    res.json({ total, actions, rows: rows.map((r: any) => ({ id: Number(r.id), at: iso(r.created_at), action: r.action, subject: r.principal_name, subjectId: r.principal_id, details: r.details, actor: r.actor_email ?? null, ip: r.ip })) });
  })
);

const csvCell = (v: unknown) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stops spreadsheet formula injection
  return `"${s.replace(/"/g, '""')}"`;
};

adminRouter.get(
  '/admin/audit.csv',
  requireAdmin('audit'),
  wrap(async (req, res) => {
    const { where, args } = auditQuery(req);
    const rows = (await req.ctx.db.query(`SELECT l.*, c.email AS actor_email FROM audit_logs l LEFT JOIN admin_credentials c ON c.account_id = l.actor_account_id WHERE ${where} ORDER BY l.created_at DESC, l.id DESC LIMIT 5000`, args)).rows;
    await log(req.ctx.db, req, { id: 'audit-export', name: 'Audit log', action: 'AUDIT_EXPORTED', details: `Exported ${rows.length} rows` });
    res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="hello-jobs-audit.csv"' });
    res.send(['When,Action,Subject,Details,Staff,IP', ...rows.map((r: any) => [iso(r.created_at), r.action, r.principal_name, r.details, r.actor_email ?? '', r.ip ?? ''].map(csvCell).join(','))].join('\n'));
  })
);

// ---------- staff ----------
adminRouter.get(
  '/admin/staff',
  requireAdmin('staff'),
  wrap(async (req, res) => {
    const rows = (await req.ctx.db.query(
      `SELECT c.account_id, c.email, c.display_name, c.totp_enabled, c.must_change_password, c.locked_until, c.created_at, a.admin_role, a.status, a.last_login_at
         FROM admin_credentials c JOIN accounts a ON a.id = c.account_id ORDER BY c.created_at`)).rows;
    res.json({ roles: ADMIN_ROLES, rows: rows.map((r: any) => ({ id: r.account_id, email: r.email, name: r.display_name, role: r.admin_role, status: r.status, authenticator: r.totp_enabled, mustChangePassword: r.must_change_password, locked: Boolean(r.locked_until && new Date(r.locked_until) > new Date()), lastLoginAt: iso(r.last_login_at), createdAt: iso(r.created_at), you: r.account_id === req.admin!.accountId })) });
  })
);

const staffCreate = z.object({ email: z.string().trim().toLowerCase().email().max(200), name: z.string().trim().min(2).max(80), role: z.enum(ADMIN_ROLES), password: z.string().min(1).max(200) });

adminRouter.post(
  '/admin/staff',
  requireAdmin('staff'),
  wrap(async (req, res) => {
    const b = parse(staffCreate, req.body);
    const id = await req.ctx.db.tx((q) => createAdminAccount(q, { email: b.email, name: b.name, role: b.role, password: b.password, createdBy: req.admin!.accountId }));
    res.status(201).json({ ok: true, id });
  })
);

async function targetStaff(q: Queryable, req: Request) {
  const t = (await q.query(`SELECT c.account_id, c.email, a.admin_role, a.status FROM admin_credentials c JOIN accounts a ON a.id = c.account_id WHERE c.account_id = $1 FOR UPDATE OF a`, [req.params.id])).rows[0];
  if (!t) throw notFound('Staff account not found.');
  return t as { account_id: string; email: string; admin_role: string; status: string };
}
async function otherSuperAdmins(q: Queryable, exceptId: string) {
  return (await q.query(`SELECT count(*)::int n FROM accounts WHERE role = 'admin' AND admin_role = 'Super Admin' AND status = 'active' AND id <> $1`, [exceptId])).rows[0].n as number;
}

adminRouter.patch(
  '/admin/staff/:id',
  requireAdmin('staff'),
  wrap(async (req, res) => {
    const b = parse(z.object({ role: z.enum(ADMIN_ROLES).optional(), disabled: z.boolean().optional() }), req.body);
    await req.ctx.db.tx(async (q) => {
      const t = await targetStaff(q, req);
      const self = t.account_id === req.admin!.accountId;
      if (self && (b.disabled || (b.role && b.role !== t.admin_role))) throw forbidden('You cannot change your own role or disable yourself.');
      const losingSuper = t.admin_role === 'Super Admin' && t.status === 'active' && (b.disabled || (b.role && b.role !== 'Super Admin'));
      if (losingSuper && (await otherSuperAdmins(q, t.account_id)) === 0) throw conflict('There must always be at least one active Super Admin.');
      if (b.role) await q.query('UPDATE accounts SET admin_role = $2 WHERE id = $1', [t.account_id, b.role]);
      if (b.disabled !== undefined) {
        await q.query('UPDATE accounts SET status = $2 WHERE id = $1', [t.account_id, b.disabled ? 'suspended' : 'active']);
        if (b.disabled) await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [t.account_id]);
      }
      if (b.role && b.role !== t.admin_role) await q.query(`UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL`, [t.account_id]);
      await log(q, req, { id: t.account_id, name: t.email, action: 'STAFF_UPDATED', details: [b.role ? `role ${t.admin_role} -> ${b.role}` : '', b.disabled !== undefined ? (b.disabled ? 'disabled' : 'enabled') : ''].filter(Boolean).join(', ') });
    });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/admin/staff/:id/reset-password',
  requireAdmin('staff'),
  wrap(async (req, res) => {
    const { password } = parse(z.object({ password: z.string().min(1).max(200) }), req.body);
    await req.ctx.db.tx(async (q) => {
      const t = await targetStaff(q, req);
      const problem = passwordProblem(password, t.email);
      if (problem) throw badRequest(problem);
      await q.query('UPDATE admin_credentials SET password_hash = $2, must_change_password = true, failed_attempts = 0, lock_count = 0, locked_until = NULL, password_changed_at = now() WHERE account_id = $1', [t.account_id, await hashPassword(password)]);
      await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [t.account_id]);
      await log(q, req, { id: t.account_id, name: t.email, action: 'STAFF_PASSWORD_RESET', details: 'Temporary password set. Sessions ended. They must choose a new password.' });
    });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/admin/staff/:id/reset-authenticator',
  requireAdmin('staff'),
  wrap(async (req, res) => {
    await req.ctx.db.tx(async (q) => {
      const t = await targetStaff(q, req);
      await q.query('UPDATE admin_credentials SET totp_secret_enc = NULL, totp_enabled = false, totp_last_step = 0 WHERE account_id = $1', [t.account_id]);
      await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [t.account_id]);
      await log(q, req, { id: t.account_id, name: t.email, action: 'STAFF_AUTHENTICATOR_RESET', details: 'Authenticator cleared. They will set up a new one at next sign-in.' });
    });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/admin/staff/:id/unlock',
  requireAdmin('staff'),
  wrap(async (req, res) => {
    await req.ctx.db.tx(async (q) => {
      const t = await targetStaff(q, req);
      await q.query('UPDATE admin_credentials SET failed_attempts = 0, lock_count = 0, locked_until = NULL WHERE account_id = $1', [t.account_id]);
      await log(q, req, { id: t.account_id, name: t.email, action: 'STAFF_UNLOCKED', details: 'Sign-in lock cleared.' });
    });
    res.json({ ok: true });
  })
);

// ---------- system ----------
adminRouter.get(
  '/admin/system',
  requireAdmin('system'),
  wrap(async (req, res) => {
    const db = req.ctx.db;
    let dbOk = true, latency = 0;
    const t0 = Date.now();
    try { await db.query('SELECT 1'); latency = Date.now() - t0; } catch { dbOk = false; }
    const migrations = (await db.query('SELECT name, applied_at FROM schema_migrations ORDER BY name')).rows;
    const counts = (await db.query(`SELECT (SELECT count(*)::int FROM sessions WHERE revoked_at IS NULL AND expires_at > now() AND kind='user') AS user_sessions,
        (SELECT count(*)::int FROM sessions WHERE revoked_at IS NULL AND expires_at > now() AND kind='admin') AS admin_sessions,
        (SELECT count(*)::int FROM otp_challenges WHERE expires_at < now() - interval '1 day') AS stale_otps,
        (SELECT pg_database_size(current_database()))::float AS db_bytes`)).rows[0];
    res.json({
      database: { ok: dbOk, latencyMs: latency, sizeMb: Math.round(counts.db_bytes / 1048576), migrations: migrations.map((m: any) => ({ name: m.name, at: iso(m.applied_at) })) },
      sessions: { users: counts.user_sessions, staff: counts.admin_sessions },
      staleLoginCodes: counts.stale_otps,
      environment: { node: process.version, mode: req.ctx.config.nodeEnv, uptimeMin: Math.round(process.uptime() / 60) },
      configuration: reviewConfig(req.ctx.config, process.env),
    });
  })
);
