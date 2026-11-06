import React, { useMemo, useState } from 'react';
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  Building2,
  Phone,
  Search,
  X,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Users,
  Star,
  CheckCircle,
  GraduationCap,
  ShieldCheck,
  Award,
} from 'lucide-react';
import type { Language, JobListing, CandidateProfile, NotificationEvent } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { SAMPLE_CANDIDATES } from '../data/sampleCandidates';

interface EmployerPortalProps {
  employerProfile: { id: string; companyName: string; companyId: string; credits: number; unlockedCandidateIds?: string[] };
  searchQuery: string;
  selectedTrade: string;
  selectedHub: string;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenProfile: () => void;
  onUnlockCandidate: (candidateId: string, cost: number) => void;
  onAddNotification: (e: Omit<NotificationEvent, 'id' | 'timestamp'>) => void;
  candidateProfiles: Record<string, CandidateProfile>;
}

export default function EmployerPortal(props: EmployerPortalProps) {
  const t = TRANSLATIONS[props.language];
  const [searchInput, setSearchInput] = useState(props.searchQuery);
  const [selectedTrade, setSelectedTrade] = useState(props.selectedTrade);
  const [selectedHub, setSelectedHub] = useState(props.selectedHub);
  const [experienceFilter, setExperienceFilter] = useState<'all' | '0-2' | '2-5' | '5+'>('all');
  const [sortBy, setSortBy] = useState<'best-match' | 'experience' | 'rating'>('best-match');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [showPhoneModal, setShowPhoneModal] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState<string | null>(null);

  const unlockedIds = useMemo(
    () => new Set(props.employerProfile.unlockedCandidateIds || []),
    [props.employerProfile.unlockedCandidateIds]
  );

  const hasActiveFilters = useMemo(() => {
    return (
      searchInput.trim() !== '' ||
      selectedTrade !== 'all' ||
      selectedHub !== 'all' ||
      experienceFilter !== 'all' ||
      sortBy !== 'best-match'
    );
  }, [searchInput, selectedTrade, selectedHub, experienceFilter, sortBy]);

  const resetFilters = () => {
    setSearchInput('');
    setSelectedTrade('all');
    setSelectedHub('all');
    setExperienceFilter('all');
    setSortBy('best-match');
  };

  const toggleShortlist = (id: string) => {
    setShortlistedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredCandidates = useMemo(() => {
    let candidates = SAMPLE_CANDIDATES;

    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.skills.some((s) => s.toLowerCase().includes(q)) ||
          c.trade.toLowerCase().includes(q)
      );
    }

    if (selectedTrade !== 'all') {
      candidates = candidates.filter((c) => c.trade === selectedTrade);
    }

    if (selectedHub !== 'all') {
      candidates = candidates.filter((c) => c.preferredHub === selectedHub);
    }

    if (experienceFilter !== 'all') {
      candidates = candidates.filter((c) => {
        if (experienceFilter === '0-2') return c.experience <= 2;
        if (experienceFilter === '2-5') return c.experience > 2 && c.experience <= 5;
        if (experienceFilter === '5+') return c.experience > 5;
        return true;
      });
    }

    if (sortBy === 'experience') {
      candidates = [...candidates].sort((a, b) => b.experience - a.experience);
    } else if (sortBy === 'rating') {
      candidates = [...candidates].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return candidates;
  }, [searchInput, selectedTrade, selectedHub, experienceFilter, sortBy]);

  const trades = useMemo(() => ['all', ...Array.from(new Set(SAMPLE_CANDIDATES.map((c) => c.trade)))], []);
  const hubs = useMemo(() => ['all', ...Array.from(new Set(SAMPLE_CANDIDATES.map((c) => c.preferredHub)))], []);

  const handleUnlock = (candidate: CandidateProfile) => {
    if (unlockedIds.has(candidate.id)) return;
    if (props.employerProfile.credits < 1) {
      props.onAddNotification({
        title: '⚠️ Low Credits',
        body: 'You need more credits to unlock candidate details. Top up now.',
        type: 'alert',
        targetRole: 'employer',
      });
      return;
    }
    props.onUnlockCandidate(candidate.id, 1);
    props.onAddNotification({
      title: '🔓 Candidate Unlocked',
      body: `You can now contact ${candidate.name} directly.`,
      type: 'success',
      targetRole: 'employer',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-950 dark:text-white">{t.candidatePoolTitle}</h2>
          <p className="text-xs text-slate-500">{t.candidatePoolSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
            {props.employerProfile.credits} credits
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          onClick={() => setShowFilterBar((s) => !s)}
          aria-expanded={showFilterBar}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t.moreFilters}
          {showFilterBar ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showFilterBar && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">{t.filterTrade}</label>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {trades.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Trades' : t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase">{t.filterHub}</label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {hubs.map((t) => (
                  <option key={t} value={t}>
                    {t === 'all' ? 'All Hubs' : t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Experience</label>
            <div className="flex gap-2 mt-1">
              {[
                { key: 'all', label: 'All' },
                { key: '0-2', label: '0-2 yrs' },
                { key: '2-5', label: '2-5 yrs' },
                { key: '5+', label: '5+ yrs' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setExperienceFilter(s.key as any)}
                  className={
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition ' +
                    (experienceFilter === s.key
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">{t.sortByLabel}</label>
            <div className="flex gap-2 mt-1">
              {[
                { key: 'best-match', label: t.bestMatch },
                { key: 'experience', label: 'Experience' },
                { key: 'rating', label: 'Rating' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key as any)}
                  className={
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition ' +
                    (sortBy === s.key
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300')
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
          >
            <RotateCcw className="w-3 h-3" />
            {t.resetFilters}
          </button>
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-slate-500">
        {filteredCandidates.length} {filteredCandidates.length === 1 ? 'candidate' : 'candidates'} found
      </p>

      {/* Candidate Cards */}
      {filteredCandidates.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state-icon" />
          <h4 className="empty-state-title">{t.emptyStateNoCandidates}</h4>
          <p className="empty-state-desc">{t.emptyStateNoCandidatesDesc}</p>
          <button onClick={resetFilters} className="btn-amber mt-2">
            {t.resetFilters}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCandidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              isUnlocked={unlockedIds.has(candidate.id)}
              isShortlisted={shortlistedIds.includes(candidate.id)}
              onToggleShortlist={() => toggleShortlist(candidate.id)}
              onUnlock={() => handleUnlock(candidate)}
              onShowPhone={() => setShowPhoneModal(candidate.id)}
              onShowOffer={() => setShowOfferModal(candidate.id)}
              language={props.language}
            />
          ))}
        </div>
      )}

      {/* Phone Modal */}
      {showPhoneModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emp-phone-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPhoneModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="emp-phone-title" className="text-base font-extrabold text-slate-950">{t.directHrContact}</h3>
              <button
                onClick={() => setShowPhoneModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">+91 98765 43210</p>
                  <p className="text-xs text-slate-500">{t.officialFactoryContact}</p>
                </div>
              </div>
              <a
                href="tel:+919876543210"
                className="w-full btn-blue justify-center"
              >
                <Phone className="w-4 h-4" />
                {t.callNow}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div
          className="dialog-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-title"
          onClick={(e) => { if (e.target === e.currentTarget) setShowOfferModal(null); }}
        >
          <div className="dialog-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 id="offer-title" className="text-base font-extrabold text-slate-950">{t.issueOffer}</h3>
              <button
                onClick={() => setShowOfferModal(null)}
                className="icon-btn"
                aria-label={t.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">Monthly Salary (₹)</label>
                <input
                  type="number"
                  defaultValue={20000}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Joining Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <button
                onClick={() => {
                  setShowOfferModal(null);
                  props.onAddNotification({
                    title: '✅ Offer Issued',
                    body: 'Your offer has been sent to the candidate.',
                    type: 'success',
                    targetRole: 'employer',
                  });
                }}
                className="w-full btn-amber justify-center"
              >
                <CheckCircle className="w-4 h-4" />
                {t.issueOffer}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Candidate Card ────────────────────────────────────────────────────── */

function CandidateCard({
  candidate,
  isUnlocked,
  isShortlisted,
  onToggleShortlist,
  onUnlock,
  onShowPhone,
  onShowOffer,
  language,
}: {
  candidate: CandidateProfile;
  isUnlocked: boolean;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  onUnlock: () => void;
  onShowPhone: () => void;
  onShowOffer: () => void;
  language: Language;
}) {
  const t = TRANSLATIONS[language];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition hover:shadow-md">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">{candidate.name}</h3>
              {candidate.verified && (
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{candidate.trade}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleShortlist}
              aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
              aria-pressed={isShortlisted}
              className={
                'p-1.5 rounded-lg transition ' +
                (isShortlisted ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50')
              }
            >
              <Heart className={`w-4 h-4 ${isShortlisted ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Briefcase className="w-3.5 h-3.5 text-purple-500" />
            {candidate.experience} yrs
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-blue-500" />
            {candidate.preferredHub}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <IndianRupee className="w-3.5 h-3.5 text-amber-500" />
            ₹{candidate.expectedSalary.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            {candidate.rating || 'New'}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {candidate.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="text-[10px] text-slate-400 px-1">+{candidate.skills.length - 3}</span>
          )}
        </div>

        {candidate.ncvtCertified && (
          <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            <GraduationCap className="w-3 h-3" />
            NCVT Certified
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {!isUnlocked ? (
            <button
              onClick={onUnlock}
              className="flex-1 py-2.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              {t.unlockInvite}
            </button>
          ) : (
            <>
              <button
                onClick={onShowPhone}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                {t.callNow}
              </button>
              <button
                onClick={onShowOffer}
                className="flex-1 py-2.5 text-xs font-bold bg-green-500 hover:bg-green-400 text-white rounded-lg transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {t.issueOffer}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
