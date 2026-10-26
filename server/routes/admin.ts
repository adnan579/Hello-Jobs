import { Router } from 'express';
import { wrap, parse } from '../lib/http.ts';
import { adminVerify, reportPatch } from '../lib/schemas.ts';
import { requireAdminRole } from '../auth/session.ts';
import { HttpError, notFound } from '../lib/errors.ts';
import { audit, notify } from '../lib/audit.ts';
import { respond } from '../lib/respond.ts';
import { fmtDateTime } from '../lib/format.ts';
import { grantTrialCredits } from '../services/credits.ts';

export const adminRouter = Router();

adminRouter.post(
  '/admin/verify',
  requireAdminRole('Verifier', 'Trust & Safety'),
  wrap(async (req, res) => {
    const body = parse(adminVerify, req.body);
    const status = body.status.toUpperCase() as 'VERIFIED' | 'REJECTED';
    try {
      await req.ctx.db.tx(async (q) => {
        const rec = (await q.query('SELECT * FROM verification_records WHERE id = $1 FOR UPDATE', [req.params.recordId ?? body.recordId])).rows[0];
        if (!rec) throw notFound('Verification record not found.');
        const data = { ...rec.data, reviewerNotes: body.reviewerNotes, reasonCode: body.reasonCode, reviewerName: `${req.auth!.adminRole} (${req.auth!.phone.slice(-4)})`, reviewedAtLabel: fmtDateTime(new Date()) };
        await q.query('UPDATE verification_records SET status = $2, data = $3, reviewer_account_id = $4, reviewed_at = now() WHERE id = $1', [rec.id, status, JSON.stringify(data), req.auth!.accountId]);

        if (rec.kind === 'FACTORY_GSTIN_KYB') {
          if (status === 'VERIFIED') {
            await q.query(`UPDATE employers SET kyb_status = 'VERIFIED', kyb_verified_at = now() WHERE id = $1`, [rec.subject_id]);
            await grantTrialCredits(q, rec.subject_id);
          } else {
            await q.query(`UPDATE employers SET kyb_status = 'CANCELLED_GSTIN', kyb_verified_at = NULL WHERE id = $1`, [rec.subject_id]);
          }
          await notify(q, { role: 'employer', recipientId: rec.subject_id, eventType: 'VERIFICATION_RESULT', title: status === 'VERIFIED' ? 'Your factory is verified' : 'Factory verification was not approved', body: status === 'VERIFIED' ? 'Your jobs are now visible to workers and you can search the talent directory.' : `Reason: ${body.reasonCode ?? 'see notes'}. Please check your GSTIN and contact support.` });
        } else {
          await notify(q, { role: 'worker', recipientId: rec.subject_id, eventType: 'VERIFICATION_RESULT', title: status === 'VERIFIED' ? 'Your document was verified' : 'Your document could not be verified', body: status === 'VERIFIED' ? `${rec.kind === 'WORKER_NCVT_CERT' ? 'Your ITI certificate' : 'Your skill video'} now shows a verified badge.` : `Reason: ${body.reasonCode ?? 'see notes'}. You can submit it again.` });
        }
        await audit(q, { actorAccountId: req.auth!.accountId, principalId: rec.subject_id, principalName: rec.subject_name, action: 'VERIFICATION_REVIEWED', details: `${rec.kind} marked ${status}` });
      });
    } catch (e: any) {
      if (e?.code === '23505') throw new HttpError(409, 'Another factory already holds this verified GSTIN. Resolve the conflict before approving.');
      throw e;
    }
    await respond(req, res);
  })
);

adminRouter.patch(
  '/admin/reports/:id',
  requireAdminRole('Trust & Safety'),
  wrap(async (req, res) => {
    const body = parse(reportPatch, req.body);
    await req.ctx.db.tx(async (q) => {
      const r = (await q.query('SELECT * FROM reports WHERE id = $1 FOR UPDATE', [req.params.id])).rows[0];
      if (!r) throw notFound('Report not found.');
      const data = { ...r.data, ...(body.outcomeNote ? { outcomeNote: body.outcomeNote } : {}) };
      await q.query('UPDATE reports SET status = $2, data = $3, updated_at = now() WHERE id = $1', [r.id, body.status, JSON.stringify(data)]);
      let paused = 0;
      if (body.pauseFactoryPostings) {
        paused = (await q.query(`UPDATE employers SET paused = true WHERE lower(company_name) = lower($1)`, [r.data.reportedCompany])).rowCount ?? 0;
      }
      if (body.resumeFactoryPostings) {
        await q.query(`UPDATE employers SET paused = false WHERE lower(company_name) = lower($1)`, [r.data.reportedCompany]);
      }
      await audit(q, { actorAccountId: req.auth!.accountId, principalId: 'trust-safety', principalName: 'Trust & Safety', action: 'MODERATION_ACTION', details: `Report ${r.id} against "${r.data.reportedCompany}" marked "${body.status}"${body.pauseFactoryPostings ? ` (factory paused: ${paused} account(s))` : ''}${body.resumeFactoryPostings ? ' (factory resumed)' : ''}` });
    });
    await respond(req, res);
  })
);

adminRouter.patch(
  '/admin/grievances/:id',
  requireAdminRole('Trust & Safety', 'Support'),
  wrap(async (req, res) => {
    const status = String(req.body?.status ?? '');
    if (!['Registered with DPO', 'Under Investigation', 'Resolved'].includes(status)) throw new HttpError(400, 'Invalid status.');
    const r = await req.ctx.db.query('UPDATE grievances SET status = $2 WHERE id = $1 RETURNING id', [req.params.id, status]);
    if (!r.rowCount) throw notFound('Grievance not found.');
    await audit(req.ctx.db, { actorAccountId: req.auth!.accountId, principalId: String(req.params.id), principalName: 'Grievance', action: 'GRIEVANCE_UPDATED', details: `Grievance ${req.params.id} marked "${status}"` });
    await respond(req, res);
  })
);
