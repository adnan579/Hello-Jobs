import React from 'react';
import {
  UserRole,
  Language,
  AuthSession,
  CandidateProfile,
  EmployerFactoryProfile,
} from '../types';
import {
  Briefcase,
  Users,
  Building2,
  Globe,
  LogIn,
  LogOut,
  UserCheck,
  FileText,
  MapPin,
  Bell,
  Menu,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

interface Props {
  currentRole: UserRole;
  currentLang: Language;
  authSession: AuthSession | null;
  activeWorker?: CandidateProfile;
  employerProfile: EmployerFactoryProfile;
  unreadNotificationsCount: number;
  onRoleChange: (role: UserRole) => void;
  onLangChange: (lang: Language) => void;
  onOpenCalculator: () => void;
  onOpenReport: () => void;
  onOpenNcvtSearch: () => void;
  onOpenAuthModal: (
    initialTab?: 'worker' | 'employer',
    initialMode?: 'login' | 'register'
  ) => void;
  onOpenNotifications: () => void;
  onOpenPostJob: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentRole,
  currentLang,
  authSession,
  activeWorker,
  employerProfile,
  unreadNotificationsCount,
  onRoleChange,
  onLangChange,
  onOpenCalculator,
  onOpenReport,
  onOpenNcvtSearch,
  onOpenAuthModal,
  onOpenNotifications,
  onOpenPostJob,
  onLogout,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  const [menuOpen, setMenuOpen] = React.useState(false);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ta', label: 'தமிழ்' },
  ];

  const roleLabel: Record<string, string> = {
    landing: t.navLanding,
    worker: t.navWorkerFeed,
    employer: t.navEmployerFeed,
    'worker-profile': t.navWorkerProfile,
    'employer-profile': t.navEmployerProfile,
  };

  const isWorker = authSession?.role === 'worker';
  const isEmployer = authSession?.role === 'employer';

  return (
    <nav className="bg-slate-950 text-slate-300 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Brand */}
          <button
            onClick={() => onRoleChange('landing')}
            className="flex items-center gap-2 shrink-0"
            aria-label="Go to home"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
              S
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black text-white tracking-tight">
                Shramkart
              </span>
              <span className="block text-[10px] text-slate-400 -mt-0.5">
                {t.navSubtitle}
              </span>
            </div>
          </button>

          {/* Desktop Role Tabs */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900/80 rounded-lg p-0.5">
            {(
              [
                { key: 'landing', label: t.navLanding, icon: Briefcase },
                ...(isWorker
                  ? [
                      { key: 'worker', label: t.navWorkerFeed, icon: Briefcase },
                      {
                        key: 'worker-profile',
                        label: t.navWorkerProfile,
                        icon: UserCheck,
                      },
                    ]
                  : []),
                ...(isEmployer
                  ? [
                      {
                        key: 'employer',
                        label: t.navEmployerFeed,
                        icon: Users,
                      },
                      {
                        key: 'employer-profile',
                        label: t.navEmployerProfile,
                        icon: Building2,
                      },
                    ]
                  : []),
              ] as { key: UserRole; label: string; icon: React.ElementType }[]
            ).map((item) => {
              const isActive = currentRole === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onRoleChange(item.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center gap-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLangChange(lang.code)}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                    currentLang === lang.code
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              aria-label={`Notifications, ${unreadNotificationsCount} unread`}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Desktop Quick Actions */}
            <div className="hidden md:flex items-center gap-1.5">
              {isWorker && (
                <button
                  onClick={onOpenCalculator}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Take-Home Estimator</span>
                </button>
              )}

              {isEmployer && (
                <button
                  onClick={onOpenPostJob}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Post Job</span>
                </button>
              )}

              <button
                onClick={onOpenReport}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Report Cut</span>
              </button>

              {authSession ? (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">
                    {authSession.role === 'worker'
                      ? `${activeWorker?.name || 'Worker'} · Logout`
                      : `${employerProfile.companyName || 'Factory'} · Logout`}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuthModal('worker', 'login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 pb-3 space-y-1">
            {(
              [
                { key: 'landing', label: t.navLanding, icon: Briefcase },
                ...(isWorker
                  ? [
                      { key: 'worker', label: t.navWorkerFeed, icon: Briefcase },
                      {
                        key: 'worker-profile',
                        label: t.navWorkerProfile,
                        icon: UserCheck,
                      },
                    ]
                  : []),
                ...(isEmployer
                  ? [
                      {
                        key: 'employer',
                        label: t.navEmployerFeed,
                        icon: Users,
                      },
                      {
                        key: 'employer-profile',
                        label: t.navEmployerProfile,
                        icon: Building2,
                      },
                    ]
                  : []),
              ] as { key: UserRole; label: string; icon: React.ElementType }[]
            ).map((item) => {
              const isActive = currentRole === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onRoleChange(item.key);
                    setMenuOpen(false);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-400 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="border-t border-slate-800 pt-2 space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLangChange(lang.code);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                    currentLang === lang.code
                      ? 'bg-slate-800 text-amber-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-2 space-y-1">
              <button
                onClick={() => {
                  onOpenCalculator();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg"
              >
                <FileText className="w-4 h-4" />
                Take-Home Estimator
              </button>
              <button
                onClick={() => {
                  onOpenReport();
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-slate-800 rounded-lg"
              >
                <MapPin className="w-4 h-4" />
                Report Cut
              </button>
              {authSession ? (
                <button
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    onOpenAuthModal('worker', 'login');
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 rounded-lg"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
