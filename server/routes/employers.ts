import { Router } from 'express';
import { wrap, parse } from '../lib/http.ts';
import { employerProfileInput, phoneField } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerOwner, employerWriter } from '../lib/guards.ts';
import { badRequest, conflict, notFound } from '../lib/errors.ts';
import { respond } from '../lib/respond.ts';
import { loadEmployerProfile } from '../services/bootstrap.ts';
import { audit } from '../lib/audit.ts';

export const employersRouter = Router();

employersRouter.put(
  '/employer',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const input = parse(employerProfileInput, req.body);
    const { teamMembers, companyName, ...rest } = input;

    await req.ctx.db.tx(async (q) => {
      const cur = (await q.query('SELECT * FROM employers WHERE id = $1 FOR UPDATE', [eid])).rows[0];
      if (!cur) throw notFound();
      const data = { ...(cur.data ?? {}), ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) };
      // A verified factory cannot rename itself: the badge belongs to the verified legal entity.
      const name = cur.kyb_status === 'VERIFIED' || !companyName ? cur.company_name : companyName;
      await q.query('UPDATE employers SET company_name = $2, data = $3, updated_at = now() WHERE id = $1', [eid, name, JSON.stringify(data)]);

      if (teamMembers) {
        employerOwner(req);
        const existing = (await q.query('SELECT account_id, member_role FROM employer_members WHERE employer_id = $1', [eid])).rows;
        const keepIds = new Set<string>();
        for (const m of teamMembers) {
          if (m.id && existing.some((e: any) => e.account_id === m.id)) {
            keepIds.add(m.id);
            const current = existing.find((e: any) => e.account_id === m.id);
            if (current.member_role !== 'Owner') await q.query('UPDATE employer_members SET member_role = $3, name = $4 WHERE employer_id = $1 AND account_id = $2', [eid, m.id, m.role === 'Owner' ? 'Recruiter' : m.role, m.name]);
            continue;
          }
          const phone = phoneField.safeParse(m.phone);
          if (!phone.success) throw badRequest(`Team member "${m.name}" needs a valid 10-digit mobile number.`);
          let acc = (await q.query(`SELECT id FROM accounts WHERE phone = $1 AND role = 'employer'`, [phone.data])).rows[0];
          if (!acc) acc = (await q.query(`INSERT INTO accounts (phone, role) VALUES ($1, 'employer') RETURNING id`, [phone.data])).rows[0];
          const taken = (await q.query('SELECT employer_id FROM employer_members WHERE account_id = $1', [acc.id])).rows[0];
          if (taken && taken.employer_id !== eid) throw conflict(`${m.name}'s number already belongs to another factory account.`);
          if (!taken) await q.query(`INSERT INTO employer_members (employer_id, account_id, member_role, name) VALUES ($1,$2,$3,$4)`, [eid, acc.id, m.role === 'Owner' ? 'Recruiter' : m.role, m.name]);
          keepIds.add(acc.id);
        }
        for (const e of existing) {
          if (e.member_role !== 'Owner' && !keepIds.has(e.account_id)) {
            await q.query('DELETE FROM employer_members WHERE employer_id = $1 AND account_id = $2', [eid, e.account_id]);
            await q.query('UPDATE sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL', [e.account_id]);
          }
        }
        await audit(q, { actorAccountId: req.auth!.accountId, principalId: eid, principalName: name, action: 'TEAM_UPDATED', details: 'Factory team members updated.' });
      }
    });
    await respond(req, res, { employerProfile: await loadEmployerProfile(req.ctx, eid) });
  })
);

employersRouter.post(
  '/employer/shortlist/toggle',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const candidateId = String(req.body?.candidateId ?? '');
    if (!candidateId) throw badRequest('Missing candidateId');
    const w = (await req.ctx.db.query("SELECT 1 FROM workers w WHERE w.id = $1 AND w.directory_visible AND EXISTS (SELECT 1 FROM accounts ac WHERE ac.id = w.account_id AND ac.status = 'active')", [candidateId])).rowCount;
    const already = (await req.ctx.db.query('SELECT 1 FROM shortlists WHERE employer_id = $1 AND worker_id = $2', [eid, candidateId])).rowCount;
    if (already) await req.ctx.db.query('DELETE FROM shortlists WHERE employer_id = $1 AND worker_id = $2', [eid, candidateId]);
    else if (w) await req.ctx.db.query('INSERT INTO shortlists (employer_id, worker_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [eid, candidateId]);
    else throw notFound('Candidate not found.');
    await respond(req, res);
  })
);
