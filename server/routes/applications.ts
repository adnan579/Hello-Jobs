import { Router } from 'express';
import type { Queryable } from '../db.ts';
import { wrap, parse } from '../lib/http.ts';
import { applicationCreate, applicationPatch } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerWriter, workerId } from '../lib/guards.ts';
import { badRequest, forbidden, notFound, unauthorized } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { notify } from '../lib/audit.ts';
import { respond } from '../lib/respond.ts';
import { canTransitionPipeline } from '../../src/modules/domain.ts';
import { fmtDateTime } from '../lib/format.ts';
import type { PipelineStage } from '../../src/types/index.ts';

export const applicationsRouter = Router();

function event(stage: string, role: 'worker' | 'employer' | 'system', actorName: string, note?: string) {
  return { id: newId('ev'), stage, toStage: stage, actorRole: role, actor: role, actorName, timestamp: fmtDateTime(new Date()), note };
}

export async function appendHistory(q: Queryable, applicationId: string, status: string | null, ev: object, extraData: Record<string, unknown> = {}) {
  await q.query(
    `UPDATE applications SET status = COALESCE($2, status),
       data = jsonb_set(data || $3::jsonb, '{history}', COALESCE(data->'history', '[]'::jsonb) || $4::jsonb),
       updated_at = now() WHERE id = $1`,
    [applicationId, status, JSON.stringify(extraData), JSON.stringify([ev])]
  );
}

/** Called whenever an application becomes Joined, once. */
export async function markJoined(q: Queryable, applicationId: string, jobId: string) {
  await q.query(`UPDATE jobs SET vacancies_left = GREATEST(vacancies_left - 1, 0) WHERE id = $1`, [jobId]);
  await q.query(`UPDATE applications SET data = data || jsonb_build_object('joinedAt', to_jsonb(now())) WHERE id = $1`, [applicationId]);
}

applicationsRouter.post(
  '/applications',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = workerId(req);
    const { jobId } = parse(applicationCreate, req.body);
    const created = await req.ctx.db.tx(async (q) => {
      const job = (
        await q.query(
          `SELECT j.id, j.title, j.employer_id FROM jobs j JOIN employers e ON e.id = j.employer_id
            WHERE j.id = $1 AND j.is_active AND j.moderation_status = 'Approved' AND e.kyb_status = 'VERIFIED' AND NOT e.paused AND j.expires_at > now() AND j.vacancies_left > 0`,
          [jobId]
        )
      ).rows[0];
      if (!job) throw notFound('This job is no longer open.');
      const w = (await q.query('SELECT name, trade FROM workers WHERE id = $1', [wid])).rows[0];
      const id = newId('app');
      const ins = await q.query(
        `INSERT INTO applications (id, job_id, worker_id, employer_id, data) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (job_id, worker_id) DO NOTHING RETURNING id`,
        [id, jobId, wid, job.employer_id, JSON.stringify({ history: [event('Applied', 'worker', w.name, 'Applied with 1 tap from the job feed')] })]
      );
      if (!ins.rowCount) return false; // already applied: idempotent
      await q.query(`INSERT INTO contact_unlocks (employer_id, worker_id, source) VALUES ($1,$2,'application') ON CONFLICT DO NOTHING`, [job.employer_id, wid]);
      await notify(q, { role: 'employer', recipientId: job.employer_id, eventType: 'SHORTLISTED', title: `New applicant: ${w.name} (${w.trade})`, body: `Applied for ${job.title}. Their phone number is now visible to you.` });
      return true;
    });
    await respond(req, res, {}, created ? 201 : 200);
  })
);

