import { describe, expect, it } from 'vitest';
import type { CandidateProfile, HiringDrive, JobListing, NotificationEvent } from '../src/types';
import { SAMPLE_LISTINGS } from '../src/data/sampleListings';
import {
  ABOUT_LISTING_SLOTS,
  ALL,
  DEFAULT_CANDIDATE_FILTERS,
  DEFAULT_JOB_FILTERS,
  aboutListings,
  aboutListingsMode,
  countActiveCandidateFilters,
  countActiveJobFilters,
  countUnread,
  feedCounts,
  isUnread,
  savedJobIdSet,
  selectCandidates,
  selectJobs,
  toggleId,
  unlockedCandidateIdSet,
} from '../src/modules/discovery';

const job = (o: Partial<JobListing>): JobListing =>
  ({
    id: 'j', title: 'Fitter', companyName: 'Acme', trade: 'Fitter (Assembly & Bench)', category: 'skilled',
    industrialHub: 'Chakan MIDC, Pune', state: 'Maharashtra', takeHomeSalary: 20000, isActive: true,
    noCertificateRequired: false, facilities: { hasHostel: false }, ...o,
  }) as unknown as JobListing;

const cand = (o: Partial<CandidateProfile>): CandidateProfile =>
  ({ id: 'c', name: 'Ravi', trade: 'Welder', category: 'skilled', currentCity: 'Pune', homeState: 'Bihar', expectedSalary: 20000, ...o }) as unknown as CandidateProfile;

const note = (o: Partial<NotificationEvent>): NotificationEvent =>
  ({ id: 'n', title: 't', body: 'b', ...o }) as unknown as NotificationEvent;

const JOBS = [
  job({ id: 'a', category: 'skilled' }),
  job({ id: 'b', category: 'semi-skilled', noCertificateRequired: true, title: 'Packer' }),
  job({ id: 'c', isActive: false, title: 'Closed' }),
];
const DRIVE = { id: 'd1' } as HiringDrive;

describe('job feed modes', () => {
  it('shows no jobs in ITI Campus Drives mode, even when jobs exist', () => {
    expect(selectJobs(JOBS, 'drives', DEFAULT_JOB_FILTERS, new Set(['a']))).toEqual([]);
  });

  it('hides closed jobs everywhere', () => {
    expect(selectJobs(JOBS, 'all', DEFAULT_JOB_FILTERS, new Set()).map((j) => j.id)).toEqual(['a', 'b']);
  });

  it('splits ITI and no-certificate jobs', () => {
    expect(selectJobs(JOBS, 'iti', DEFAULT_JOB_FILTERS, new Set()).map((j) => j.id)).toEqual(['a']);
    expect(selectJobs(JOBS, 'no-cert', DEFAULT_JOB_FILTERS, new Set()).map((j) => j.id)).toEqual(['b']);
  });

  it('counts tabs from live data only', () => {
    expect(feedCounts(JOBS, new Set(['a', 'c', 'ghost']), [DRIVE])).toEqual({
      all: 2, noCert: 1, iti: 1, saved: 1, drives: 1,
    });
  });

  it('returns an empty list for a filter with no match, and one reset restores the feed', () => {
    const f = { ...DEFAULT_JOB_FILTERS, query: 'zzz', hostelOnly: true };
    expect(countActiveJobFilters(f)).toBe(2);
    expect(selectJobs(JOBS, 'all', f, new Set())).toEqual([]);
    expect(countActiveJobFilters(DEFAULT_JOB_FILTERS)).toBe(0);
    expect(selectJobs(JOBS, 'all', DEFAULT_JOB_FILTERS, new Set())).toHaveLength(2);
  });
});

describe('saved jobs', () => {
  it('start empty for a visitor and for a worker who saved nothing', () => {
    expect(savedJobIdSet(undefined).size).toBe(0);
    expect(savedJobIdSet(cand({})).size).toBe(0);
    expect(selectJobs(JOBS, 'saved', DEFAULT_JOB_FILTERS, savedJobIdSet(undefined))).toEqual([]);
  });

  it('never include a placeholder id', () => {
    expect(savedJobIdSet(cand({ savedJobIds: [] })).has('job-1')).toBe(false);
  });

  it('use only what the worker really saved', () => {
    const ids = savedJobIdSet(cand({ savedJobIds: ['b'] }));
    expect(selectJobs(JOBS, 'saved', DEFAULT_JOB_FILTERS, ids).map((j) => j.id)).toEqual(['b']);
  });

  it('toggle without mutating', () => {
    const start = ['a'];
    expect(toggleId(start, 'b')).toEqual(['a', 'b']);
    expect(toggleId(start, 'a')).toEqual([]);
    expect(start).toEqual(['a']);
    expect(toggleId(undefined, 'x')).toEqual(['x']);
  });
});

