import type { AppContext } from '../types.ts';
import { buildBootstrap, PUBLIC_JOB_WHERE } from './bootstrap.ts';
import { getServerContext } from '../runtime.ts';
import { JOB_SELECT, jobView } from './serialize.ts';

export async function listPublicJobs(ctx: AppContext, hub?: string, itiOnly = false) {
  const params: string[] = [];
  const filters = [PUBLIC_JOB_WHERE];
  if (hub?.trim()) {
    params.push(`%${hub.trim()}%`);
    filters.push(`(j.industrial_hub ILIKE $${params.length} OR j.state ILIKE $${params.length})`);
  }
  if (itiOnly) filters.push(`j.data->>'noCertificateRequired' IS DISTINCT FROM 'true'`);
  const { rows } = await ctx.db.query(
    `${JOB_SELECT} WHERE ${filters.join(' AND ')} ORDER BY j.created_at DESC LIMIT 100`,
    params
  );
  return rows.map((row) => jobView(row));
}

export async function publicJobById(ctx: AppContext, id: string) {
  const { rows } = await ctx.db.query(`${JOB_SELECT} WHERE j.id = $1 AND ${PUBLIC_JOB_WHERE}`, [id]);
  return rows[0] ? jobView(rows[0]) : null;
}

export async function publicJobPage(id: string) {
  const ctx = await getServerContext();
  const { rows } = await ctx.db.query(`${JOB_SELECT} WHERE j.id = $1 AND ${PUBLIC_JOB_WHERE}`, [id]);
  const row = rows[0];
  if (!row) return null;
  return {
    job: jobView(row),
    datePosted: new Date(row.created_at).toISOString(),
    validThrough: row.expires_at ? new Date(row.expires_at).toISOString() : undefined,
  };
}

export async function publicJobIds(ctx: AppContext) {
  const { rows } = await ctx.db.query<{ id: string }>(
    `SELECT j.id FROM jobs j JOIN employers e ON e.id = j.employer_id WHERE ${PUBLIC_JOB_WHERE} ORDER BY j.created_at DESC LIMIT 500`
  );
  return rows.map((row) => row.id);
}

export async function publicBootstrap() {
  const data = await buildBootstrap(await getServerContext(), undefined);
  return { jobs: data.jobs, stats: data.stats, hiringDrives: data.hiringDrives };
}

export async function publicJobList(hub?: string, itiOnly = false) {
  return listPublicJobs(await getServerContext(), hub, itiOnly);
}

export async function publicJob(id: string) {
  return publicJobById(await getServerContext(), id);
}

export async function publicJobIndex() {
  return publicJobIds(await getServerContext());
}