applicationsRouter.patch(
  '/applications/:id',
  wrap(async (req, res) => {
    const auth = req.auth;
    if (!auth) throw unauthorized();
    if (auth.role !== 'worker' && auth.role !== 'employer') throw forbidden();
    const body = parse(applicationPatch, req.body);
    const isWorker = auth.role === 'worker';
    const ownerId = isWorker ? workerId(req) : employerWriter(req);

    await req.ctx.db.tx(async (q) => {
      const row = (
        await q.query(
          `SELECT a.*, j.title AS job_title, w.name AS worker_name, e.company_name FROM applications a
             JOIN jobs j ON j.id = a.job_id JOIN workers w ON w.id = a.worker_id JOIN employers e ON e.id = a.employer_id
            WHERE a.id = $1 AND ${isWorker ? 'a.worker_id' : 'a.employer_id'} = $2 FOR UPDATE OF a`,
          [req.params.id, ownerId]
        )
      ).rows[0];
      if (!row) throw notFound('Application not found.'); // same answer whether it exists or not

      const role = isWorker ? 'worker' : 'employer';
      const actorName = isWorker ? row.worker_name : row.company_name;
      const extra: Record<string, unknown> = {};

      if (isWorker) {
        if (body.interviewSlot) {
          const cur = row.data?.interviewSlot ?? {};
          extra.interviewSlot = { ...cur, confirmedSlot: body.interviewSlot.confirmedSlot ?? cur.confirmedSlot, confirmedByWorker: body.interviewSlot.confirmedByWorker ?? cur.confirmedByWorker };
        }
        if (body.workerConfirmedJoining !== undefined) extra.workerConfirmedJoining = body.workerConfirmedJoining;
      } else {
        if (body.interviewSlot) extra.interviewSlot = body.interviewSlot;
        const note = body.recruiterPrivateNote ?? body.employerPrivateNotes;
        if (note !== undefined) extra.recruiterPrivateNote = note;
      }
      if (body.declineOrRejectReason !== undefined) extra.declineOrRejectReason = body.declineOrRejectReason;

      let nextStatus: string | null = null;
      if (body.status && body.status !== row.status) {
        const to = body.status as PipelineStage;
        if (to === 'Offer Issued' || to === 'Accepted') throw badRequest('Use the offer letter to make or accept an offer.');
        if (!canTransitionPipeline(role, row.status, to)) throw badRequest(`${isWorker ? 'You' : 'This account'} cannot move an application from "${row.status}" to "${to}".`);
        nextStatus = to;
      }

      if (nextStatus) {
        if (nextStatus === 'Withdrawn') await q.query(`UPDATE offers SET status = 'Declined', data = data || '{"withdrawn": true}'::jsonb, updated_at = now() WHERE application_id = $1 AND status = 'Issued'`, [row.id]);
        await appendHistory(q, row.id, nextStatus, event(nextStatus, role, actorName, body.note ?? body.declineOrRejectReason), extra);
        if (nextStatus === 'Joined') {
          await markJoined(q, row.id, row.job_id);
          await q.query(`UPDATE offers SET status = 'Joined Confirmed', updated_at = now() WHERE application_id = $1 AND status = 'Accepted' AND COALESCE((data->>'workerConfirmedJoining')::boolean, false)`, [row.id]);
          if (!isWorker) extra.factoryMarkedJoinedAt = fmtDateTime(new Date());
        }
        const eventType = nextStatus === 'Interview' ? 'INTERVIEW_SET' : nextStatus === 'Joined' ? 'JOINING_CONFIRMED' : 'SHORTLISTED';
        await notify(q, {
          role: isWorker ? 'employer' : 'worker',
          recipientId: isWorker ? row.employer_id : row.worker_id,
          eventType,
          title: `Application update: ${nextStatus} — ${row.job_title}`,
          body: `${actorName} moved the application for ${row.job_title} to "${nextStatus}".${body.note ? ' ' + body.note : ''}`,
        });
      } else if (Object.keys(extra).length) {
        await q.query(`UPDATE applications SET data = data || $2::jsonb, updated_at = now() WHERE id = $1`, [row.id, JSON.stringify(extra)]);
      }
      if (nextStatus === 'Joined' && !isWorker) {
        await q.query(`UPDATE applications SET data = data || $2::jsonb WHERE id = $1`, [row.id, JSON.stringify({ factoryMarkedJoinedAt: extra.factoryMarkedJoinedAt })]);
      }
    });
    await respond(req, res);
  })
);
