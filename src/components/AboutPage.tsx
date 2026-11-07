import React, { useMemo } from 'react';
import {
  Building2,
  Bus,
  CheckCircle2,
  Clock,
  Factory,
  GraduationCap,
  Home,
  Info,
  MapPin,
  ShieldCheck,
  Utensils,
  Wallet,
  Flag,
  BadgeIndianRupee,
} from 'lucide-react';
import type { JobListing } from '../types';
import type { TFunction } from '../data/translations';
import { SAMPLE_LISTINGS, type Perk } from '../data/sampleListings';
import { aboutListings, aboutListingsMode, type AboutListing } from '../modules/discovery';
import { Disclosure } from './ui/Disclosure';

interface Props {
  t: TFunction;
  /** Public jobs from the server. Empty is fine: samples fill in. */
  jobs: JobListing[];
  isSignedIn: boolean;
  onBrowseJobs: () => void;
  onRegisterWorker: () => void;
  onRegisterFactory: () => void;
  onLogin: () => void;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const PERK_ICON: Record<Perk, React.ReactNode> = {
  hostel: <Home className="h-3.5 w-3.5" aria-hidden="true" />,
  mess: <Utensils className="h-3.5 w-3.5" aria-hidden="true" />,
  bus: <Bus className="h-3.5 w-3.5" aria-hidden="true" />,
  'pf-esi': <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />,
};
const PERK_LABEL: Record<Perk, string> = { hostel: 'Hostel', mess: 'Mess', bus: 'Bus', 'pf-esi': 'PF + ESI' };

/** One example or real opening. Samples have no button at all, so nothing can be applied to. */
const ListingCard: React.FC<{ item: AboutListing; t: TFunction; onView: () => void }> = ({ item, t, onView }) => {
  const sample = item.source === 'sample';
  const d = sample
    ? {
        id: item.sample.id,
        title: item.sample.title,
        factory: t('aboutSampleFactory', { name: item.sample.factory }),
        hub: `${item.sample.industrialHub} (${item.sample.state})`,
        pay: item.sample.inHandPerMonth,
        ot: item.sample.overtimePerHour,
        shift: item.sample.shift,
        qual: item.sample.qualification,
        perks: item.sample.perks,
      }
    : {
        id: item.job.id,
        title: item.job.title,
        factory: item.job.companyName,
        hub: `${item.job.industrialHub} (${item.job.state})`,
        pay: item.job.takeHomeSalary,
        ot: item.job.overtimeHourlyRate,
        shift: item.job.shiftPattern,
        qual: item.job.minQualification,
        perks: [
          item.job.facilities?.hasHostel ? 'hostel' : null,
          item.job.facilities?.hasSubsidizedMess ? 'mess' : null,
          item.job.facilities?.hasBusPickup ? 'bus' : null,
        ].filter(Boolean) as Perk[],
      };
  const headingId = `about-listing-${d.id}`;

  return (
    <article
      aria-labelledby={headingId}
      data-listing={sample ? 'sample' : 'live'}
      className={`card flex flex-col gap-3 p-4 sm:p-5 ${sample ? 'border-dashed' : ''}`}
    >
      <p>
        {sample ? (
          <span className="badge">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            {t('aboutSampleTag')}
          </span>
        ) : (
          <span className="badge badge-verified">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {t('aboutLiveTag')}
          </span>
        )}
      </p>
      <div className="space-y-1">
        <h3 id={headingId} className="text-lg font-extrabold leading-snug text-slate-900">
          {d.title}
        </h3>
        <p className="inline-flex items-center gap-1.5 text-body font-semibold text-slate-700">
          <Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {d.factory}
        </p>
      </div>
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span className="text-2xl font-extrabold tabular-nums text-[var(--sk-green-text)]">
          {t('inHandPerMonth', { amount: d.pay.toLocaleString('en-IN') })}
        </span>
        <span className="text-body font-semibold tabular-nums text-slate-700">{t('otPerHour', { rate: d.ot })}</span>
      </p>
      <ul className="space-y-1.5 text-body text-slate-700">
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {d.hub}
        </li>
        <li className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {d.shift}
        </li>
        <li className="flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {d.qual}
        </li>
      </ul>
      {d.perks.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {d.perks.map((p) => (
            <li key={p} className="badge">
              {PERK_ICON[p]}
              {PERK_LABEL[p]}
            </li>
          ))}
        </ul>
      )}
      {!sample && (
        <button type="button" onClick={onView} className="btn btn-worker mt-auto">
          {t('aboutViewJob')}
        </button>
      )}
    </article>
  );
};

const Steps: React.FC<{ title: string; icon: React.ReactNode; tone: 'worker' | 'employer'; items: string[] }> = ({
  title,
  icon,
  tone,
  items,
}) => (
  <section
    className={`card space-y-3 border-l-4 p-5 ${tone === 'employer' ? 'border-l-[var(--sk-blue)]' : 'border-l-[var(--sk-amber)]'}`}
  >
    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
      {icon}
      {title}
    </h3>
    <ol className="space-y-3">
      {items.map((text, i) => (
        <li key={i} className="flex items-start gap-3 text-body text-slate-800">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-extrabold tabular-nums text-white"
          >
            {i + 1}
          </span>
          <span className="pt-0.5">{text}</span>
        </li>
      ))}
    </ol>
  </section>
);

