import React, { useMemo } from 'react';
import {
  UserRole,
  Language,
  AuthSession,
  CandidateProfile,
  EmployerFactoryProfile,
} from '../types';
import {
  UserCheck,
  Factory,
  FileText,
  LogIn,
  UserPlus,
  Bell,
  LogOut,
  Briefcase,
  Users,
  Plus,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { makeT } from '../data/translations';

export type WorkerTab = 'profile' | 'inbox' | 'idcard';

interface Props {
  currentRole: UserRole;
  currentLang: Language;
  authSession: AuthSession | null;
  activeWorker?: CandidateProfile;
  employerProfile: EmployerFactoryProfile;
  /** Notifications the person has not seen yet. */
  unreadNotificationsCount?: number;
  /** Which section of the worker profile page is open (for the active nav marker). */
  workerTab?: WorkerTab;
  onRoleChange: (role: UserRole) => void;
  /** Opens a section of the worker profile page, e.g. "Applications & offers". */
  onOpenWorkerTab?: (tab: WorkerTab) => void;
  onLangChange: (lang: Language) => void;
  onOpenCalculator: () => void;
  onOpenReport: () => void;
  onOpenNcvtSearch: () => void;
  onOpenAuthModal: (
    initialTab?: 'worker' | 'employer',
    initialMode?: 'login' | 'register'
  ) => void;
  onOpenPostJob?: () => void;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
}

const LANGUAGES: { code: Language; nativeName: string }[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'hi', nativeName: 'हिंदी' },
  { code: 'mr', nativeName: 'मराठी' },
  { code: 'ta', nativeName: 'தமிழ்' },
];

/** One desktop navigation link. The current page is marked in text, underline and aria-current. */
const NavLink: React.FC<{
  active: boolean;
  tone: 'worker' | 'employer' | 'neutral';
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, tone, onClick, children }) => {
  const activeStyle =
    tone === 'employer'
      ? 'text-[var(--sk-blue-text)] border-[var(--sk-blue)]'
      : tone === 'worker'
        ? 'text-[var(--sk-amber-text)] border-[var(--sk-amber)]'
        : 'text-slate-900 border-slate-900';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 text-sm font-bold transition-colors ${
        active ? `${activeStyle} font-extrabold` : 'border-transparent text-slate-700 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
};

export const Navbar: React.FC<Props> = ({
  currentRole,
  currentLang,
  authSession,
  activeWorker,
  employerProfile,
  unreadNotificationsCount = 0,
  workerTab = 'profile',
  onRoleChange,
  onOpenWorkerTab,
  onLangChange,
  onOpenCalculator,
  onOpenAuthModal,
  onOpenPostJob,
  onOpenNotifications,
  onLogout,
}) => {
  const t = useMemo(() => makeT(currentLang), [currentLang]);

  const isWorkerLoggedIn = authSession?.role === 'worker' && Boolean(activeWorker);
  const isEmployerLoggedIn = authSession?.role === 'employer';

  const openWorkerTab = (tab: WorkerTab) =>
    onOpenWorkerTab ? onOpenWorkerTab(tab) : onRoleChange('worker-profile');

  const onProfilePage = currentRole === 'worker-profile';
  const authTone = currentRole === 'employer' || isEmployerLoggedIn ? 'employer' : 'worker';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="hv-stripe h-1" aria-hidden="true" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand wordmark */}
        <button
          type="button"
          onClick={() => onRoleChange('landing')}
          aria-label={t('navHomeAria')}
          className="min-h-11 shrink-0 cursor-pointer rounded-lg py-1 transition-opacity hover:opacity-80"
        >
          <BrandLogo showTagline />
        </button>

        {/* Zone 2: Navigation for the current role (desktop; phones and tablets use the bottom bar) */}
        <nav aria-label={t('navMainAria')} className="hidden items-center gap-6 lg:flex">
          {isWorkerLoggedIn ? (
            <>
              <NavLink tone="worker" active={currentRole === 'worker'} onClick={() => onRoleChange('worker')}>
                <Briefcase className="h-4 w-4" aria-hidden="true" />
                <span>{t('navJobsFeed')}</span>
              </NavLink>
              <NavLink
                tone="worker"
                active={onProfilePage && workerTab === 'inbox'}
                onClick={() => openWorkerTab('inbox')}
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>{t('navApplications')}</span>
              </NavLink>
              <NavLink
                tone="worker"
                active={onProfilePage && workerTab !== 'inbox'}
                onClick={() => openWorkerTab('profile')}
              >
                <UserCheck className="h-4 w-4" aria-hidden="true" />
                <span>{t('navMyProfile')}</span>
              </NavLink>
              <NavLink tone="neutral" active={false} onClick={onOpenCalculator}>
                {t('navSalaryCalc')}
              </NavLink>
            </>
          ) : isEmployerLoggedIn ? (
            <>
              <NavLink
                tone="employer"
                active={currentRole === 'employer-profile'}
                onClick={() => onRoleChange('employer-profile')}
              >
                <Factory className="h-4 w-4" aria-hidden="true" />
                <span>{t('navDashboard')}</span>
              </NavLink>
              <NavLink tone="employer" active={currentRole === 'employer'} onClick={() => onRoleChange('employer')}>
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>{t('navCandidates')}</span>
              </NavLink>
              {onOpenPostJob && (
                <NavLink tone="employer" active={false} onClick={onOpenPostJob}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('navPostJob')}</span>
                </NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink tone="neutral" active={currentRole === 'landing'} onClick={() => onRoleChange('landing')}>
                {t('navHome')}
              </NavLink>
              <NavLink tone="worker" active={currentRole === 'worker'} onClick={() => onRoleChange('worker')}>
                {t('navBrowseJobs')}
              </NavLink>
              <NavLink tone="employer" active={currentRole === 'employer'} onClick={() => onRoleChange('employer')}>
                {t('navForEmployers')}
              </NavLink>
              <NavLink tone="neutral" active={false} onClick={onOpenCalculator}>
                {t('navSalaryCalc')}
              </NavLink>
            </>
          )}
        </nav>

        {/* Zone 3: language, alerts and account */}
        <div className="flex shrink-0 items-center gap-2">
          {/* A native select works on every screen size, by keyboard, touch and screen reader. */}
          <div>
            <label htmlFor="lang-select" className="sr-only">
              {t('langLabel')}
            </label>
            <select
              id="lang-select"
              value={currentLang}
              onChange={(e) => onLangChange(e.target.value as Language)}
              className="field !min-h-11 !w-auto !py-1 !pl-2 !pr-1 !text-sm font-semibold"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </div>

          {(isWorkerLoggedIn || isEmployerLoggedIn) && onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              aria-label={
                unreadNotificationsCount > 0
                  ? t('bellAria', { n: unreadNotificationsCount })
                  : t('bellAriaNone')
              }
              className="btn btn-secondary relative !min-w-11 !px-0"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadNotificationsCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--sk-amber)] px-1 text-meta font-black tabular-nums text-slate-950"
                >
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {isWorkerLoggedIn || isEmployerLoggedIn ? (
            onLogout && (
              <button
                type="button"
                onClick={onLogout}
                aria-label={t('navLogout')}
                className="btn btn-secondary max-[380px]:hidden sm:!px-3"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('navLogout')}</span>
              </button>
            )
          ) : (
            // Phones get Log in / Register from the bottom bar and the page itself.
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => onOpenAuthModal(authTone, 'login')}
                className="btn btn-secondary"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                <span>{t('navLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuthModal(authTone, 'register')}
                className={`btn ${authTone === 'employer' ? 'btn-employer' : 'btn-worker'}`}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span>{t('navRegister')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
