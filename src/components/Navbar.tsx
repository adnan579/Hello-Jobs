import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Calculator,
  GraduationCap,
  ShieldAlert,
  Globe,
  ArrowLeft,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  User,
  LogIn,
  Factory,
} from 'lucide-react';
import type { Language, UserRole, JobListing, NotificationEvent } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface Props {
  role: UserRole;
  onRoleSwitch: (role: UserRole) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  unreadNotificationsCount: number;
  onNotificationClick: () => void;
  onCalculatorClick: () => void;
  onNcvtClick: () => void;
  onReportClick: () => void;
  activeWorker: { id: string; name: string; phone: string; savedJobIds: string[] } | null;
  employerProfile: { id: string; companyName: string; companyId: string; credits: number } | null;
  onLogin: () => void;
  onProfileClick: () => void;
  onPostJob: (job: JobListing) => void;
}

export default function Navbar(props: Props) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const t = TRANSLATIONS[props.language];

  const navItems = [
    { id: 'jobs', label: t.navJobs, icon: Briefcase, active: props.role === 'worker' },
    { id: 'hunt', label: t.navHunt, icon: Users, active: props.role === 'employer' },
    { id: 'calc', label: t.navCalculator, icon: Calculator, active: false },
    { id: 'ncvt', label: t.navNcvt, icon: GraduationCap, active: false },
    { id: 'report', label: t.navReport, icon: ShieldAlert, active: false },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {props.role !== 'landing' && (
              <button
                onClick={() => props.onRoleSwitch('landing')}
                className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t.backToHome}
                title={t.backToHome}
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            )}
            <button
              onClick={() => props.onRoleSwitch('landing')}
              className="flex items-center gap-2"
              aria-label="Shramkart home"
            >
              <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-slate-950" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-extrabold text-slate-950 dark:text-white leading-tight">Shramkart</h1>
                <p className="text-[10px] text-slate-500 leading-tight">{t.brandTagline}</p>
              </div>
            </button>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'jobs') props.onRoleSwitch('worker');
                  if (item.id === 'hunt') props.onRoleSwitch('employer');
                  if (item.id === 'calc') props.onCalculatorClick();
                  if (item.id === 'ncvt') props.onNcvtClick();
                  if (item.id === 'report') props.onReportClick();
                }}
                className={
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition ' +
                  (item.active
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
                aria-current={item.active ? 'page' : undefined}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {/* Language switcher */}
            <select
              value={props.language}
              onChange={(e) => props.onLanguageChange(e.target.value as Language)}
              className="hidden sm:block text-xs font-bold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200"
              aria-label="Select language"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
            </select>

            {/* Notifications */}
            <button
              onClick={props.onNotificationClick}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={`Notifications${props.unreadNotificationsCount > 0 ? `, ${props.unreadNotificationsCount} unread` : ''}`}
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              {props.unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {props.unreadNotificationsCount > 9 ? '9+' : props.unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* Dark mode */}
            <button
              onClick={props.onDarkModeToggle}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label={props.darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={props.darkMode ? 'Light mode' : 'Dark mode'}
            >
              {props.darkMode ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Profile / Login */}
            {props.activeWorker || props.employerProfile ? (
              <button
                onClick={props.onProfileClick}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Open profile"
                title="Profile"
              >
                <User className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            ) : (
              <button
                onClick={props.onLogin}
                className="hidden sm:flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold px-3 py-2 rounded-lg transition"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowMobileMenu((s) => !s)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle menu"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? (
                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setShowMobileMenu(false);
                  if (item.id === 'jobs') props.onRoleSwitch('worker');
                  if (item.id === 'hunt') props.onRoleSwitch('employer');
                  if (item.id === 'calc') props.onCalculatorClick();
                  if (item.id === 'ncvt') props.onNcvtClick();
                  if (item.id === 'report') props.onReportClick();
                }}
                className={
                  'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold transition ' +
                  (item.active
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
                aria-current={item.active ? 'page' : undefined}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <select
                value={props.language}
                onChange={(e) => props.onLanguageChange(e.target.value as Language)}
                className="w-full text-xs font-bold bg-slate-100 dark:bg-slate-800 border-0 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200"
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
            {!props.activeWorker && !props.employerProfile && (
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  props.onLogin();
                }}
                className="w-full flex items-center justify-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-extrabold px-3 py-2.5 rounded-lg transition mt-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
