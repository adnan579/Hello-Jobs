import type { AppContext, AuthContext } from '../types.ts';
import { jobInput } from '../lib/schemas.ts';
import { parse } from '../lib/http.ts';
import { employerWriter } from '../lib/guards.ts';
import { badRequest, notFound } from '../lib/errors.ts';
import { newId } from '../lib/ids.ts';
import { screenJobPosting } from '../../src/modules/domain.ts';
import { JOB_SELECT, jobView } from './serialize.ts';

const MAX_JOBS_PER_EMPLOYER = 100;

function splitInput(input: ReturnType<typeof jobInput.parse>) {
  const { title, trade, state, industrialHub, takeHomeSalary, openingsCount, vacanciesLeft, isActive, ...rest } = input;
  return { title, trade, state, industrialHub, takeHomeSalary, openingsCount, vacanciesLeft, isActive, data: { ...rest, openingsCount, title, trade, state, industrialHub, takeHomeSalary } };
}

/** Shared by the Express router and the native Next.js route: the job as its owner sees it. */
export async function createJob(ctx: AppContext, auth: AuthContext | undefined, body: unknown) {
  const eid = employerWriter({ auth });
  const input = parse(jobInput, body);
  const s = splitInput(input);
  const screening = screenJobPosting({ ...input });
  const n = (await ctx.db.query('SELECT count(*)::int AS n FROM jobs WHERE employer_id = $1 AND is_active', [eid])).rows[0].n;
  if (n >= MAX_JOBS_PER_EMPLOYER) throw badRequest('You have reached the limit of active job posts. Close an old one first.');

  const id = newId('job');
  const data = { ...s.data, moderationReason: screening.reasons.join('; ') || undefined };
  await ctx.db.query(
    `INSERT INTO jobs (id, employer_id, title, trade, state, industrial_hub, take_home_salary, vacancies_left, is_active, moderation_status, expires_at, data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now() + interval '30 days', $11)`,
    [id, eid, s.title, s.trade, s.state, s.industrialHub, s.takeHomeSalary, s.vacanciesLeft ?? s.openingsCount, s.isActive ?? true, screening.status, JSON.stringify(data)]
  );
  const job = (await ctx.db.query(`${JOB_SELECT} WHERE j.id = $1`, [id])).rows[0];
  return jobView(job, { owner: true });
}

export async function updateJob(ctx: AppContext, auth: AuthContext | undefined, jobId: string, body: unknown) {
  const eid = employerWriter({ auth });
  const input = parse(jobInput, body);
  const s = splitInput(input);
  const screening = screenJobPosting({ ...input });
  const cur = (await ctx.db.query('SELECT moderation_status FROM jobs WHERE id = $1 AND employer_id = $2', [jobId, eid])).rows[0];
  if (!cur) throw notFound('Job not found.');
  // Only Trust & Safety can lift a pause.
  const moderation = cur.moderation_status === 'Paused' ? 'Paused' : screening.status;
  const data = { ...s.data, moderationReason: screening.reasons.join('; ') || undefined };
  await ctx.db.query(
    `UPDATE jobs SET title=$3, trade=$4, state=$5, industrial_hub=$6, take_home_salary=$7, vacancies_left=$8, is_active=$9,
            moderation_status=$10, expires_at = now() + interval '30 days', data=$11, updated_at=now()
      WHERE id=$1 AND employer_id=$2`,
    [jobId, eid, s.title, s.trade, s.state, s.industrialHub, s.takeHomeSalary, s.vacanciesLeft ?? s.openingsCount, s.isActive ?? true, moderation, JSON.stringify(data)]
  );
  const job = (await ctx.db.query(`${JOB_SELECT} WHERE j.id = $1`, [jobId])).rows[0];
  return jobView(job, { owner: true });
}
