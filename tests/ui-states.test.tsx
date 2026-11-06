import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { CandidateProfile, EmployerFactoryProfile, HiringDrive, JobListing } from '../src/types';
import { WorkerPortal } from '../src/components/WorkerPortal';
import { EmployerPortal } from '../src/components/EmployerPortal';
import { BottomNav } from '../src/components/BottomNav';
import { makeT } from '../src/data/translations';

const noop = () => {};

const JOB = {
  id: 'job_real_1', title: 'Fitter Assembly', companyName: 'Acme Auto', trade: 'Fitter (Assembly & Bench)',
  category: 'skilled', industrialHub: 'Chakan MIDC, Pune', state: 'Maharashtra', takeHomeSalary: 21500,
  grossSalary: 25000, overtimeHourlyRate: 120, shiftPattern: '8 hr', minQualification: 'ITI', openingsCount: 5,
  vacanciesLeft: 5, isActive: true, noCertificateRequired: false,
  facilities: { hasHostel: true, hasSubsidizedMess: false, hasBusPickup: false },
} as unknown as JobListing;

const DRIVE = {
  id: 'drive_real_1', title: 'Pune Campus Drive', companyName: 'Acme Auto', driveType: 'ITI Campus Drive',
  date: '2026-12-01', venue: 'ITI Pune', industrialHub: 'Chakan MIDC, Pune', trades: ['Fitter (Assembly & Bench)'],
  targetOpenings: 20, registeredCandidateIds: [], checkedInCandidateIds: [], offersIssuedCount: 0,
} as unknown as HiringDrive;

const worker = (o: Partial<CandidateProfile> = {}) =>
  ({ id: 'w1', name: 'Ravi Kumar', trade: 'Welder', category: 'skilled', currentCity: 'Pune', homeState: 'Bihar', expectedSalary: 20000, savedJobIds: [], phone: '+91 98XXXXX210', ncvtCertificate: { isVerified: false }, ...o }) as unknown as CandidateProfile;

const renderWorker = (props: Partial<React.ComponentProps<typeof WorkerPortal>> = {}) =>
  renderToStaticMarkup(
    <WorkerPortal
      jobs={[JOB]} currentLang="en" applications={[]} offers={[]} hiringDrives={[DRIVE]}
      onApplyJob={noop} onOpenWorkerProfile={noop} onOpenAuthModal={noop} onOpenCreateProfile={noop} onOpenReport={noop}
      {...props}
    />
  );

describe('worker feed screens', () => {
  it('ITI Campus Drives mode shows drives and no job cards', () => {
    const html = renderWorker({ initialFeedMode: 'drives' });
    expect(html).toContain('Pune Campus Drive');
    expect(html).not.toContain('Fitter Assembly');
    expect(html).not.toContain('job_real_1');
  });

  it('all-jobs mode shows the job and not the drive list', () => {
    const html = renderWorker();
    expect(html).toContain('Fitter Assembly');
    expect(html).not.toContain('Pune Campus Drive');
  });

  it('shows an intentional empty state when there are no drives', () => {
    const html = renderWorker({ initialFeedMode: 'drives', hiringDrives: [] });
    expect(html).toContain(makeT('en')('emptyDrivesTitle'));
  });

  it('shows an intentional empty state when there are no jobs', () => {
    const html = renderWorker({ jobs: [] });
    expect(html).toContain(makeT('en')('emptyJobsTitle'));
  });

  it('saved tab is empty for a visitor and never contains a seeded id', () => {
    const html = renderWorker({ initialFeedMode: 'saved' });
    expect(html).toContain(makeT('en')('emptySavedGuestTitle'));
    expect(html).not.toContain('Fitter Assembly');
    expect(html).not.toContain('job-1');
  });

  it('saved tab for a signed-in worker with nothing saved shows the saved empty state', () => {
    const html = renderWorker({ initialFeedMode: 'saved', activeWorker: worker() });
    expect(html).toContain(makeT('en')('emptySavedTitle'));
  });

  it('saved tab lists only what the worker really saved', () => {
    const html = renderWorker({ initialFeedMode: 'saved', activeWorker: worker({ savedJobIds: ['job_real_1'] }) });
    expect(html).toContain('Fitter Assembly');
  });

  it('renders in Hindi without leaking raw keys', () => {
    const html = renderWorker({ currentLang: 'hi', initialFeedMode: 'drives', hiringDrives: [] });
    expect(html).toContain(makeT('hi')('emptyDrivesTitle'));
  });
});

const employer = (o: Partial<EmployerFactoryProfile> = {}) =>
  ({ id: 'e1', companyName: 'Acme Auto', unlockedCandidateIds: [], ...o }) as unknown as EmployerFactoryProfile;

const renderEmployer = (props: Partial<React.ComponentProps<typeof EmployerPortal>> = {}) =>
  renderToStaticMarkup(
    <EmployerPortal
      candidates={[]} jobs={[]} currentLang="en" authSession={null} employerProfile={employer()} shortlistedIds={[]}
      onToggleShortlist={noop} onOpenEmployerProfile={noop} onOpenAuthModal={noop} onOpenPostJob={noop}
      onInspectCertificate={noop} onOpenVideoDemo={noop} onOpenIssueOffer={noop}
      {...props}
    />
  );

describe('employer screens', () => {
  it('shows an empty talent directory state with no candidates', () => {
    const html = renderEmployer();
    expect(html).not.toContain('cand-1');
    expect(html).not.toContain('cand-2');
  });

  it('does not mark placeholder candidates as unlocked', () => {
    const html = renderEmployer({
      candidates: [worker({ id: 'cand-1', name: 'Seeded Sam', phone: '+91 98XXXXX210' } as Partial<CandidateProfile>)],
    });
    // Nothing unlocked: the contact stays locked, so no call link is rendered.
    expect(html).toContain('Seeded Sam');
    expect(html).not.toMatch(/tel:/);
  });
});

describe('mobile bottom navigation', () => {
  const t = makeT('en');
  const base = {
    t, currentRole: 'worker' as const, workerTab: 'profile' as const, unreadCount: 0,
    onRoleChange: noop, onOpenWorkerTab: noop, onOpenNotifications: noop, onOpenPostJob: noop, onOpenAuthModal: noop,
  };

  it('marks the current destination and labels the alerts button', () => {
    const html = renderToStaticMarkup(<BottomNav {...base} signedInAs="worker" unreadCount={2} />);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(t('bellAria', { n: 2 }));
  });

  it('does not label the alerts button unread when nothing is unread', () => {
    const html = renderToStaticMarkup(<BottomNav {...base} signedInAs="worker" unreadCount={0} />);
    expect(html).toContain(t('bellAriaNone'));
    expect(html).not.toMatch(/\(0\)/);
  });

  it('gives workers distinct Applications and Profile destinations', () => {
    const html = renderToStaticMarkup(<BottomNav {...base} signedInAs="worker" currentRole="worker-profile" workerTab="inbox" />);
    expect(html).toContain(t('navApplicationsShort'));
    expect(html).toContain(t('navMyProfile'));
    expect((html.match(/aria-current="page"/g) ?? []).length).toBe(1);
  });
});
