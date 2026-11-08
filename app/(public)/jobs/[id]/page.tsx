import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { COOKIE_NAME, loadAuth } from '../../../../server/auth/session';
import { publicJobPage } from '../../../../server/services/publicJobs';
import { getServerContext } from '../../../../server/runtime';
import { JobApplyButton } from './JobApplyButton';

export const dynamic = 'force-dynamic';

interface JobPageProps {
  params: Promise<{ id: string }>;
}

const loadJob = cache(async (id: string) => publicJobPage(id));
const inr = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadJob(id);
  const job = data?.job;
  if (!job) return { title: 'Job not found | Shramkart' };
  const description = `${job.title} at ${job.companyName} in ${job.industrialHub}, ${job.state}. Take-home pay ${inr(job.takeHomeSalary)} per month.`;
  return {
    title: `${job.title} in ${job.industrialHub} | Shramkart`,
    description,
    openGraph: { title: `${job.title} | Shramkart`, description, type: 'website' },
  };
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;
  const data = await loadJob(id);
  const job = data?.job;
  if (!job || !data) notFound();

  const ctx = await getServerContext();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const auth = await loadAuth(ctx, token);
  const login = `/login?role=worker&next=${encodeURIComponent(`/jobs/${id}`)}`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: `${job.title} at ${job.companyName} in ${job.industrialHub}, ${job.state}. Take-home pay ${inr(job.takeHomeSalary)} per month.`,
    datePosted: data.datePosted,
    validThrough: data.validThrough,
    employmentType: 'FULL_TIME',
    hiringOrganization: { '@type': 'Organization', name: job.companyName },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.industrialHub,
        addressRegion: job.state,
        addressCountry: 'IN',
      },
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: { '@type': 'QuantitativeValue', value: job.takeHomeSalary, unitText: 'MONTH' },
    },
  };
  return (
    <main className="min-h-screen bg-[var(--sk-canvas)]">
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD built from our own data, with "<" escaped so it cannot close the tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <header className="border-b border-[var(--sk-border)] bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6" aria-label="Main">
          <Link href="/" className="text-lg font-extrabold text-[var(--sk-ink)]">Shramkart</Link>
          <Link href="/jobs" className="text-sm font-semibold text-[var(--sk-body)] hover:text-[var(--sk-ink)]">All jobs</Link>
        </nav>
      </header>
      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Link href="/jobs" className="text-sm font-semibold text-[var(--sk-blue-text)] hover:underline">Back to jobs</Link>
        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            <p className="eyebrow">Verified factory opening</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--sk-ink)]">{job.title}</h1>
            <p className="mt-2 text-lg font-semibold text-[var(--sk-body)]">{job.companyName}</p>
            <dl className="mt-6 grid gap-4 border-y border-[var(--sk-border)] py-5 sm:grid-cols-2">
              <div><dt className="field-label">Location</dt><dd className="font-semibold">{job.industrialHub}, {job.state}</dd></div>
              <div><dt className="field-label">Take-home pay</dt><dd className="font-bold text-[var(--sk-green-text)]">{inr(job.takeHomeSalary)} / month</dd></div>
                <div><dt className="field-label">Openings</dt><dd className="font-semibold">{job.vacanciesLeft}</dd></div>
              {job.minQualification && <div><dt className="field-label">Qualification</dt><dd className="font-semibold">{job.minQualification}</dd></div>}
                {job.experienceRequired && <div><dt className="field-label">Experience</dt><dd className="font-semibold">{job.experienceRequired}</dd></div>}
              {job.shiftPattern && <div><dt className="field-label">Shift</dt><dd className="font-semibold">{job.shiftPattern}</dd></div>}
            </dl>
          </div>
          <aside className="h-fit border-l-4 border-l-[var(--sk-amber)] bg-white p-5">
            <p className="font-bold text-[var(--sk-ink)]">Interested in this role?</p>
            <p className="mt-2 text-sm text-[var(--sk-body)]">Apply directly to the factory. Your phone number is shared only after you apply.</p>
            {auth?.role === 'worker'
              ? <JobApplyButton jobId={job.id} />
              : <Link href={login} className="btn btn-worker mt-4 w-full">Sign in as a worker to apply</Link>}
          </aside>
        </div>
      </article>
    </main>
  );
}