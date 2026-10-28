import React from 'react';
import {
  UserRole,
  Language,
  AuthSession,
  CandidateProfile,
  EmployerFactoryProfile,
  JobListing,
} from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  ShieldCheck,
  Users,
  Factory,
  ArrowRight,
  UserPlus,
  LogIn,
  Building2,
  MapPin,
  Briefcase,
  Home,
  Check,
  X as XIcon,
  ChevronDown,
} from 'lucide-react';

interface Props {
  currentLang: Language;
  authSession: AuthSession | null;
  activeWorker?: CandidateProfile;
  employerProfile: EmployerFactoryProfile;
  jobs?: JobListing[];
  candidates?: CandidateProfile[];
  stats?: { workers: number; factories: number; jobs: number };
  onSelectRole: (role: UserRole) => void;
  onOpenCalculator: () => void;
  onOpenReport: () => void;
  onOpenAuthModal: (
    initialTab: 'worker' | 'employer',
    initialMode?: 'login' | 'register'
  ) => void;
  onOpenLegalModal?: (tab?: 'privacy' | 'terms') => void;
}

export const DualLanding: React.FC<Props> = ({
  currentLang,
  authSession,
  activeWorker,
  jobs = [],
  candidates = [],
  stats,
  onSelectRole,
  onOpenCalculator,
  onOpenReport,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const workerCount = stats?.workers ?? candidates.length;
  const liveJobs = jobs.filter((j) => j.isActive !== false);
  const openSeats = liveJobs.reduce((acc, j) => acc + (j.vacanciesLeft || 0), 0);
  const featured = liveJobs[0];
  const isWorker = authSession?.role === 'worker' && Boolean(activeWorker);
  const isEmployer = authSession?.role === 'employer';

  const workerCta = isWorker ? (
    <button onClick={() => onSelectRole('worker')} className="btn-amber">
      <Briefcase className="w-4 h-4" /> Open jobs feed
    </button>
  ) : (
    <button onClick={() => onOpenAuthModal('worker', 'register')} className="btn-amber">
      <UserPlus className="w-4 h-4" /> I am looking for a job
    </button>
  );
  const employerCta = isEmployer ? (
    <button onClick={() => onSelectRole('employer-profile')} className="btn-blue">
      <Factory className="w-4 h-4" /> Open factory dashboard
    </button>
  ) : (
    <button onClick={() => onOpenAuthModal('employer', 'register')} className="btn-blue">
      <Factory className="w-4 h-4" /> I am hiring for a factory
    </button>
  );

  const workerSteps = [
    ['Register with your phone number', 'Pick your trade and city. No resume and no fee.'],
    ['See the pay before you apply', 'Every job shows monthly in-hand pay, overtime rate, shift and hostel.'],
    ['Apply directly to the factory', 'One tap. The factory sees you, not a contractor.'],
    ['Get a written offer', 'The offer letter states your in-hand pay. Accept it in the app.'],
  ];
  const factorySteps = [
    ['Register with your GSTIN', 'Our team checks it before your jobs go live.'],
    ['Post what you need', 'Trade, openings, in-hand pay and shift. Posting is free.'],
    ['Find and invite workers', 'Search by trade and city, or review who applied.'],
    ['Send offers and confirm joining', 'Joining counts only when both worker and factory confirm.'],
  ];
  const compare: [string, string, string][] = [
    ['Who pays the worker', 'Often the contractor, after a cut', 'The factory, directly'],
    ['Pay shown before joining', 'Usually a verbal promise', 'In-hand pay on every job post'],
    ['Fee to get the job', 'Sometimes asked', 'Never. Report anyone who asks'],
    ['Is the factory real', 'Hard to know', 'GSTIN checked by our team'],
    ['Offer in writing', 'Rare', 'Digital offer letter with the pay'],
  ];
  const faqs: [string, React.ReactNode][] = [
    ['Does it cost anything for workers?', 'No. Registering, applying and accepting offers are free. Nobody on Hello Jobs is allowed to ask a worker for money.'],
    ['Do I need an ITI certificate?', 'No. Helper, packer and loader jobs do not need one. If you have an ITI certificate, add it and our team checks it, which helps factories trust your profile.'],
    ['How do I know a factory is real?', 'A factory\'s jobs are shown only after our team checks its GSTIN. Jobs from unchecked factories stay hidden.'],
    [
      'Someone asked me for a fee. What do I do?',
      <>Do not pay. <button onClick={onOpenReport} className="font-bold text-blue-700 underline underline-offset-2">Report the fee demand</button> and our team will review it. You can report without logging in.</>,
    ],
    ['What does it cost a factory?', 'Posting jobs is free. Contacting a worker directly uses one credit. Newly verified factories get welcome credits.'],
  ];

  return (
    <div className="pb-24">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-14 items-center">
          <div>
            <p className="inline-flex items-start gap-2 text-sm font-semibold text-slate-600 max-w-xl">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-700" />
              <span>{t.heroBadge}</span>
            </p>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-[-0.03em] leading-[1.05] text-slate-950">
              Direct Hands for Indian Industry. Zero Middlemen. 100% Fair Pay.
            </h1>
            <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-xl">{t.heroMainDesc}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {workerCta}
              {employerCta}
            </div>
            {!authSession && (
              <p className="mt-4 text-sm text-slate-500">
                Already registered?{' '}
                <button onClick={() => onOpenAuthModal('worker', 'login')} className="font-bold text-slate-900 underline underline-offset-2">Worker login</button>
                {' · '}
                <button onClick={() => onOpenAuthModal('employer', 'login')} className="font-bold text-slate-900 underline underline-offset-2">Factory login</button>
              </p>
            )}
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-slate-200 pt-6 tabular-nums">
              {workerCount > 0 && <div><dt className="text-sm text-slate-500">Workers registered</dt><dd className="text-2xl font-extrabold text-slate-950">{workerCount}</dd></div>}
              {liveJobs.length > 0 && <div><dt className="text-sm text-slate-500">Open jobs</dt><dd className="text-2xl font-extrabold text-slate-950">{liveJobs.length}{openSeats > 0 && <span className="text-sm font-semibold text-slate-500"> ({openSeats} seats)</span>}</dd></div>}
              <div><dt className="text-sm text-slate-500">Cost to workers</dt><dd className="text-2xl font-extrabold text-emerald-700">₹0</dd></div>
              <div><dt className="text-sm text-slate-500">Factories shown</dt><dd className="text-2xl font-extrabold text-slate-950">GSTIN checked</dd></div>
            </dl>
          </div>

          {/* A real listing, the way a worker sees it */}
          <div className="relative">
            <div className="rounded-2xl bg-white border border-slate-300 shadow-[0_20px_50px_-24px_rgba(16,24,40,0.35)] overflow-hidden">
              <div className="hv-stripe h-2.5" aria-hidden="true" />
              <div className="p-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{featured ? 'Open now' : 'Example listing, not a real job'}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700"><ShieldCheck className="w-4 h-4" />Factory GSTIN checked</span>
                </div>
                <h2 className="mt-3 text-xl font-extrabold text-slate-950 leading-snug">{featured?.title ?? 'Fitter, Assembly Line'}</h2>
                <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5"><Building2 className="w-4 h-4 text-slate-400" />{featured?.companyName ?? 'Sample Auto Components Pvt Ltd'}</p>
                <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" />{featured ? `${featured.industrialHub} (${featured.state})` : 'Chakan MIDC, Pune (Maharashtra)'}</p>
                <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 tabular-nums">
                  <div className="text-sm text-slate-500">In-hand pay every month</div>
                  <div className="text-3xl font-extrabold text-slate-950">{featured ? `₹${featured.takeHomeSalary.toLocaleString('en-IN')}` : '₹21,500'}</div>
                  <div className="mt-1 text-sm text-slate-600">{featured ? `Overtime ₹${featured.overtimeHourlyRate} an hour` : 'Overtime ₹120 an hour'}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  {(featured ? featured.facilities.hasHostel : true) && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700"><Home className="w-3.5 h-3.5" />Hostel</span>}
                  {featured?.noCertificateRequired && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">No certificate needed</span>}
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{featured ? `${featured.vacanciesLeft} seats open` : '5 seats open'}</span>
                </div>
                {featured && (
                  <button onClick={() => onSelectRole('worker')} className="btn-amber mt-5 w-full justify-center">View and apply <ArrowRight className="w-4 h-4" /></button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: two real sequences */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 max-w-2xl">One platform, two simple paths. No contractor in between.</h2>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {[
            { who: 'If you are looking for work', steps: workerSteps, tone: 'amber', cta: workerCta, icon: <Users className="w-5 h-5" /> },
            { who: 'If you run a factory', steps: factorySteps, tone: 'blue', cta: employerCta, icon: <Factory className="w-5 h-5" /> },
          ].map((lane) => (
            <div key={lane.who} className={`rounded-2xl bg-white border border-slate-200 border-t-4 ${lane.tone === 'amber' ? 'border-t-amber-400' : 'border-t-blue-600'} p-6 sm:p-7`}>
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-950">{lane.icon}{lane.who}</h3>
              <ol className="mt-5 space-y-5">
                {lane.steps.map(([title, body], i) => (
                  <li key={title} className="flex gap-4">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${lane.tone === 'amber' ? 'bg-amber-400 text-slate-950' : 'bg-blue-600 text-white'}`}>{i + 1}</span>
                    <div><div className="font-bold text-slate-900">{title}</div><div className="text-sm text-slate-600 leading-relaxed">{body}</div></div>
                  </li>
                ))}
              </ol>
              <div className="mt-6">{lane.cta}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Live openings */}
      {liveJobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Latest openings from checked factories</h2>
            <button onClick={() => onSelectRole('worker')} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 hover:text-amber-700">All {liveJobs.length} jobs <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {liveJobs.slice(0, 3).map((job) => (
              <article key={job.id} className="flex flex-col justify-between rounded-xl bg-white border border-slate-200 p-5">
                <div>
                  <div className="flex items-baseline justify-between gap-2 tabular-nums">
                    <span className="text-xl font-extrabold text-slate-950">₹{job.takeHomeSalary.toLocaleString('en-IN')}<span className="text-sm font-semibold text-slate-500"> a month</span></span>
                    <span className="text-xs font-semibold text-slate-600">OT ₹{job.overtimeHourlyRate}/hr</span>
                  </div>
                  <h3 className="mt-2 font-bold text-slate-900">{job.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{job.companyName}</p>
                  <p className="text-sm text-slate-500">{job.industrialHub}, {job.state}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold">
                    {job.noCertificateRequired && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">No certificate needed</span>}
                    {job.facilities.hasHostel && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">Hostel</span>}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-sm font-semibold text-slate-600 tabular-nums">{job.vacanciesLeft} seats open</span>
                  <button onClick={() => onSelectRole('worker')} className="btn-amber !py-2 !px-3.5 !text-xs">View and apply</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Comparison */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 max-w-2xl">What changes when you hire and work directly</h2>
        <div className="mt-8 space-y-3 md:hidden">
          {compare.map(([topic, them, us]) => (
            <div key={topic} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-bold text-slate-900">{topic}</div>
              <div className="mt-2 flex items-start gap-2 text-sm text-slate-600"><XIcon className="mt-0.5 w-4 h-4 shrink-0 text-red-500" /><span><span className="font-semibold">Contractor:</span> {them}</span></div>
              <div className="mt-1.5 flex items-start gap-2 text-sm font-medium text-slate-900"><Check className="mt-0.5 w-4 h-4 shrink-0 text-emerald-700" /><span><span className="font-bold">Hello Jobs:</span> {us}</span></div>
            </div>
          ))}
        </div>
        <div className="mt-8 hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="px-5 py-3 font-semibold text-slate-500"><span className="sr-only">Topic</span></th>
                <th scope="col" className="px-5 py-3 font-bold text-slate-700">Through a contractor</th>
                <th scope="col" className="px-5 py-3 font-bold text-slate-950 bg-amber-50">On Hello Jobs</th>
              </tr>
            </thead>
            <tbody>
              {compare.map(([topic, them, us]) => (
                <tr key={topic} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-5 py-4 font-bold text-slate-900 align-top">{topic}</th>
                  <td className="px-5 py-4 text-slate-600 align-top"><span className="inline-flex items-start gap-2"><XIcon className="mt-0.5 w-4 h-4 shrink-0 text-red-500" />{them}</span></td>
                  <td className="px-5 py-4 text-slate-900 font-medium bg-amber-50/50 align-top"><span className="inline-flex items-start gap-2"><Check className="mt-0.5 w-4 h-4 shrink-0 text-emerald-700" />{us}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Want to see what a contractor cut costs you over a year?{' '}
          <button onClick={onOpenCalculator} className="font-bold text-slate-900 underline underline-offset-2">Open the take-home salary calculator</button>
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Common questions</h2>
        <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-slate-900">
                {q}
                <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-2 pr-8 text-slate-600 leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      {!authSession && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20">
          <div className="overflow-hidden rounded-2xl bg-slate-950 text-white">
            <div className="hv-stripe h-2.5" aria-hidden="true" />
            <div className="flex flex-wrap items-center justify-between gap-6 p-8 sm:p-10">
              <div className="max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Start in two minutes. Your phone number is all you need.</h2>
                <p className="mt-2 text-slate-300">Workers pay nothing. Factories post for free.</p>
              </div>
              <div className="flex flex-wrap gap-3">{workerCta}{employerCta}</div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
