import Link from "next/link";

const workerSteps = [
  ["Sign in with your mobile number", "No resume, no password. A 4-digit code is all you need."],
  ["Build your Trade Card", "Your trade, machines, experience and where you can work. About two minutes."],
  ["Apply in one tap or get found", "See in-hand pay, overtime and hostel up front. Or let factories invite you."],
];

const employerSteps = [
  ["Register your factory", "Add your GSTIN or Udyam number to get the verified badge."],
  ["Post jobs with clear pay", "In-hand salary, overtime and facilities are required on every listing."],
  ["Hunt talent directly", "Filter by trade, machine, experience and relocation. Invite workers to your job."],
];

const pillars = [
  ["Zero commission", "Free for workers, always. Factories pay a flat, transparent fee. Nothing is cut from wages."],
  ["Wages in plain sight", "Every job shows in-hand salary, overtime rate, shift hours, hostel, canteen and PF/ESIC."],
  ["Two-way discovery", "Workers apply to jobs. Factories search workers. Both land in one hiring pipeline."],
  ["Fee demanded? Tell us", "One tap to report any agent who asks for money. No login needed."],
];

export default function Home() {
  return (
    <>
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
            Direct hands for Indian industry
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-6xl">
            Zero middlemen. <span className="text-amber-400">100% fair pay.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Hello Jobs connects ITI holders and factory workers directly with verified manufacturing units, so no
            contractor takes a cut of the salary.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?role=WORKER"
              className="inline-flex min-h-14 items-center justify-center rounded-xl bg-amber-500 px-8 text-lg font-bold text-slate-900 hover:bg-amber-400"
            >
              I want a job
            </Link>
            <Link
              href="/login?role=EMPLOYER"
              className="inline-flex min-h-14 items-center justify-center rounded-xl border-2 border-white px-8 text-lg font-bold hover:bg-white hover:text-slate-900"
            >
              I am hiring for a factory
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            Or <Link href="/jobs" className="underline hover:text-white">browse jobs</Link> without signing in.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Why the old way fails</h2>
        <p className="mt-3 max-w-3xl text-slate-700">
          Factories cannot find reliable skilled workers. Certified ITI graduates cannot find verified factory jobs.
          In between, contractors (<em>thekedars</em>) keep a share of the worker&apos;s monthly wage and deliver
          unverified, high-turnover labour. Hello Jobs removes that layer.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-2">
          {(
            [
              ["For workers", workerSteps, "/login?role=WORKER", "Build my Trade Card"],
              ["For factories", employerSteps, "/login?role=EMPLOYER", "Register my factory"],
            ] as const
          ).map(([heading, steps, href, cta]) => (
            <div key={heading}>
              <h2 className="text-2xl font-extrabold">{heading}</h2>
              <ol className="mt-5 space-y-4">
                {steps.map(([title, body], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500 font-bold text-slate-900">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-bold">{title}</h3>
                      <p className="text-sm text-slate-600">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href={href} className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-slate-900 px-5 font-semibold text-white hover:bg-slate-700">
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
