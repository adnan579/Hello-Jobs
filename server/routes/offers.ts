import { Router } from 'express';
import { wrap, parse } from '../lib/http.ts';
import { offerCreate, offerStatusPatch } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerWriter, workerId } from '../lib/guards.ts';
import { badRequest, conflict, notFound } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { notify } from '../lib/audit.ts';
import { respond } from '../lib/respond.ts';
import { fmtDateTime } from '../lib/format.ts';
import { appendHistory } from './applications.ts';
import { OFFER_SELECT, offerView } from '../services/serialize.ts';

export const offersRouter = Router();
const OFFER_VALID_DAYS = 14;
const OFFERABLE = new Set(['Applied', 'Shortlisted', 'Interview', 'Declined']);

offersRouter.post(
  '/offers',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const body = parse(offerCreate, req.body);
    const offerId = newId('offer');

    await req.ctx.db.tx(async (q) => {
      // The application must belong to one of THIS employer's jobs.
      const app = (
        await q.query(
          `SELECT a.*, j.title AS job_title, j.take_home_salary, j.data->>'plantLocation' AS plant_location, e.company_name, w.name AS worker_name
             FROM applications a JOIN jobs j ON j.id = a.job_id JOIN employers e ON e.id = a.employer_id JOIN workers w ON w.id = a.worker_id
            WHERE a.employer_id = $1 AND ${body.applicationId ? 'a.id = $2' : 'a.worker_id = $2 AND a.job_id = $3'} FOR UPDATE OF a`,
          body.applicationId ? [eid, body.applicationId] : [eid, body.candidateId ?? '', body.jobId ?? '']
        )
      ).rows[0];
      if (!app) throw notFound('Application not found. A worker must apply (or accept your invite) before you can send an offer.');
      // An unanswered offer past its 14 days is closed, so the factory can send a fresh one.
      if (app.status === 'Offer Issued') {
        const stale = await q.query(`UPDATE offers SET status = 'Declined', data = data || '{"expired": true}'::jsonb, updated_at = now()
                                      WHERE application_id = $1 AND status = 'Issued' AND (data->>'expiresAtIso')::timestamptz < now()`, [app.id]);
        if (stale.rowCount) {
          await appendHistory(q, app.id, 'Shortlisted', { id: newId('ev'), stage: 'Shortlisted', toStage: 'Shortlisted', actorRole: 'system', actor: 'system', actorName: 'Hello Jobs', timestamp: fmtDateTime(new Date()), note: 'The earlier offer expired without an answer.' });
          app.status = 'Shortlisted';
        }
      }
      if (!OFFERABLE.has(app.status)) throw badRequest(`An offer cannot be issued while the application is "${app.status}".`);

      const live = await q.query(`SELECT 1 FROM offers WHERE application_id = $1 AND status IN ('Issued','Accepted','Joined Confirmed')`, [app.id]);
      if (live.rowCount) throw conflict('A live offer already exists for this application.');
      const versions = (await q.query('SELECT count(*)::int AS n FROM offers WHERE application_id = $1', [app.id])).rows[0].n;

      const posted = app.take_home_salary as number;
      const warning = body.monthlyInHand < posted ? `This offer (₹${body.monthlyInHand.toLocaleString('en-IN')}) is lower than the in-hand pay promised in the job post (₹${posted.toLocaleString('en-IN')}).` : undefined;
      const data = {
        monthlyInHand: body.monthlyInHand, monthlyGross: body.monthlyGross, overtimeHourlyRate: body.overtimeHourlyRate,
        joiningDate: body.joiningDate, shiftPattern: body.shiftPattern, accommodationProvided: body.accommodationProvided, esiPfIncluded: body.esiPfIncluded,
        plantLocation: body.plantLocation ?? app.plant_location ?? '', promisedJobInHand: posted, jobPostedInHand: posted, payPromiseWarning: warning,
        versionNumber: versions + 1, expiresAt: fmtDateTime(new Date(Date.now() + OFFER_VALID_DAYS * 86_400_000)),
        expiresAtIso: new Date(Date.now() + OFFER_VALID_DAYS * 86_400_000).toISOString(),
      };
      await q.query(`INSERT INTO offers (id, application_id, worker_id, employer_id, data) VALUES ($1,$2,$3,$4,$5)`, [offerId, app.id, app.worker_id, eid, JSON.stringify(data)]);
      await appendHistory(q, app.id, 'Offer Issued', { id: newId('ev'), stage: 'Offer Issued', toStage: 'Offer Issued', actorRole: 'employer', actor: 'employer', actorName: app.company_name, timestamp: fmtDateTime(new Date()), note: `Offer issued: ₹${body.monthlyInHand.toLocaleString('en-IN')} in-hand per month` });
      await notify(q, { role: 'worker', recipientId: app.worker_id, eventType: 'OFFER_RECEIVED', title: `New offer: ₹${body.monthlyInHand.toLocaleString('en-IN')} in-hand/month at ${app.company_name}`, body: `${app.job_title}. Open Hello Jobs to read and accept or decline.${warning ? ' Note: ' + warning : ''}` });
    });
    const offer = (await req.ctx.db.query(`${OFFER_SELECT} WHERE o.id = $1`, [offerId])).rows[0];
    await respond(req, res, { offer: offerView(offer) }, 201);
  })
);

