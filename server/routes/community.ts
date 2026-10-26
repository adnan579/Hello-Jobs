import { Router } from 'express';
import { wrap, parse, clientIp } from '../lib/http.ts';
import { driveCheckin, driveCreate, reportCreate, retentionCheckIn } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerWriter, workerId } from '../lib/guards.ts';
import { badRequest, forbidden, notFound, tooMany, unauthorized } from '../lib/errors.ts';
import { newId, newToken } from '../lib/ids.ts';
import { hit } from '../auth/throttle.ts';
import { respond } from '../lib/respond.ts';

export const communityRouter = Router();

// Anyone may report a fee demand (workers are often logged out). Spam is rate-limited per network.
communityRouter.post(
  '/reports',
  wrap(async (req, res) => {
    const body = parse(reportCreate, req.body);
    const t = await hit(req.ctx.db, `report:${clientIp(req)}`, 5, 3600);
    if (t.blocked) throw tooMany('You have sent several reports recently. Please try again later.');
    const id = newId('rep');
    await req.ctx.db.query('INSERT INTO reports (id, data) VALUES ($1, $2)', [id, JSON.stringify(body)]);
    res.status(201).json({ ok: true, report: { id, status: 'New' } });
  })
);

communityRouter.post(
  '/drives',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const body = parse(driveCreate, req.body);
    const emp = (await req.ctx.db.query('SELECT kyb_status FROM employers WHERE id = $1', [eid])).rows[0];
    if (emp.kyb_status !== 'VERIFIED') throw forbidden('Verify your factory before creating hiring drives.');
    await req.ctx.db.query('INSERT INTO hiring_drives (id, employer_id, check_in_code, data) VALUES ($1,$2,$3,$4)', [newId('drive'), eid, newToken(6), JSON.stringify(body)]);
    await respond(req, res, {}, 201);
  })
);

communityRouter.post(
  '/drives/:id/register',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = workerId(req);
    const d = (await req.ctx.db.query(`SELECT d.id FROM hiring_drives d JOIN employers e ON e.id = d.employer_id WHERE d.id = $1 AND e.kyb_status = 'VERIFIED' AND NOT e.paused`, [req.params.id])).rows[0];
    if (!d) throw notFound('Drive not found.');
    await req.ctx.db.query('INSERT INTO drive_registrations (drive_id, worker_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [d.id, wid]);
    await respond(req, res);
  })
);

// Check-in: either the factory marks a registered worker as arrived, or the worker scans the factory's QR code.
communityRouter.post(
  '/drives/:id/checkin',
  wrap(async (req, res) => {
    const a = req.auth;
    if (!a) throw unauthorized();
    if (a.role !== 'employer' && a.role !== 'worker') throw forbidden();
    const body = parse(driveCheckin, req.body ?? {});
    const drive = (await req.ctx.db.query('SELECT * FROM hiring_drives WHERE id = $1', [req.params.id])).rows[0];
    if (!drive) throw notFound('Drive not found.');
    let wid: string;
    if (a.role === 'employer') {
      if (employerWriter(req) !== drive.employer_id) throw notFound('Drive not found.');
      wid = body.candidateId;
    } else {
      wid = workerId(req);
      if (!body.checkInCode || body.checkInCode !== drive.check_in_code) throw badRequest('That check-in code is not valid for this drive.');
    }
    const r = await req.ctx.db.query('UPDATE drive_registrations SET checked_in_at = COALESCE(checked_in_at, now()) WHERE drive_id = $1 AND worker_id = $2', [drive.id, wid]);
    if (!r.rowCount) throw badRequest('This worker has not registered for the drive.');
    await respond(req, res);
  })
);

const MILESTONE_DAYS: Record<string, number> = { Day1: 1, Day7: 7, Day30: 30, Day90: 90 };

communityRouter.post(
  '/checkins',
  requireRole('worker'),
  wrap(async (req, res) => {
    const wid = workerId(req);
    const body = parse(retentionCheckIn, req.body);
    const milestone = body.milestone ?? (body.dayMilestone ? (`Day${body.dayMilestone}` as 'Day1') : undefined);
    if (!milestone) throw badRequest('Choose a milestone (Day 1, 7, 30 or 90).');

    const joined = (
      await req.ctx.db.query(
        `SELECT a.employer_id, a.job_id, a.data->>'joinedAt' AS joined_at FROM applications a
          WHERE a.worker_id = $1 AND a.status = 'Joined' ORDER BY a.updated_at DESC`,
        [wid]
      )
    ).rows;
    const target = body.employerId ? joined.find((j) => j.employer_id === body.employerId) : body.jobId ? joined.find((j) => j.job_id === body.jobId) : joined[0];
    if (!target) throw badRequest('You can share feedback only about a job you have joined.');
    if (target.joined_at) {
      const days = (Date.now() - new Date(target.joined_at).getTime()) / 86_400_000;
      if (days < MILESTONE_DAYS[milestone] - 1) throw badRequest(`This check-in opens on day ${MILESTONE_DAYS[milestone]} after you join.`);
    }
    const pay = body.payMatchesPromise ?? body.promisedPayReceived ?? null;
    const hostel = body.hostelMatchesPromise ?? body.promisedShiftHonored ?? null;
    const r = await req.ctx.db.query(
      `INSERT INTO retention_checkins (id, worker_id, employer_id, milestone, pay_matches_promise, hostel_matches_promise, still_employed, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (worker_id, employer_id, milestone) DO NOTHING`,
      [newId('chk'), wid, target.employer_id, milestone, pay, hostel, body.stillEmployed ?? body.didJoin ?? null, JSON.stringify({ feedbackNote: body.feedbackNote ?? '' })]
    );
    await respond(req, res, {}, r.rowCount ? 201 : 200);
  })
);
