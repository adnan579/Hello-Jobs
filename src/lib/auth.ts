import { redirect } from "next/navigation";
import { db } from "./db";
import { getSession, type SessionRole } from "./session";

export { safeNext } from "./auth-paths";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { workerProfile: true, employerProfile: true },
  });
  // Cookie outlived the account (e.g. reseeded DB): treat as logged out.
  return user ?? null;
}

function loginUrl(role: SessionRole | undefined, next?: string) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (next) params.set("next", next);
  const qs = params.toString();
  return `/login${qs ? `?${qs}` : ""}`;
}

export async function requireWorker(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("WORKER", next));
  if (user.role !== "WORKER") redirect("/");
  return user;
}

export async function requireEmployer(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl("EMPLOYER", next));
  if (user.role !== "EMPLOYER") redirect("/");
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(undefined, "/admin/employers"));
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Where a signed-in user should land. */
export function homeFor(user: {
  role: string;
  workerProfile: unknown;
  employerProfile: unknown;
}): string {
  if (user.role === "ADMIN") return "/admin/employers";
  if (user.role === "EMPLOYER") return user.employerProfile ? "/employer" : "/employer/onboarding";
  return user.workerProfile ? "/worker" : "/worker/onboarding";
}
