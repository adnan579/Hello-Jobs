export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/admin-auth/login') && !path.startsWith('/admin-auth/verify') && !path.startsWith('/admin-auth/me')) onUnauthorized();
    throw new ApiError(res.status, data.error || data.message || 'Something went wrong. Please try again.', data.code);
  }
  return data as T;
}

export const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export interface Me { email: string; displayName: string; adminRole: string; mustChangePassword: boolean; permissions: string[] }
