import Link from "next/link";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function Header() {
  const user = await getCurrentUser();
  const home = user ? homeFor(user) : "/";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-slate-900">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-lg bg-amber-500 text-slate-900">
            HJ
          </span>
          Hello Jobs
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium text-slate-700 sm:gap-3">
          <Link href="/jobs" className="rounded-md px-3 py-2 hover:bg-slate-100">
            Jobs
          </Link>
          {user?.role === "EMPLOYER" && (
            <Link href="/employer/hunt" className="rounded-md px-3 py-2 hover:bg-slate-100">
              Hunt talent
            </Link>
          )}
          {user ? (
            <>
              <Link href={home} className="rounded-md px-3 py-2 hover:bg-slate-100">
                {user.role === "ADMIN" ? "Admin" : "Dashboard"}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="rounded-md px-3 py-2 hover:bg-slate-100">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