offersRouter.patch(
  '/offers/:id/status',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = workerId(req);
    const body = parse(offerStatusPatch, req.body);
    await req.ctx.db.tx(async (q) => {
      const o = (
        await q.query(
          `SELECT o.*, a.job_id, a.status AS app_status, w.name AS worker_name, e.company_name, j.title AS job_title
             FROM offers o JOIN applications a ON a.id = o.application_id JOIN workers w ON w.id = o.worker_id
             JOIN employers e ON e.id = o.employer_id JOIN jobs j ON j.id = a.job_id
            WHERE o.id = $1 AND o.worker_id = $2 FOR UPDATE OF o, a`,
          [req.params.id, wid]
        )
      ).rows[0];
      if (!o) throw notFound('Offer not found.');

      const allowed: Record<string, string[]> = { Issued: ['Accepted', 'Declined'], Accepted: ['Joined Confirmed'] };
      if (!allowed[o.status]?.includes(body.status)) throw badRequest(`This offer is "${o.status}" and cannot be changed to "${body.status}".`);
      if (o.status === 'Issued' && o.data?.expiresAtIso && new Date(o.data.expiresAtIso) < new Date()) throw badRequest('This offer has expired. Ask the factory to send a new one.');

      const data = { ...o.data };
      if (body.declineReason) data.declineReason = body.declineReason;
      const isJoinClaim = body.status === 'Joined Confirmed';
      // Joining needs BOTH sides: the worker says they reported, the factory marks them Joined.
      // The worker alone cannot fill a vacancy.
      if (isJoinClaim && o.data?.workerConfirmedJoining) throw badRequest('You have already confirmed joining. Waiting for the factory to confirm.');
      if (isJoinClaim) data.workerConfirmedJoining = true;
      const newOfferStatus = isJoinClaim ? (o.app_status === 'Joined' ? 'Joined Confirmed' : 'Accepted') : body.status;
      await q.query('UPDATE offers SET status = $2, data = $3, updated_at = now() WHERE id = $1', [o.id, newOfferStatus, JSON.stringify(data)]);

      const note = body.status === 'Declined' ? `Declined the offer${body.declineReason ? `: ${body.declineReason}` : ''}` : body.status === 'Accepted' ? 'Accepted the offer' : 'Confirmed joining';
      if (isJoinClaim) {
        await q.query(`UPDATE applications SET data = data || '{"workerConfirmedJoining": true}'::jsonb, updated_at = now() WHERE id = $1`, [o.application_id]);
      } else {
        const stage = body.status === 'Accepted' ? 'Accepted' : 'Declined';
        const extra: Record<string, unknown> = {};
        if (body.status === 'Declined') extra.declineOrRejectReason = body.declineReason;
        await appendHistory(q, o.application_id, stage, { id: newId('ev'), stage, toStage: stage, actorRole: 'worker', actor: 'worker', actorName: o.worker_name, timestamp: fmtDateTime(new Date()), note }, extra);
      }

      await notify(q, { role: 'employer', recipientId: o.employer_id, eventType: body.status === 'Joined Confirmed' ? 'JOINING_CONFIRMED' : 'OFFER_ACCEPTED', title: `Offer ${body.status.toLowerCase()}: ${o.worker_name}`, body: `${o.worker_name} ${note.toLowerCase()} for ${o.job_title}.` });
    });
    await respond(req, res);
  })
);