export const AboutPage: React.FC<Props> = ({
  t,
  jobs,
  isSignedIn,
  onBrowseJobs,
  onRegisterWorker,
  onRegisterFactory,
  onLogin,
}) => {
  const items = useMemo(() => aboutListings(jobs, SAMPLE_LISTINGS), [jobs]);
  const mode = aboutListingsMode(items);
  const listingsNote =
    mode === 'live' ? t('aboutListingsLive') : mode === 'mixed' ? t('aboutListingsMixed') : t('aboutListingsSample');

  const promises = [
    { icon: <Wallet className="h-5 w-5" aria-hidden="true" />, title: t('aboutP1Title'), body: t('aboutP1Body') },
    { icon: <BadgeIndianRupee className="h-5 w-5" aria-hidden="true" />, title: t('aboutP2Title'), body: t('aboutP2Body') },
    { icon: <Flag className="h-5 w-5" aria-hidden="true" />, title: t('aboutP3Title'), body: t('aboutP3Body') },
  ];
  const faqs = [1, 2, 3, 4].map((n) => ({ q: t(`aboutQ${n}`), a: t(`aboutA${n}`) }));

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <header className="space-y-4">
        <p className="text-meta font-bold uppercase tracking-wider text-[var(--sk-amber-text)]">{t('aboutEyebrow')}</p>
        <h1 className="max-w-3xl text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">{t('aboutTitle')}</h1>
        <p className="max-w-2xl text-lg text-slate-700">{t('aboutLead')}</p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <button type="button" onClick={onBrowseJobs} className="btn btn-worker sm:min-w-48">
            {t('aboutCtaJobs')}
          </button>
          <button type="button" onClick={onRegisterFactory} className="btn btn-employer sm:min-w-48">
            <Factory className="h-4 w-4" aria-hidden="true" />
            {t('aboutCtaFactory')}
          </button>
        </div>
      </header>

      <section aria-labelledby="about-how" className="space-y-4">
        <h2 id="about-how" className="text-2xl font-extrabold text-slate-900">
          {t('aboutHowTitle')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Steps
            tone="worker"
            title={t('aboutWorkersHeading')}
            icon={<CheckCircle2 className="h-5 w-5 text-[var(--sk-amber-text)]" aria-hidden="true" />}
            items={[t('aboutW1'), t('aboutW2'), t('aboutW3'), t('aboutW4')]}
          />
          <Steps
            tone="employer"
            title={t('aboutFactoriesHeading')}
            icon={<Factory className="h-5 w-5 text-[var(--sk-blue-text)]" aria-hidden="true" />}
            items={[t('aboutF1'), t('aboutF2'), t('aboutF3'), t('aboutF4')]}
          />
        </div>
      </section>

      <section aria-labelledby="about-listings" className="space-y-4">
        <div className="space-y-1">
          <h2 id="about-listings" className="text-2xl font-extrabold text-slate-900">
            {t('aboutListingsTitle')}
          </h2>
          <p role="note" className="text-body font-semibold text-slate-800">
            {listingsNote}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <ListingCard
              key={item.source === 'live' ? item.job.id : item.sample.id}
              item={item}
              t={t}
              onView={onBrowseJobs}
            />
          ))}
        </div>
        <p className="flex items-start gap-2 text-body text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
          <span>{t('aboutGateNote')}</span>
        </p>
      </section>

      <section aria-labelledby="about-promises" className="space-y-4">
        <h2 id="about-promises" className="text-2xl font-extrabold text-slate-900">
          {t('aboutPromisesTitle')}
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {promises.map((p) => (
            <li key={p.title} className="card space-y-2 p-5">
              <p className="flex items-center gap-2 text-body font-extrabold text-slate-900">
                <span className="text-[var(--sk-green-text)]">{p.icon}</span>
                {p.title}
              </p>
              <p className="text-body text-slate-700">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="about-faq" className="space-y-3">
        <h2 id="about-faq" className="text-2xl font-extrabold text-slate-900">
          {t('aboutFaqTitle')}
        </h2>
        <div className="card divide-y divide-slate-200 px-4 py-1">
          {faqs.map((f) => (
            <div key={f.q} className="py-2">
              <Disclosure label={f.q}>
                <p className="text-body text-slate-700">{f.a}</p>
              </Disclosure>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-4 bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold">{t('aboutBottomTitle')}</h2>
          <p className="text-body text-slate-300">{t('aboutBottomBody')}</p>
        </div>
        {!isSignedIn && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onRegisterWorker} className="btn btn-worker">
              {t('aboutRegisterWorker')}
            </button>
            <button type="button" onClick={onLogin} className="btn btn-secondary">
              {t('aboutLoginLink')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
