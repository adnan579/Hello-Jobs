import React from 'react';
import {
  Bell,
  Briefcase,
  Building2,
  FileText,
  LogIn,
  LogOut,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { UserRole } from '../types';
import type { TFunction } from '../data/translations';
import type { WorkerTab } from './Navbar';

interface Props {
  t: TFunction;
  currentRole: UserRole;
  /** Who is signed in, or null for a visitor. */
  signedInAs: 'worker' | 'employer' | null;
  workerTab: WorkerTab;
  unreadCount: number;
  onRoleChange: (role: UserRole) => void;
  onOpenWorkerTab: (tab: WorkerTab) => void;
  onOpenNotifications: () => void;
  onOpenPostJob: () => void;
  onOpenAuthModal: (tab: 'worker' | 'employer', mode: 'login' | 'register') => void;
  /** When given, signed-in people get a labelled Log out button, so a shared phone can be left safely. */
  onLogout?: () => void;
}

interface Item {
  key: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  badge?: number;
  ariaLabel?: string;
}

/**
 * Phone navigation. Each person only sees destinations that exist for their role, every label is
 * translated, and the current page is marked three ways: a top bar, brighter text and aria-current.
 * The page behind it reserves space for it (see .pb-nav), so it never covers content.
 */
export const BottomNav: React.FC<Props> = ({
  t,
  currentRole,
  signedInAs,
  workerTab,
  unreadCount,
  onRoleChange,
  onOpenWorkerTab,
  onOpenNotifications,
  onOpenPostJob,
  onOpenAuthModal,
  onLogout,
}) => {
  const icon = 'h-5 w-5';
  const onProfilePage = currentRole === 'worker-profile';

  const alerts: Item = {
    key: 'alerts',
    label: t('navAlerts'),
    icon: <Bell className={icon} aria-hidden="true" />,
    active: false,
    onClick: onOpenNotifications,
    badge: unreadCount,
    ariaLabel: unreadCount > 0 ? t('bellAria', { n: unreadCount }) : t('bellAriaNone'),
  };

  const items: Item[] =
    signedInAs === 'employer'
      ? [
          {
            key: 'dash',
            label: t('navDashboard'),
            icon: <Building2 className={icon} aria-hidden="true" />,
            active: currentRole === 'employer-profile',
            onClick: () => onRoleChange('employer-profile'),
          },
          {
            key: 'cands',
            label: t('navCandidates'),
            icon: <Users className={icon} aria-hidden="true" />,
            active: currentRole === 'employer',
            onClick: () => onRoleChange('employer'),
          },
          {
            key: 'post',
            label: t('navPostJob'),
            icon: <Briefcase className={icon} aria-hidden="true" />,
            active: false,
            onClick: onOpenPostJob,
          },
          alerts,
        ]
      : signedInAs === 'worker'
        ? [
            {
              key: 'jobs',
              label: t('navJobsFeed'),
              icon: <Briefcase className={icon} aria-hidden="true" />,
              active: currentRole === 'worker',
              onClick: () => onRoleChange('worker'),
            },
            {
              key: 'apps',
              label: t('navApplicationsShort'),
              icon: <FileText className={icon} aria-hidden="true" />,
              active: onProfilePage && workerTab === 'inbox',
              onClick: () => onOpenWorkerTab('inbox'),
            },
            {
              key: 'me',
              label: t('navMyProfile'),
              icon: <UserCheck className={icon} aria-hidden="true" />,
              active: onProfilePage && workerTab !== 'inbox',
              onClick: () => onOpenWorkerTab('home'),
            },
            alerts,
          ]
        : [
            {
              key: 'jobs',
              label: t('navBrowseJobs'),
              icon: <Briefcase className={icon} aria-hidden="true" />,
              active: currentRole === 'worker',
              onClick: () => onRoleChange('worker'),
            },
            {
              key: 'emp',
              label: t('navForEmployers'),
              icon: <Building2 className={icon} aria-hidden="true" />,
              active: currentRole === 'employer',
              onClick: () => onRoleChange('employer'),
            },
            {
              key: 'login',
              label: t('navLogin'),
              icon: <LogIn className={icon} aria-hidden="true" />,
              active: false,
              onClick: () => onOpenAuthModal(currentRole === 'employer' ? 'employer' : 'worker', 'login'),
            },
            {
              key: 'reg',
              label: t('navRegister'),
              icon: <UserPlus className={icon} aria-hidden="true" />,
              active: false,
              onClick: () => onOpenAuthModal(currentRole === 'employer' ? 'employer' : 'worker', 'register'),
            },
          ];

  if (signedInAs && onLogout) {
    items.push({
      key: 'logout',
      label: t('navLogout'),
      icon: <LogOut className={icon} aria-hidden="true" />,
      active: false,
      onClick: onLogout,
    });
  }

  const accent = signedInAs === 'employer' || currentRole === 'employer' ? 'bg-blue-400' : 'bg-[var(--sk-amber)]';

  return (
    <nav
      aria-label={t('navMobileAria')}
      data-on-dark
      className="fixed inset-x-0 bottom-0 z-40 grid h-[var(--sk-bottom-nav-h)] border-t border-slate-800 bg-slate-950 pb-[env(safe-area-inset-bottom)] text-slate-300 lg:hidden"
      style={{ boxSizing: 'content-box', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={item.onClick}
          aria-current={item.active ? 'page' : undefined}
          aria-label={item.ariaLabel}
          className={`relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-center text-meta font-bold leading-tight ${
            item.active ? 'text-white' : 'text-slate-300 hover:text-white'
          }`}
        >
          {item.active && <span aria-hidden="true" className={`absolute inset-x-4 top-0 h-1 rounded-b ${accent}`} />}
          <span className="relative">
            {item.icon}
            {item.badge ? (
              <span
                aria-hidden="true"
                className="absolute -right-2.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--sk-amber)] px-1 text-meta font-black tabular-nums text-slate-950"
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            ) : null}
          </span>
          <span className="w-full break-words">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
