import React from 'react';
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
  LogIn,
  UserPlus,
  Bell,
  LogOut,
  Briefcase,
  Users,
  Plus,
} from 'lucide-react';

interface Props {
  currentRole: UserRole;
  currentLang: Language;
  authSession: AuthSession | null;
  activeWorker?: CandidateProfile;
  employerProfile: EmployerFactoryProfile;
  unreadNotificationsCount?: number;
  onRoleChange: (role: UserRole) => void;
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

export const Navbar: React.FC<Props> = ({
  currentRole,
  currentLang,
  authSession,
  activeWorker,
  employerProfile,
  unreadNotificationsCount = 0,
  onRoleChange,
  onLangChange,
  onOpenCalculator,
  onOpenAuthModal,
  onOpenPostJob,
  onOpenNotifications,
  onLogout,
}) => {
  const languages: { code: Language; label: string; nativeName: string }[] = [
    { code: 'en', label: 'EN', nativeName: 'English' },
    { code: 'hi', label: 'हिं', nativeName: 'हिंदी' },
    { code: 'mr', label: 'म', nativeName: 'मराठी' },
    { code: 'ta', label: 'த', nativeName: 'தமிழ்' },
  ];

  const isWorkerLoggedIn = authSession?.role === 'worker' && Boolean(activeWorker);
  const isEmployerLoggedIn = authSession?.role === 'employer';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onRoleChange('landing')}
          className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer hover:text-amber-600 transition-colors"
        >
          Hello Jobs
        </button>

        {/* Zone 2: Contextual Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
          {isWorkerLoggedIn ? (
            <>
              <button
                onClick={() => onRoleChange('worker')}
                className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 py-1 ${
                  currentRole === 'worker'
                    ? 'text-amber-600 border-b-2 border-amber-500 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Jobs Feed</span>
              </button>
              <button
                onClick={() => onRoleChange('worker-profile')}
                className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 py-1 ${
                  currentRole === 'worker-profile'
                    ? 'text-amber-600 border-b-2 border-amber-500 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>My Profile & Applications</span>
              </button>
              <button
                onClick={onOpenCalculator}
                className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
              >
                Salary Calculator
              </button>
            </>
          ) : isEmployerLoggedIn ? (
            <>
              <button
                onClick={() => onRoleChange('employer-profile')}
                className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 py-1 ${
                  currentRole === 'employer-profile'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                <span>Employer Dashboard</span>
              </button>
              <button
                onClick={() => onRoleChange('employer')}
                className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 py-1 ${
                  currentRole === 'employer'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold'
                    : 'hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Candidate Directory</span>
              </button>
              {onOpenPostJob && (
                <button
                  onClick={onOpenPostJob}
                  className="whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post a Job</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => onRoleChange('landing')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentRole === 'landing'
                    ? 'text-slate-900 font-extrabold underline underline-offset-4'
                    : 'hover:text-slate-900'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onRoleChange('worker')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentRole === 'worker'
                    ? 'text-amber-600 font-extrabold underline underline-offset-4'
                    : 'hover:text-slate-900'
                }`}
              >
                Browse Jobs
              </button>
              <button
                onClick={() => onRoleChange('employer')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentRole === 'employer'
                    ? 'text-blue-600 font-extrabold underline underline-offset-4'
                    : 'hover:text-slate-900'
                }`}
              >
                For Employers
              </button>
              <button
                onClick={onOpenCalculator}
                className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
              >
                Salary Calculator
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Language Switcher & Auth / Profile Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => onLangChange(l.code)}
                title={l.nativeName}
                className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                  currentLang === l.code
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {(isWorkerLoggedIn || isEmployerLoggedIn) && onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center tabular-nums">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {isWorkerLoggedIn && activeWorker ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onRoleChange(
                    currentRole === 'worker-profile' ? 'worker' : 'worker-profile'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  {currentRole === 'worker-profile'
                    ? 'Jobs Feed'
                    : `${activeWorker.name.split(' ')[0]} · My Profile`}
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              )}
            </div>
          ) : isEmployerLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onRoleChange(
                    currentRole === 'employer-profile'
                      ? 'employer'
                      : 'employer-profile'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <Factory className="w-3.5 h-3.5" />
                <span>
                  {currentRole === 'employer-profile'
                    ? 'Find Candidates'
                    : `${employerProfile.companyName.split(' ')[0]} · Dashboard`}
                </span>
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onOpenAuthModal(
                    currentRole === 'employer' ? 'employer' : 'worker',
                    'login'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() =>
                  onOpenAuthModal(
                    currentRole === 'employer' ? 'employer' : 'worker',
                    'register'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
