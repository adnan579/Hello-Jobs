import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import App from '../../../src/App';
import { COOKIE_NAME, loadAuth } from '../../../server/auth/session';
import { languageForCookie } from '../../../src/utils/routes';
import { buildBootstrap } from '../../../server/services/bootstrap';
import { publicBootstrap, publicJobList } from '../../../server/services/publicJobs';
import { getServerContext } from '../../../server/runtime';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Manufacturing Jobs | Shramkart',
  description: 'Browse verified manufacturing jobs with clear take-home pay and location details.',
};

interface JobsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const language = languageForCookie(cookieStore.get('hj_language')?.value);
  const mode = typeof query.mode === 'string' ? query.mode : 'jobs';
  const hub = typeof query.hub === 'string' ? query.hub.trim() : '';
  let jobs: Awaited<ReturnType<typeof publicJobList>> = [];
  let drives: NonNullable<Awaited<ReturnType<typeof publicBootstrap>>['hiringDrives']> = [];
  let unavailable = false;

  try {
    const ctx = await getServerContext();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const auth = await loadAuth(ctx, token);
    if (mode === 'jobs' && auth?.role === 'worker') {
      const data = await buildBootstrap(ctx, auth);
      return <App initialRole="worker" initialLanguage={language} initialData={{ jobs: data.jobs, stats: data.stats, hiringDrives: data.hiringDrives }} />;
    }
    if (mode === 'drives') {
      const data = await publicBootstrap();
      drives = (data.hiringDrives ?? []).filter((drive) => !hub || `${drive.industrialHub} ${drive.venue}`.toLowerCase().includes(hub.toLowerCase()));
    } else {
      jobs = await publicJobList(hub || undefined, mode === 'iti');
    }
  } catch (error) {
    unavailable = true;
    console.error('[public-jobs]', error instanceof Error ? error.message : error);
  }

  return (
    <main className="min-h-screen bg-[var(--sk-canvas)]">
      <header className="border-b border-[var(--sk-border)] bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6" aria-label="Main">
          <Link href="/" className="text-lg font-extrabold text-[var(--sk-ink)]">Shramkart</Link>
          <div className="flex gap-4 text-sm font-semibold">
            <Link href="/about" className="text-[var(--sk-body)] hover:text-[var(--sk-ink)]">About</Link>
            <Link href="/employers" className="text-[var(--sk-body)] hover:text-[var(--sk-ink)]">For employers</Link>
          </div>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <header className="mb-6 max-w-3xl">
          <p className="eyebrow">Verified opportunities</p>
          <h1 className="mt-2 text-3xl font-extrabold text-[var(--sk-ink)]">Manufacturing jobs</h1>
          <p className="mt-2 text-body text-[var(--sk-body)]">Open roles with clear take-home pay and location details.</p>
        </header>
        <form method="get" className="mb-8 flex flex-wrap items-end gap-3 border-y border-[var(--sk-border)] py-4">
          <label className="field-label min-w-48 flex-1">Industrial hub or state
            <input className="field mt-1" name="hub" defaultValue={hub} placeholder="e.g. Pune" />
          </label>
          <label className="field-label min-w-44">Listing type
            <select className="field mt-1" name="mode" defaultValue={mode === 'drives' ? 'drives' : 'jobs'}>
              <option value="jobs">All jobs</option>
              <option value="iti">ITI / certificate roles</option>
              <option value="drives">Hiring drives</option>
            </select>
          </label>
          <button className="btn btn-worker" type="submit">Search</button>
        </form>

        {unavailable ? (
          <p role="status" className="border-l-4 border-amber-500 bg-white p-4 text-body text-[var(--sk-body)]">Job listings are temporarily unavailable. Please try again shortly.</p>
        ) : mode === 'drives' ? (
          drives.length ? (
            <ul className="divide-y divide-[var(--sk-border)] border-y border-[var(--sk-border)]">
              {drives.map((drive) => (
                <li key={drive.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--sk-ink)]">{drive.title}</h2>
                    <p className="mt-1 text-body text-[var(--sk-body)]">{drive.companyName} · {drive.industrialHub} · {drive.date}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--sk-muted)]">{drive.seatsAvailable ?? drive.targetOpenings} openings</p>
                </li>
              ))}
            </ul>
          ) : <p className="py-8 text-body text-[var(--sk-muted)]">No hiring drives match this location.</p>
        ) : jobs.length ? (
          <ul className="divide-y divide-[var(--sk-border)] border-y border-[var(--sk-border)]">
            {jobs.map((job) => (
              <li key={job.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-[var(--sk-ink)]"><Link href={`/jobs/${encodeURIComponent(job.id)}`} className="hover:underline">{job.title}</Link></h2>
                  <p className="mt-1 text-body text-[var(--sk-body)]">{job.companyName} · {job.industrialHub}, {job.state}</p>
                  <p className="mt-1 text-sm text-[var(--sk-muted)]">{job.vacanciesLeft} openings · {job.postedAt}</p>
                </div>
                <p className="font-bold tabular-nums text-[var(--sk-green-text)]">{inr(job.takeHomeSalary)} / month</p>
              </li>
            ))}
          </ul>
        ) : <p className="py-8 text-body text-[var(--sk-muted)]">No verified jobs match this location.</p>}
      </div>
    </main>
  );
}