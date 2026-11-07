import type { Language, UserRole } from '../types';
import type { WorkerTab } from '../components/Navbar';

export const APP_ROLE_PATHS: Partial<Record<UserRole, string>> = {
  landing: '/',
  about: '/about',
  worker: '/jobs',
  employer: '/employers/talent',
  'worker-profile': '/me',
  'employer-profile': '/employers/dashboard',
  admin: '/admin',
};

export function roleForPath(pathname: string, hash = ''): UserRole {
  if (hash === '#/about' || pathname === '/about') return 'about';
  if (pathname === '/jobs' || pathname.startsWith('/jobs/')) return 'worker';
  if (pathname === '/employers/talent' || pathname.startsWith('/employers/talent/')) return 'employer';
  if (pathname === '/me' || pathname.startsWith('/me/')) return 'worker-profile';
  if (pathname === '/employers/dashboard' || pathname.startsWith('/employers/dashboard/')) return 'employer-profile';
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
  return 'landing';
}

export function workerTabForPath(pathname: string): WorkerTab {
  if (pathname === '/me/applications' || pathname.startsWith('/me/applications/')) return 'inbox';
  if (pathname === '/me/id-card' || pathname.startsWith('/me/id-card/')) return 'idcard';
  return 'profile';
}

export function languageForCookie(value?: string): Language {
  return value === 'hi' || value === 'mr' || value === 'ta' ? value : 'en';
}