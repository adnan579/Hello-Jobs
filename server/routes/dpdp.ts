import { Router } from 'express';
import { wrap, parse, clientIp } from '../lib/http.ts';
import { consentInput, grievanceInput, nomineeInput } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerOwner, workerId } from '../lib/guards.ts';
import { forbidden, notFound, tooMany } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { audit } from '../lib/audit.ts';
import { POLICY_VERSION } from '../lib/enums.ts';
import { hit } from '../auth/throttle.ts';
import { respond } from '../lib/respond.ts';
import { clearSessionCookie } from '../auth/session.ts';
import { WORKER_SELECT, workerView } from '../services/serialize.ts';
import type { Queryable } from '../db.ts';

export const dpdpRouter = Router();

function ownWorker(req: any): string {
  const wid = workerId(req);
  if (req.params.workerId && req.params.workerId !== wid) throw forbidden('You can only manage your own data.');
  return wid;
}

dpdpRouter.put(
  '/dpdp/consent/:workerId',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = ownWorker(req);
    const c = parse(consentInput, { ...req.body, ...(req.body?.isWithdrawn ? { directoryDiscovery: false } : {}) });
    const withdrawn = Boolean(req.body?.isWithdrawn);
    await req.ctx.db.tx(async (q) => {
      const w = (await q.query('SELECT name FROM workers WHERE id = $1 FOR UPDATE', [wid])).rows[0];
      if (!w) throw notFound();
      await q.query(
        `INSERT INTO consent_records (id, worker_id, policy_version, directory_discovery, whatsapp_job_alerts, credential_verification, marketing, notice_language, is_withdrawn)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [newId('consent'), wid, POLICY_VERSION, c.directoryDiscovery, c.whatsappJobAlerts, c.credentialVerification, c.marketingCommunications, c.noticeLanguage, withdrawn]
      );
      await q.query('UPDATE workers SET directory_visible = $2, updated_at = now() WHERE id = $1', [wid, c.directoryDiscovery && !withdrawn]);
      await audit(q, {
        actorAccountId: req.auth!.accountId, principalId: wid, principalName: w.name, action: withdrawn ? 'CONSENT_WITHDRAWN' : 'CONSENT_UPDATED', ip: clientIp(req),
        details: withdrawn ? 'Consent withdrawn: profile hidden from the employer talent directory.' : `Consent updated (directory: ${c.directoryDiscovery ? 'ON' : 'OFF'}, WhatsApp alerts: ${c.whatsappJobAlerts ? 'ON' : 'OFF'}).`,
      });
    });
    await respond(req, res);
  })
);

dpdpRouter.put(
  '/dpdp/nominee/:workerId',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = ownWorker(req);
    const n = parse(nomineeInput, req.body);
    await req.ctx.db.tx(async (q) => {
      const w = (await q.query('SELECT name FROM workers WHERE id = $1', [wid])).rows[0];
      await q.query(
        `INSERT INTO nominees (worker_id, nominee_name, relationship, nominee_phone) VALUES ($1,$2,$3,$4)
         ON CONFLICT (worker_id) DO UPDATE SET nominee_name = $2, relationship = $3, nominee_phone = $4, registered_at = now()`,
        [wid, n.nomineeName, n.relationship, n.nomineePhone]
      );
      await audit(q, { actorAccountId: req.auth!.accountId, principalId: wid, principalName: w.name, action: 'NOMINEE_REGISTERED', ip: clientIp(req), details: `Nominee registered: ${n.nomineeName} (${n.relationship}).` });
    });
    await respond(req, res);
  })
);

dpdpRouter.get(
  '/dpdp/export',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = workerId(req);
    const db = req.ctx.db;
    const [profile, apps, offers, consents, notes, audits] = await Promise.all([
      db.query(`${WORKER_SELECT} WHERE w.id = $1`, [wid]),
      db.query('SELECT id, job_id, status, data, created_at FROM applications WHERE worker_id = $1', [wid]),
      db.query('SELECT id, status, data, created_at FROM offers WHERE worker_id = $1', [wid]),
      db.query('SELECT * FROM consent_records WHERE worker_id = $1 ORDER BY created_at', [wid]),
      db.query(`SELECT event_type, title, body, created_at FROM notifications WHERE recipient_role = 'worker' AND recipient_id = $1`, [wid]),
      db.query('SELECT action, details, created_at FROM audit_logs WHERE principal_id = $1 ORDER BY created_at', [wid]),
    ]);
    await audit(db, { actorAccountId: req.auth!.accountId, principalId: wid, principalName: profile.rows[0]?.name ?? '', action: 'DATA_EXPORTED', ip: clientIp(req), details: 'Worker downloaded a copy of their personal data.' });
    res.set('Content-Disposition', 'attachment; filename="hello-jobs-my-data.json"');
    res.json({ exportedAt: new Date().toISOString(), profile: profile.rows[0] ? workerView(profile.rows[0], 'self') : null, applications: apps.rows, offers: offers.rows, consentHistory: consents.rows, notifications: notes.rows, activityLog: audits.rows });
  })
);

async function revokeAll(q: Queryable, accountId: string) {
  await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [accountId]);
}

dpdpRouter.delete(
  '/dpdp/erase/:workerId',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = ownWorker(req);
    const accountId = req.auth!.accountId;
    await req.ctx.db.tx(async (q) => {
      const w = (await q.query('SELECT name FROM workers WHERE id = $1 FOR UPDATE', [wid])).rows[0];
      if (!w) throw notFound();
      await q.query(`DELETE FROM notifications WHERE recipient_role = 'worker' AND recipient_id = $1`, [wid]);
      await q.query(`DELETE FROM verification_records WHERE subject_id = $1`, [wid]);
      await q.query(`DELETE FROM consent_records WHERE worker_id = $1`, [wid]);
      await q.query('DELETE FROM workers WHERE id = $1', [wid]); // cascades applications, offers, shortlists, unlocks, nominee, check-ins, registrations
      await revokeAll(q, accountId);
      // Keep the account row only as a tombstone so the number can register again later.
      await q.query(`UPDATE accounts SET status = 'erased', phone = 'erased:' || id::text WHERE id = $1`, [accountId]);
      await audit(q, { actorAccountId: accountId, principalId: wid, principalName: w.name, action: 'DATA_ERASED', ip: clientIp(req), details: 'Worker erased profile, applications, offers and consent records.' });
    });
    clearSessionCookie(res, req.ctx.config.isProd);
    res.json({ ok: true });
  })
);

dpdpRouter.delete(
  '/dpdp/erase-employer',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerOwner(req);
    await req.ctx.db.tx(async (q) => {
      const e = (await q.query('SELECT company_name FROM employers WHERE id = $1 FOR UPDATE', [eid])).rows[0];
      const members = (await q.query('SELECT account_id FROM employer_members WHERE employer_id = $1', [eid])).rows;
      await q.query('DELETE FROM jobs WHERE employer_id = $1', [eid]); // cascades applications and offers
      await q.query('DELETE FROM hiring_drives WHERE employer_id = $1', [eid]);
      await q.query('DELETE FROM shortlists WHERE employer_id = $1', [eid]);
      await q.query('DELETE FROM contact_unlocks WHERE employer_id = $1', [eid]);
      await q.query('DELETE FROM employer_members WHERE employer_id = $1', [eid]);
      await q.query(`DELETE FROM notifications WHERE recipient_role = 'employer' AND recipient_id = $1`, [eid]);
      // Billing records stay (tax law), but personal contact data goes.
      await q.query(`UPDATE employers SET company_name = 'Erased account', data = '{}'::jsonb, paused = true WHERE id = $1`, [eid]);
      for (const m of members) {
        await revokeAll(q, m.account_id);
        await q.query(`UPDATE accounts SET status = 'erased', phone = 'erased:' || id::text WHERE id = $1`, [m.account_id]);
      }
      await audit(q, { actorAccountId: req.auth!.accountId, principalId: eid, principalName: e.company_name, action: 'DATA_ERASED', ip: clientIp(req), details: 'Factory account, postings and team access erased. Invoices are retained as required by tax law.' });
    });
    clearSessionCookie(res, req.ctx.config.isProd);
    res.json({ ok: true });
  })
);

// Open to logged-out people too: a person who withdrew consent must still be able to raise a grievance.
dpdpRouter.post(
  '/dpdp/grievance',
  wrap(async (req, res) => {
    const body = parse(grievanceInput, req.body);
    const t = await hit(req.ctx.db, `grievance:${clientIp(req)}`, 5, 3600);
    if (t.blocked) throw tooMany();
    const id = `GRV-${newId('x').slice(2, 10).toUpperCase()}`;
    await req.ctx.db.query(`INSERT INTO grievances (id, data, sla_due_at) VALUES ($1,$2, now() + interval '30 days')`, [id, JSON.stringify(body)]);
    await audit(req.ctx.db, { principalId: body.dataPrincipalPhone, principalName: body.dataPrincipalName, action: 'GRIEVANCE_FILED', ip: clientIp(req), details: `Grievance ${id} filed (${body.category}).` });
    res.status(201).json({ ok: true, ticket: { id, status: 'Registered with DPO', category: body.category } });
  })
);