describe('employer talent directory', () => {
  const people = [
    cand({ id: 'c1', name: 'Asha', category: 'semi-skilled', expectedSalary: 15000 }),
    cand({ id: 'c2', name: 'Bhim', ncvtCertificate: { isVerified: true } as any, willingToRelocate: true }),
    cand({ id: 'c3', name: 'Chand', dpdpConsent: { isWithdrawn: true } as any }),
    cand({ id: 'c4', name: 'Dev', expectedSalary: 34000 }),
  ];

  it('never lists a worker who withdrew consent', () => {
    expect(selectCandidates(people, { ...DEFAULT_CANDIDATE_FILTERS }).map((c) => c.id)).not.toContain('c3');
  });

  it('applies skill, NCVT, relocation and wage filters', () => {
    const base = DEFAULT_CANDIDATE_FILTERS;
    expect(selectCandidates(people, { ...base, skill: 'helper' }).map((c) => c.id)).toEqual(['c1']);
    expect(selectCandidates(people, { ...base, ncvtOnly: true }).map((c) => c.id)).toEqual(['c2']);
    expect(selectCandidates(people, { ...base, relocationOnly: true }).map((c) => c.id)).toEqual(['c2']);
    expect(selectCandidates(people, { ...base, maxExpectedSalary: 35000 }).map((c) => c.id)).toContain('c4');
    expect(selectCandidates(people, base).map((c) => c.id)).not.toContain('c4');
  });

  it('counts active filters and has an empty result for nonsense', () => {
    expect(countActiveCandidateFilters(DEFAULT_CANDIDATE_FILTERS)).toBe(0);
    const f = { ...DEFAULT_CANDIDATE_FILTERS, query: 'nobody', trade: ALL };
    expect(countActiveCandidateFilters(f)).toBe(1);
    expect(selectCandidates(people, f)).toEqual([]);
  });

  it('unlocked contacts come only from the factory profile', () => {
    expect(unlockedCandidateIdSet(undefined).size).toBe(0);
    const none = unlockedCandidateIdSet({ unlockedCandidateIds: [] } as any);
    expect(none.has('cand-1') || none.has('cand-2')).toBe(false);
    expect(unlockedCandidateIdSet({ unlockedCandidateIds: ['c2'] } as any).has('c2')).toBe(true);
  });
});

describe('About page listings', () => {
  const samples = SAMPLE_LISTINGS;
  const liveJobs = (n: number) => Array.from({ length: n }, (_, i) => job({ id: `live${i}` }));

  it('shows only labelled samples when there are no real jobs', () => {
    const items = aboutListings([], samples);
    expect(items).toHaveLength(ABOUT_LISTING_SLOTS);
    expect(items.every((i) => i.source === 'sample')).toBe(true);
    expect(aboutListingsMode(items)).toBe('sample');
  });

  it('fills the gap with samples when there are some real jobs', () => {
    const items = aboutListings(liveJobs(1), samples);
    expect(items.map((i) => i.source)).toEqual(['live', 'sample', 'sample']);
    expect(aboutListingsMode(items)).toBe('mixed');
  });

  it('shows no sample at all once there are enough real jobs', () => {
    const items = aboutListings(liveJobs(5), samples);
    expect(items).toHaveLength(ABOUT_LISTING_SLOTS);
    expect(items.every((i) => i.source === 'live')).toBe(true);
    expect(aboutListingsMode(items)).toBe('live');
  });

  it('ignores closed jobs and never turns a sample into a job', () => {
    const items = aboutListings([job({ id: 'closed', isActive: false })], samples);
    expect(items.every((i) => i.source === 'sample')).toBe(true);
    for (const s of samples) {
      expect(s.id.startsWith('sample-')).toBe(true);
      expect(s).not.toHaveProperty('hrContactPhone');
    }
  });
});

describe('notification badge', () => {
  it('counts only unread notifications', () => {
    const list = [note({ id: '1', read: false }), note({ id: '2', read: true }), note({ id: '3' })];
    expect(isUnread(list[1]!)).toBe(false);
    expect(countUnread(list)).toBe(2);
  });

  it('is zero when there are none or all are read', () => {
    expect(countUnread([])).toBe(0);
    expect(countUnread([note({ read: true })])).toBe(0);
  });
});
