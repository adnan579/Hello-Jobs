/**
 * Pure helpers behind the worker job feed, the employer talent directory and the
 * notification badge. They hold no React state so they can be unit tested in Node.
 *
 * Rule of thumb for this file: every "saved", "unlocked" or "unread" answer is derived
 * from data the server sent for the signed-in person. Nothing here invents an id.
 */
import type {
  CandidateProfile,
  EmployerFactoryProfile,
  HiringDrive,
  JobListing,
  NotificationEvent,
} from '../types';

// ---------------------------------------------------------------------------
// Worker job feed
// ---------------------------------------------------------------------------

export type FeedMode = 'all' | 'no-cert' | 'iti' | 'saved' | 'drives';
export type JobSort = 'best-match' | 'highest-pay' | 'nearest';

export interface JobFilters {
  query: string;
  /** A trade name, or 'all'. */
  trade: string;
  /** An industrial hub name, or 'all'. */
  hub: string;
  hostelOnly: boolean;
}

export const ALL = 'all';

export const DEFAULT_JOB_FILTERS: JobFilters = {
  query: '',
  trade: ALL,
  hub: ALL,
  hostelOnly: false,
};

export const isLiveJob = (job: JobListing): boolean => job.isActive !== false;
export const isNoCertJob = (job: JobListing): boolean =>
  Boolean(job.noCertificateRequired) || job.category !== 'skilled';
export const isItiJob = (job: JobListing): boolean => job.category === 'skilled';

/** The jobs that count as saved: ids the worker really saved, for jobs that still exist. */
export function savedJobIdSet(
  worker: Pick<CandidateProfile, 'savedJobIds'> | undefined | null
): Set<string> {
  return new Set(worker?.savedJobIds ?? []);
}

/** Flip one id in the worker's saved list (returns a new array, never mutates). */
export function toggleId(ids: readonly string[] | undefined, id: string): string[] {
  const current = ids ?? [];
  return current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
}

export function countActiveJobFilters(f: JobFilters): number {
  return (
    (f.query.trim() !== '' ? 1 : 0) +
    (f.trade !== ALL ? 1 : 0) +
    (f.hub !== ALL ? 1 : 0) +
    (f.hostelOnly ? 1 : 0)
  );
}

export function matchesJobFilters(job: JobListing, f: JobFilters): boolean {
  const q = f.query.trim().toLowerCase();
  return (
    (f.trade === ALL || job.trade === f.trade) &&
    (f.hub === ALL || job.industrialHub === f.hub) &&
    (!f.hostelOnly || Boolean(job.facilities?.hasHostel)) &&
    (q === '' ||
      job.title.toLowerCase().includes(q) ||
      job.companyName.toLowerCase().includes(q) ||
      job.trade.toLowerCase().includes(q) ||
      job.industrialHub.toLowerCase().includes(q))
  );
}

/**
 * Jobs to show for a feed mode. The campus-drives mode is NOT a job view, so it returns
 * no jobs at all: the screen renders drives instead of (never alongside) the job list.
 */
export function selectJobs(
  jobs: JobListing[],
  mode: FeedMode,
  filters: JobFilters,
  savedIds: ReadonlySet<string>
): JobListing[] {
  if (mode === 'drives') return [];
  return jobs.filter((job) => {
    if (!isLiveJob(job)) return false;
    if (mode === 'saved' && !savedIds.has(job.id)) return false;
    if (mode === 'no-cert' && !isNoCertJob(job)) return false;
    if (mode === 'iti' && !isItiJob(job)) return false;
    return matchesJobFilters(job, filters);
  });
}

export interface FeedCounts {
  all: number;
  noCert: number;
  iti: number;
  saved: number;
  drives: number;
}

/** Counts shown on the mode tabs. Only live jobs count, and "saved" only counts jobs that still exist. */
export function feedCounts(
  jobs: JobListing[],
  savedIds: ReadonlySet<string>,
  drives: HiringDrive[]
): FeedCounts {
  const live = jobs.filter(isLiveJob);
  return {
    all: live.length,
    noCert: live.filter(isNoCertJob).length,
    iti: live.filter(isItiJob).length,
    saved: live.filter((j) => savedIds.has(j.id)).length,
    drives: drives.length,
  };
}

// ---------------------------------------------------------------------------
// Employer talent directory
// ---------------------------------------------------------------------------

export type SkillFilter = 'all' | 'helper' | 'iti';

export interface CandidateFilters {
  skill: SkillFilter;
  query: string;
  trade: string;
  ncvtOnly: boolean;
  relocationOnly: boolean;
  maxExpectedSalary: number;
}

export const MAX_WAGE_CEILING = 35000;
export const MIN_WAGE_FLOOR = 15000;

export const DEFAULT_CANDIDATE_FILTERS: CandidateFilters = {
  skill: 'all',
  query: '',
  trade: ALL,
  ncvtOnly: false,
  relocationOnly: false,
  maxExpectedSalary: 32000,
};

/** Workers who have chosen to be discoverable. Withdrawn consent or opt-out removes them. */
export function directoryCandidates(candidates: CandidateProfile[]): CandidateProfile[] {
  return candidates.filter(
    (c) => !(c.dpdpConsent?.isWithdrawn || c.dpdpConsent?.directoryDiscovery === false)
  );
}

export function countActiveCandidateFilters(f: CandidateFilters): number {
  return (
    (f.skill !== 'all' ? 1 : 0) +
    (f.query.trim() !== '' ? 1 : 0) +
    (f.trade !== ALL ? 1 : 0) +
    (f.ncvtOnly ? 1 : 0) +
    (f.relocationOnly ? 1 : 0) +
    (f.maxExpectedSalary !== DEFAULT_CANDIDATE_FILTERS.maxExpectedSalary ? 1 : 0)
  );
}

export function selectCandidates(
  candidates: CandidateProfile[],
  f: CandidateFilters
): CandidateProfile[] {
  const q = f.query.trim().toLowerCase();
  return directoryCandidates(candidates).filter((c) => {
    if (f.skill === 'helper' && c.category === 'skilled') return false;
    if (f.skill === 'iti' && c.category !== 'skilled') return false;
    if (f.trade !== ALL && c.trade !== f.trade) return false;
    if (f.ncvtOnly && !c.ncvtCertificate?.isVerified) return false;
    if (f.relocationOnly && !c.willingToRelocate) return false;
    if (c.expectedSalary > f.maxExpectedSalary) return false;
    if (q === '') return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.trade.toLowerCase().includes(q) ||
      c.currentCity.toLowerCase().includes(q) ||
      c.homeState.toLowerCase().includes(q) ||
      (c.machinesOperated ?? []).some((m) => m.toLowerCase().includes(q))
    );
  });
}

/** Contacts this factory has really unlocked (server-owned). Never pre-filled. */
export function unlockedCandidateIdSet(
  employer: Pick<EmployerFactoryProfile, 'unlockedCandidateIds'> | undefined | null
): Set<string> {
  return new Set(employer?.unlockedCandidateIds ?? []);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

/** A notification is unread unless the server says it was read. */
export const isUnread = (n: NotificationEvent): boolean => n.read !== true;

export function countUnread(notifications: NotificationEvent[]): number {
  return notifications.filter(isUnread).length;
}
