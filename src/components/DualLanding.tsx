import React from 'react';
import {
  UserRole,
  Language,
  AuthSession,
  CandidateProfile,
  EmployerFactoryProfile,
  JobListing,
} from '../types';
import { TRANSLATIONS } from '../data/translations';
import {
  ShieldCheck,
  Users,
  Factory,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Volume2,
  Clock,
  Coins,
  Cpu,
  UserPlus,
  LogIn,
  Building2,
  MapPin,
  Briefcase,
  Home,
} from 'lucide-react';

interface Props {
  currentLang: Language;
  authSession: AuthSession | null;
  activeWorker?: CandidateProfile;
  employerProfile: EmployerFactoryProfile;
  jobs?: JobListing[];
  candidates?: CandidateProfile[];
  onSelectRole: (role: UserRole) => void;
  onOpenCalculator: () => void;
  onOpenReport: () => void;
  onOpenAuthModal: (
    initialTab: 'worker' | 'employer',
    initialMode?: 'login' | 'register'
  ) => void;
  onOpenLegalModal?: (tab?: 'privacy' | 'terms') => void;
}

export const DualLanding: React.FC<Props> = ({
  currentLang,
  authSession,
  activeWorker,
  employerProfile,
  jobs = [],
  candidates = [],
  onSelectRole,
  onOpenCalculator,
  onOpenAuthModal,
}) => {
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

  const liveActiveJobs = jobs.filter((j) => j.isActive !== false);
  const liveActiveJobsCount = liveActiveJobs.length;
  const totalOpenSeats = liveActiveJobs.reduce(
    (acc, j) => acc + (j.vacanciesLeft || 0),
    0
  );

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-14 pb-20 sm:pt-18 sm:pb-24 border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-amber-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{t.heroBadge}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Direct Hands for Indian Industry. <br className="hidden sm:inline" />
              <span className="text-amber-400">Zero Middlemen. 100% Fair Pay.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              {t.heroMainDesc}
            </p>

            {/* Primary Registration & Login Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {authSession?.role === 'worker' && activeWorker ? (
                <>
                  <button
                    onClick={() => onSelectRole('worker')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-extrabold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-lg cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Go to Jobs Feed ({liveActiveJobsCount} Live Jobs)</span>
                  </button>
                  <button
                    onClick={() => onSelectRole('worker-profile')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>My Profile ({activeWorker.name})</span>
                  </button>
                </>
              ) : authSession?.role === 'employer' ? (
                <>
                  <button
                    onClick={() => onSelectRole('employer-profile')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg cursor-pointer"
                  >
                    <Factory className="w-4 h-4" />
                    <span>Go to Employer Dashboard</span>
                  </button>
                  <button
                    onClick={() => onSelectRole('employer')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Browse Candidate Directory ({candidates.length})</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onOpenAuthModal('worker', 'register')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-extrabold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-lg cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register as Worker</span>
                  </button>
                  <button
                    onClick={() => onOpenAuthModal('employer', 'register')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-extrabold text-sm bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg cursor-pointer"
                  >
                    <Factory className="w-4 h-4" />
                    <span>Register as Employer</span>
                  </button>
                  <button
                    onClick={() => onOpenAuthModal('worker', 'login')}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-amber-400" />
                    <span>Log In</span>
                  </button>
                </>
              )}
            </div>

            {/* Live Platform Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-300 tabular-nums">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {liveActiveJobsCount} Live Job Postings ({totalOpenSeats} Open Positions)
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-300 tabular-nums">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                {candidates.length} Verified Workers Ready to Join
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                100% Free for Workers
              </span>
            </div>
          </div>

          {/* Dual Portal Entry Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 items-stretch">
            {/* Card 1: For Workers */}
            <div className="relative group bg-slate-800/90 hover:bg-slate-800 border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl p-6 sm:p-8 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-amber-300">
                    FOR WORKERS & ITI TECHNICIANS
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Find Direct Factory Jobs
                  </h2>
                  <p className="text-sm text-slate-300 mt-2">
                    Search verified factory jobs with clear monthly in-hand salary, overtime pay, shift schedules, and hostel/mess facilities. Apply in one tap and track your offers.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Guaranteed monthly in-hand pay with zero middleman cuts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Listen to job details in Hindi, Marathi, Tamil & English</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Jobs for Helpers & Packers (No Certificate) and ITI Operators</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {authSession?.role === 'worker' && activeWorker ? (
                  <>
                    <button
                      onClick={() => onSelectRole('worker')}
                      className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Open Jobs Feed</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectRole('worker-profile')}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-950 text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Edit My Profile</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenAuthModal('worker', 'register')}
                      className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Register as Worker</span>
                    </button>
                    <button
                      onClick={() => onOpenAuthModal('worker', 'login')}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-950 text-white border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4 text-amber-400" />
                      <span>Worker Login</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Card 2: For Employers */}
            <div className="relative group bg-slate-800/90 hover:bg-slate-800 border-2 border-blue-500/40 hover:border-blue-400 rounded-2xl p-6 sm:p-8 transition-all duration-200 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Factory className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-extrabold text-blue-300">
                    FOR MANUFACTURING EMPLOYERS & HR
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Hire Verified Shop-Floor Talent
                  </h2>
                  <p className="text-sm text-slate-300 mt-2">
                    Launch hiring drives, post shift requirements, shortlist skilled ITI operators and helpers, schedule interviews, and issue digital offer letters from one dashboard.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Filter candidates by trade, machines operated, and location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Manage multi-plant job postings and applicant pipelines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Direct candidate shortlisting and instant digital offer letters</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {authSession?.role === 'employer' ? (
                  <>
                    <button
                      onClick={() => onSelectRole('employer-profile')}
                      className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-white hover:bg-slate-100 text-slate-900 transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span>Open Employer Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectRole('employer')}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-950 text-blue-300 border border-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Shortlist Candidates</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenAuthModal('employer', 'register')}
                      className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-white hover:bg-slate-100 text-slate-900 transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Building2 className="w-4 h-4 text-blue-700" />
                      <span>Register as Employer</span>
                    </button>
                    <button
                      onClick={() => onOpenAuthModal('employer', 'login')}
                      className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-950 text-white border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4 text-blue-400" />
                      <span>Employer Login</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Factory Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">
              Live Hiring Now
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Latest Direct Factory Openings
            </h2>
          </div>
          <button
            onClick={() => onSelectRole('worker')}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-900 hover:text-amber-700"
          >
            <span>View All {liveActiveJobsCount} Jobs in Feed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {liveActiveJobs.slice(0, 3).map((job) => (
            <div
              key={job.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xl font-extrabold text-emerald-700 tabular-nums">
                    ₹{job.takeHomeSalary.toLocaleString('en-IN')}/mo
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                    + ₹{job.overtimeHourlyRate}/hr OT
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {job.title}
                </h3>

                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.companyName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {job.industrialHub} ({job.state})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                  {job.noCertificateRequired && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                      No Certificate Needed
                    </span>
                  )}
                  {job.facilities.hasHostel && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Home className="w-3 h-3 text-amber-600" />
                      Hostel Available
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 tabular-nums">
                  {job.vacanciesLeft} positions open
                </span>
                <button
                  onClick={() => onSelectRole('worker')}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors"
                >
                  <span>View & Apply</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Impact Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="space-y-1 p-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 block tabular-nums">
              ₹0.00
            </span>
            <div className="text-xs font-bold text-slate-900">{t.statZeroCuts}</div>
            <p className="text-xs text-slate-500">{t.statZeroCutsDesc}</p>
          </div>

          <div className="space-y-1 p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 block tabular-nums">
              {candidates.length} Active
            </span>
            <div className="text-xs font-bold text-slate-900">{t.statWorkers}</div>
            <p className="text-xs text-slate-500">{t.statWorkersDesc}</p>
          </div>

          <div className="space-y-1 p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 block tabular-nums">
              {liveActiveJobsCount} Live Jobs
            </span>
            <div className="text-xs font-bold text-slate-900">{t.statFactories}</div>
            <p className="text-xs text-slate-500">{t.statFactoriesDesc}</p>
          </div>

          <div className="space-y-1 p-2 border-l border-slate-100">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 block tabular-nums">
              {employerProfile.promiseKeptScorePct ?? 96}%
            </span>
            <div className="text-xs font-bold text-slate-900">Verified Offer Accuracy</div>
            <p className="text-xs text-slate-500">Direct payroll & promised take-home pay</p>
          </div>
        </div>
      </section>

      {/* Why Direct Hiring Works Better */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="p-6 sm:p-8 bg-red-50/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-red-950">
                    Traditional Contractor (Thekedar) System
                  </h3>
                  <div className="text-xs text-red-700">Monthly Wage Cuts & High Turnover</div>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Middlemen often bill factories ₹28,000 per worker while handing over only ₹18,000 in cash—taking a monthly cut from the worker's hard-earned wages and causing high attrition.
              </p>
            </div>

            <div className="p-6 sm:p-8 bg-emerald-50/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Hello Jobs Direct Hiring Platform
                  </h3>
                  <div className="text-xs text-emerald-700">100% Fair Pay, Verified Skills, Direct Loyalty</div>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Every job listing shows the exact Basic + DA, PF, ESIC, and guaranteed monthly in-hand salary. Workers apply directly to factory HR teams and receive official digital offer letters.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 font-medium">
              Want to compare your monthly take-home pay and annual savings without middlemen?
            </span>
            <button
              onClick={onOpenCalculator}
              className="inline-flex items-center gap-1.5 text-amber-700 font-bold hover:text-amber-800"
            >
              <span>Open Take-Home Salary Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
