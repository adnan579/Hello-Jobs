import { reportError, reporterFromEnv } from './server/lib/monitoring';

/**
 * Next.js calls this for any error it catches itself (a page that fails to render, a route that throws before our own
 * handlers run). API errors inside our handlers are reported there, with more detail.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind?: string; routePath?: string; routeType?: string }
): Promise<void> {
  // Redirects and not-found are control flow, not failures.
  const digest = String((error as { digest?: unknown })?.digest ?? '');
  if (digest.startsWith('NEXT_')) return;
  await reportError(reporterFromEnv(), error, {
    where: 'next',
    method: request.method,
    path: request.path,
    tags: { route: String(context?.routePath ?? ''), type: String(context?.routeType ?? '') },
  });
}
