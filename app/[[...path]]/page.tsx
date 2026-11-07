import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import App from '../../src/App';
import { languageForCookie, roleForPath, workerTabForPath } from '../../src/utils/routes';
import { COOKIE_NAME, loadAuth } from '../../server/auth/session';
import { publicBootstrap } from '../../server/services/publicJobs';
import { getServerContext } from '../../server/runtime';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function joinedPath(parts: string[] = []) {
  return parts.length ? `/${parts.join('/')}` : '/';
}

export async function generateMetadata({ params }: Pick<RouteProps, 'params'>): Promise<Metadata> {
  const pathname = joinedPath((await params).path);
  const titles: Record<string, string> = {
    '/': 'Shramkart — Direct Hands for Indian Industry',
    '/about': 'About Shramkart',
    '/me': 'My Shramkart profile',
    '/employers/talent': 'Find verified talent | Shramkart',
    '/employers/dashboard': 'Employer dashboard',
  };
  const privateRoute = pathname === '/me' || pathname.startsWith('/me/') || pathname.startsWith('/employers/talent') || pathname.startsWith('/employers/dashboard');
  return { title: titles[pathname] ?? 'Shramkart', robots: privateRoute ? { index: false, follow: false } : undefined };
}

export default async function LegacyAppPage({ params, searchParams }: RouteProps) {
  const { path = [] } = await params;
  const query = await searchParams;
  const cookieStore = await cookies();
  const initialLanguage = languageForCookie(cookieStore.get('hj_language')?.value);
  const pathname = joinedPath(path);
  const role = roleForPath(pathname);
  const requiredRole = pathname === '/me' || pathname.startsWith('/me/')
    ? 'worker'
    : pathname === '/employers/talent' || pathname.startsWith('/employers/talent/')
      ? 'employer'
      : pathname === '/employers/dashboard' || pathname.startsWith('/employers/dashboard/')
      ? 'employer'
      : undefined;

  if (requiredRole) {
    const context = await getServerContext();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const auth = await loadAuth(context, token);
    if (auth?.role !== requiredRole) {
      const nextQuery = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'string') nextQuery.set(key, value);
        else value?.forEach((item) => nextQuery.append(key, item));
      }
      const next = `${pathname}${nextQuery.size ? `?${nextQuery.toString()}` : ''}`;
      redirect(`/login?role=${requiredRole}&next=${encodeURIComponent(next)}`);
    }
  }

  const authRole: 'worker' | 'employer' = query.role === 'employer' ? 'employer' : 'worker';
  const authMode: 'login' | 'register' = query.mode === 'register' ? 'register' : 'login';
  const initialAuth = path[0] === 'login' ? { role: authRole, mode: authMode } : undefined;
  const initialLegalTab = pathname === '/privacy' ? 'privacy' : pathname === '/terms' ? 'terms' : undefined;
  let initialData: Awaited<ReturnType<typeof publicBootstrap>> | undefined;
  if (!requiredRole && !initialLegalTab && path[0] !== 'login') {
    try {
      initialData = await publicBootstrap();
    } catch (error) {
      console.error('[page-bootstrap]', error instanceof Error ? error.message : error);
    }
  }

  return (
    <App
      initialRole={role}
      initialData={initialData}
      initialAuth={initialAuth}
      initialLegalTab={initialLegalTab}
      initialNextPath={typeof query.next === 'string' ? query.next : undefined}
      initialWorkerTab={workerTabForPath(pathname)}
      initialLanguage={initialLanguage}
    />
  );
}