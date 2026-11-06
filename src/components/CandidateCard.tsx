import React from 'react';
import {
  Award,
  Bookmark,
  BookmarkCheck,
  Coins,
  FileText,
  Lock,
  MapPin,
  ShieldCheck,
  Unlock,
  Video,
} from 'lucide-react';
import type { CandidateProfile } from '../types';
import type { TFunction } from '../data/translations';

interface Props {
  candidate: CandidateProfile;
  t: TFunction;
  isShortlisted: boolean;
  /** True only when this factory has really unlocked the contact (server-owned). */
  isUnlocked: boolean;
  isUnlocking: boolean;
  /** The unlock action is only offered when the app supplied a handler. */
  canUnlock: boolean;
  onToggleShortlist: () => void;
  onUnlock: () => void;
  onInspectCertificate: () => void;
  onOpenVideoDemo: () => void;
  onOpenIssueOffer: () => void;
}

const MAX_SKILLS_SHOWN = 4;

/**
 * One worker in the directory. Facts an HR manager scans for come first (trade, experience,
 * location, verification, expected pay). Issuing an offer is the one primary action;
 * shortlisting and unlocking contact are secondary.
 */
export const CandidateCard: React.FC<Props> = ({
  candidate,
  t,
  isShortlisted,
  isUnlocked,
  isUnlocking,
  canUnlock,
  onToggleShortlist,
  onUnlock,
  onInspectCertificate,
  onOpenVideoDemo,
  onOpenIssueOffer,
}) => {
  const headingId = `cand-${candidate.id}-name`;
  const digits = (candidate.phone ?? '').replace(/\D/g, '').slice(-10);
  const maskedPhone = `+91 ${digits.slice(0, 2)}•••••${digits.slice(-3)}`;
  const skills = candidate.machinesOperated ?? [];
  const payMin = candidate.expectedPayMin || candidate.expectedSalary;
  const payMax = candidate.expectedPayMax || candidate.expectedSalary + 2000;

  return (
    <article aria-labelledby={headingId} className="card flex flex-col gap-3 p-4 sm:p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-amber-300"
            aria-hidden="true"
          >
            {candidate.avatarSeed}
          </div>
          <div className="min-w-0">
            <h3 id={headingId} className="text-lg font-extrabold leading-snug text-slate-900">
              {candidate.name}
            </h3>
            <p className="text-body text-slate-700">
              <span className="font-semibold">{candidate.trade}</span>
              <span aria-hidden="true"> · </span>
              <span className="tabular-nums">{t('yrsExp', { n: candidate.experienceYears })}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleShortlist}
          aria-pressed={isShortlisted}
          aria-label={isShortlisted ? t('unshortlistAria', { name: candidate.name }) : t('shortlistAria', { name: candidate.name })}
          className={`btn btn-sm shrink-0 ${isShortlisted ? 'btn-employer' : 'btn-secondary'}`}
        >
          {isShortlisted ? (
            <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Bookmark className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isShortlisted ? t('shortlisted') : t('shortlist')}</span>
        </button>
      </header>

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-body text-slate-700">
        <li className="badge badge-verified">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {candidate.ncvtCertificate.isVerified
            ? t('ncvtGrade', { grade: candidate.ncvtCertificate.grade })
            : t('workReady')}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-slate-500" aria-hidden="true" />
          {candidate.currentCity} ({candidate.homeState})
        </li>
        <li className="font-bold tabular-nums text-[var(--sk-green-text)]">
          ₹{payMin.toLocaleString('en-IN')}–₹{payMax.toLocaleString('en-IN')}
          {t('perMonthShort')}
        </li>
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-body">
        <p className="inline-flex items-center gap-2 font-semibold tabular-nums text-slate-800">
          {isUnlocked ? (
            <Unlock className="h-4 w-4 text-[var(--sk-green-text)]" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4 text-slate-600" aria-hidden="true" />
          )}
          {isUnlocked
            ? t('phoneUnlocked', { phone: candidate.phone })
            : t('phoneMasked', { phone: maskedPhone })}
        </p>
        {!isUnlocked && canUnlock && (
          <button
            type="button"
            disabled={isUnlocking}
            onClick={onUnlock}
            aria-label={t('unlockAria', { name: candidate.name })}
            className="btn btn-secondary btn-sm"
          >
            <Coins className="h-4 w-4" aria-hidden="true" />
            <span>{isUnlocking ? t('unlocking') : t('unlockInvite')}</span>
          </button>
        )}
      </div>

      {skills.length > 0 && (
        <div>
          <p className="eyebrow mb-1">{t('machinesHandled')}</p>
          <ul className="flex flex-wrap gap-1.5">
            {skills.slice(0, MAX_SKILLS_SHOWN).map((skill) => (
              <li key={skill} className="badge">
                {skill}
              </li>
            ))}
            {skills.length > MAX_SKILLS_SHOWN && (
              <li className="badge" title={skills.slice(MAX_SKILLS_SHOWN).join(', ')}>
                {t('moreSkills', { n: skills.length - MAX_SKILLS_SHOWN })}
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onOpenIssueOffer} className="btn btn-employer">
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span>{t('issueOffer')}</span>
        </button>
        {candidate.ncvtCertificate.isVerified && (
          <button type="button" onClick={onInspectCertificate} className="btn btn-ghost btn-sm">
            <Award className="h-4 w-4" aria-hidden="true" />
            <span>{t('viewNcvtCard')}</span>
          </button>
        )}
        {candidate.hasVideoDemo && (
          <button type="button" onClick={onOpenVideoDemo} className="btn btn-ghost btn-sm">
            <Video className="h-4 w-4" aria-hidden="true" />
            <span>{t('practicalDemo')}</span>
          </button>
        )}
      </div>
    </article>
  );
};
