import type { CandidateProfile, JobApplication, OfferLetter, PipelineStage } from '../types';
import { calculateProfileCompleteness, type ProfileStepKey } from './domain';

/** The four steps a worker sees, in order. "Joined" is the end of the road, not a fifth step. */
export const WORKER_STEPS = ['applied', 'shortlisted', 'interview', 'offer'] as const;
export type WorkerStep = (typeof WORKER_STEPS)[number];

export type ClosedReason = 'notSelected' | 'closedByYou';

export interface WorkerStatus {
  /** How many of the four steps are reached (0 when the application is closed). */
  reached: 0 | 1 | 2 | 3 | 4;
  /** The step the worker is on now; null when closed or joined. */
  current: WorkerStep | null;
  /** True once the factory has taken the worker on. */
  joined: boolean;
  /** The offer is accepted but the worker has not joined yet. */
  offerAccepted: boolean;
  /** Set when the application ended; one plain line instead of the internal outcome. */
  closed: ClosedReason | null;
}

/**
 * Maps the ten internal pipeline stages onto what a worker needs to know.
 * Rejected and No-show read as "Not selected". Declined and Withdrawn are the worker's own
 * choice, so they read as "Closed by you" rather than implying the factory said no.
 */
export function workerStatus(stage: PipelineStage): WorkerStatus {
  switch (stage) {
    case 'Applied':
      return { reached: 1, current: 'applied', joined: false, offerAccepted: false, closed: null };
    case 'Shortlisted':
      return { reached: 2, current: 'shortlisted', joined: false, offerAccepted: false, closed: null };
    case 'Interview':
      return { reached: 3, current: 'interview', joined: false, offerAccepted: false, closed: null };
    case 'Offer Issued':
      return { reached: 4, current: 'offer', joined: false, offerAccepted: false, closed: null };
    case 'Accepted':
      return { reached: 4, current: 'offer', joined: false, offerAccepted: true, closed: null };
    case 'Joined':
      return { reached: 4, current: null, joined: true, offerAccepted: true, closed: null };
    case 'Declined':
    case 'Withdrawn':
      return { reached: 0, current: null, joined: false, offerAccepted: false, closed: 'closedByYou' };
    case 'Rejected':
    case 'No-show':
    default:
      return { reached: 0, current: null, joined: false, offerAccepted: false, closed: 'notSelected' };
  }
}

export type NextStep =
  | { kind: 'respondOffer'; count: number }
  | { kind: 'interview'; applicationId: string; jobTitle: string }
  | { kind: 'profile'; step: Exclude<ProfileStepKey, 'video'> }
  | { kind: 'browse' }
  | { kind: 'waiting' }
  | { kind: 'video' };

const OPEN_STAGES: PipelineStage[] = ['Applied', 'Shortlisted', 'Interview', 'Offer Issued', 'Accepted'];

/**
 * The one thing to do next, most urgent first: answer an offer, get ready for an interview,
 * finish the profile, apply to a job, and only then the optional video.
 */
export function nextStepFor(
  worker: CandidateProfile,
  applications: JobApplication[],
  offers: OfferLetter[]
): NextStep {
  const mine = applications.filter((a) => a.candidateId === worker.id);
  const pending = offers.filter((o) => o.candidateId === worker.id && o.status === 'Issued').length;
  if (pending > 0) return { kind: 'respondOffer', count: pending };

  const interview = mine.find((a) => a.status === 'Interview');
  if (interview) {
    return { kind: 'interview', applicationId: interview.id, jobTitle: interview.jobTitle };
  }

  const { nextStepKey } = calculateProfileCompleteness(worker);
  if (nextStepKey && nextStepKey !== 'video') return { kind: 'profile', step: nextStepKey };

  if (mine.length === 0) return { kind: 'browse' };
  if (mine.some((a) => OPEN_STAGES.includes(a.status))) {
    return nextStepKey === 'video' ? { kind: 'video' } : { kind: 'waiting' };
  }
  return { kind: 'browse' };
}
