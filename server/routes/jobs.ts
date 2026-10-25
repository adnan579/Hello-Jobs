import { Router } from 'express';
import { wrap, parse } from '../lib/http.ts';
import { jobInput } from '../lib/schemas.ts';
import { requireRole } from '../auth/session.ts';
import { employerWriter } from '../lib/guards.ts';
import { badRequest, notFound } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { respond } from '../lib/respond.ts';
import { screenJobPosting } from '../../src/modules/domain.ts';
import { JOB_SELECT, jobView } from '../services/serialize.ts';

export const jobsRouter = Router();
const MAX_JOBS_PER_EMPLOYER = 100;

function splitInput(input: ReturnType<typeof jobInput.parse>) {
  const { title, trade, state, industrialHub, takeHomeSalary, openingsCount, vacanciesLeft, isActive, ...rest } = input;
  return { title, trade, state, industrialHub, takeHomeSalary, openingsCount, vacanciesLeft, isActive, data: { ...rest, openingsCount, title, trade, state, industrialHub, takeHomeSalary } };
}

jobsRouter.post(
  '/jobs',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const input = parse(jobInput, req.body);
    const s = splitInput(input);
    const screening = screenJobPosting({ ...input });
    const n = (await req.ctx.db.query('SELECT count(*)::int AS n FROM jobs WHERE employer_id = $1 AND is_active', [eid])).rows[0].n;
    if (n >= MAX_JOBS_PER_EMPLOYER) throw badRequest('You have reached the limit of active job posts. Close an old one first.');

    const id = newId('job');
    const data = { ...s.data, moderationReason: screening.reasons.join('; ') || undefined };
    await req.ctx.db.query(
      `INSERT INTO jobs (id, employer_id, title, trade, state, industrial_hub, take_home_salary, vacancies_left, is_active, moderation_status, expires_at, data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now() + interval '30 days', $11)`,
      [id, eid, s.title, s.trade, s.state, s.industrialHub, s.takeHomeSalary, s.vacanciesLeft ?? s.openingsCount, s.isActive ?? true, screening.status, JSON.stringify(data)]
    );
    const job = (await req.ctx.db.query(`${JOB_SELECT} WHERE j.id = $1`, [id])).rows[0];
    await respond(req, res, { job: jobView(job, { owner: true }) }, 201);
  })
);

jobsRouter.put(
  '/jobs/:id',
  requireRole('employer'),
  wrap(async (req, res) => {
    const eid = employerWriter(req);
    const input = parse(jobInput, req.body);
    const s = splitInput(input);
    const screening = screenJobPosting({ ...input });
    const cur = (await req.ctx.db.query('SELECT moderation_status FROM jobs WHERE id = $1 AND employer_id = $2', [req.params.id, eid])).rows[0];
    if (!cur) throw notFound('Job not found.');
    // Only Trust & Safety can lift a pause.
    const moderation = cur.moderation_status === 'Paused' ? 'Paused' : screening.status;
    const data = { ...s.data, moderationReason: screening.reasons.join('; ') || undefined };
    await req.ctx.db.query(
      `UPDATE jobs SET title=$3, trade=$4, state=$5, industrial_hub=$6, take_home_salary=$7, vacancies_left=$8, is_active=$9,
              moderation_status=$10, expires_at = now() + interval '30 days', data=$11, updated_at=now()
        WHERE id=$1 AND employer_id=$2`,
      [req.params.id, eid, s.title, s.trade, s.state, s.industrialHub, s.takeHomeSalary, s.vacanciesLeft ?? s.openingsCount, s.isActive ?? true, moderation, JSON.stringify(data)]
    );
    const job = (await req.ctx.db.query(`${JOB_SELECT} WHERE j.id = $1`, [req.params.id])).rows[0];
    await respond(req, res, { job: jobView(job, { owner: true }) });
  })
);
