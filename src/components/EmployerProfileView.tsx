import { canTransitionPipeline } from '../modules/domain';
import React, { useState } from 'react';
import {
  EmployerFactoryProfile,
  JobListing,
  JobApplication,
  OfferLetter,
  CandidateProfile,
  FactoryShowcaseItem,
  CreditLedgerEntry,
  CompanyMember,
  FactoryPlant,
} from '../types';
import { calculatePmvbryIncentive } from '../modules/domain';
import { eraseEmployerDataApi } from '../utils/api';
import {
  Factory,
  ShieldCheck,
  Building2,
  MapPin,
  Users,
  FileText,
  Briefcase,
  Plus,
  CheckCircle2,
  Award,
  Bookmark,
  LogOut,
  Save,
  Home,
  Utensils,
  Bus,
  Search,
  Trash2,
  Coins,
  Clock,
  Calendar,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  employer: EmployerFactoryProfile;
  jobs: JobListing[];
  applications: JobApplication[];
  offers: OfferLetter[];
  candidates: CandidateProfile[];
  shortlistedIds: string[];
  creditLedger?: CreditLedgerEntry[];
  onUpdateEmployer: (updated: EmployerFactoryProfile) => void;
  onUpdateJob: (updatedJob: JobListing) => void;
  onUpdateApplicationStatus: (
    appId: string,
    status: JobApplication['status'],
    employerPrivateNotes?: string
  ) => void;
  onPurchaseCredits?: (packId: 'PACK_10' | 'PACK_25' | 'PACK_100') => Promise<void>;
  onToggleShortlist: (candidateId: string) => void;
  onInspectCertificate: (candidate: CandidateProfile) => void;
  onOpenIssueOffer: (candidate: CandidateProfile) => void;
  onOpenPostJob: () => void;
  onBrowseTalent: () => void;
  onLogout: () => void;
}

export const EmployerProfileView: React.FC<Props> = ({
  employer,
  jobs,
  applications,
  offers,
  candidates,
  shortlistedIds,
  creditLedger = [],
  onUpdateEmployer,
  onUpdateJob,
  onUpdateApplicationStatus,
  onPurchaseCredits,
  onToggleShortlist,
  onInspectCertificate,
  onOpenIssueOffer,
  onOpenPostJob,
  onBrowseTalent,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'factory' | 'jobs' | 'pipeline' | 'credits'
  >('dashboard');

  // Editable Factory Profile state
  const [companyName, setCompanyName] = useState(employer.companyName);
  const [gstin, setGstin] = useState(employer.gstin);
  const [udyamNumber, setUdyamNumber] = useState(employer.udyamNumber);
  const [factoryLicenseNumber, setFactoryLicenseNumber] = useState(
    employer.factoryLicenseNumber
  );
  const [hrManagerName, setHrManagerName] = useState(employer.hrManagerName);
  const [hrEmail, setHrEmail] = useState(employer.hrEmail);
  const [hrPhone, setHrPhone] = useState(employer.hrPhone);
  const [plantAddress, setPlantAddress] = useState(employer.plantAddress);
  const [industrialHub, setIndustrialHub] = useState(employer.industrialHub);
  const [state, setState] = useState(employer.state);
  const [totalWorkforceCount, setTotalWorkforceCount] = useState(
    employer.totalWorkforceCount
  );
  const [industrySector, setIndustrySector] = useState(employer.industrySector);

  // Welfare Facilities state
  const [hasHostel, setHasHostel] = useState(employer.facilities.hasHostel);
  const [hasSubsidizedMess, setHasSubsidizedMess] = useState(
    employer.facilities.hasSubsidizedMess
  );
  const [hasBusPickup, setHasBusPickup] = useState(
    employer.facilities.hasBusPickup
  );
  const [canteenRate, setCanteenRate] = useState(employer.facilities.canteenRate);
  const [hostelDetails, setHostelDetails] = useState(
    employer.facilities.hostelDetails
  );

  // M7 Multi-Plant GSTINs & Team Members
  const [plants, setPlants] = useState<FactoryPlant[]>(employer.plants || []);
  const [teamMembers, setTeamMembers] = useState<CompanyMember[]>(
    employer.teamMembers || []
  );
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<CompanyMember['role']>('Recruiter');

  // M7 Private Applicant Notes & Interview Scheduler
  const [privateNotesMap, setPrivateNotesMap] = useState<Record<string, string>>({});

  // M13 PMVBRY Subsidy Calculator State
  const [pmvbryHeadcount, setPmvbryHeadcount] = useState(15);
  const [pmvbryFirstTimers, setPmvbryFirstTimers] = useState(10);
  const [pmvbryAvgGross, setPmvbryAvgGross] = useState(21500);

  // Showcase items state
  const [showcase, setShowcase] = useState<FactoryShowcaseItem[]>(
    employer.factoryShowcase
  );
  const [newShowTitle, setNewShowTitle] = useState('');
  const [newShowCat, setNewShowCat] =
    useState<FactoryShowcaseItem['category']>('Shop Floor');
  const [newShowDesc, setNewShowDesc] = useState('');
  const [newShowBadge, setNewShowBadge] = useState('ISO Verified');

  const [saveToast, setSaveToast] = useState(false);
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);

  const shortlistedCandidates = candidates.filter((c) =>
    shortlistedIds.includes(c.id)
  );

  const waitingApplicants = applications.filter((a) => a.status === 'Applied');
  const pmvbryResult = calculatePmvbryIncentive({
    newHiresCount: pmvbryHeadcount,
    firstTimeEpfoCount: pmvbryFirstTimers,
    averageMonthlyWage: pmvbryAvgGross,
    isManufacturingSector: true,
  });

  const handleSaveFactoryProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: EmployerFactoryProfile = {
      ...employer,
      companyName,
      gstin,
      udyamNumber,
      factoryLicenseNumber,
      hrManagerName,
      hrEmail,
      hrPhone,
      plantAddress,
      industrialHub,
      state,
      totalWorkforceCount: Number(totalWorkforceCount),
      industrySector,
      plants,
      teamMembers,
      facilities: {
        ...employer.facilities,
        hasHostel,
        hasSubsidizedMess,
        hasBusPickup,
        canteenRate,
        hostelDetails,
      },
      factoryShowcase: showcase,
    };

    onUpdateEmployer(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleAddTeamMember = () => {
    if (!newMemberName.trim() || !newMemberPhone.trim()) return;
    setTeamMembers([
      ...teamMembers,
      {
        id: `mem-${Date.now()}`,
        name: newMemberName.trim(),
        phone: newMemberPhone.trim(),
        role: newMemberRole,
        addedAt: 'Just now',
      },
    ]);
    setNewMemberName('');
    setNewMemberPhone('');
  };

  const handleExportFactoryData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      policyVersion: 'v2026.11',
      employerProfile: employer,
      postedJobs: jobs,
      applicationsReceived: applications,
      issuedOffers: offers,
      creditLedger,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HelloJobs_Factory_DPDP_Export_${employer.gstin}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFactoryAccount = async () => {
    await eraseEmployerDataApi();
    onLogout();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
      {/* Top Employer Factory Identity Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
            <Factory className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {employer.companyName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-xs font-semibold tabular-nums ${
                  employer.kybVerificationStatus === 'VERIFIED'
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {employer.kybVerificationStatus === 'VERIFIED'
                  ? 'Verified · '
                  : employer.kybVerificationStatus === 'CANCELLED_GSTIN'
                  ? 'Not approved · '
                  : 'Verification pending · '}
                GSTIN: {employer.gstin}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-400 text-slate-950 text-xs font-extrabold tabular-nums">
                <Coins className="w-3.5 h-3.5" />
                {employer.huntCredits ?? 0} Hunt Credits
              </span>
            </div>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-amber-400">
                {employer.hrManagerName} (Owner / Plant HR)
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {employer.industrialHub}, {employer.state}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums text-emerald-300 font-semibold">
                {employer.promiseKeptScorePct != null
                  ? `Promise Kept: ${employer.promiseKeptScorePct}%`
                  : 'Promise-kept score appears after 3 worker check-ins'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <button
            onClick={onBrowseTalent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span>Search & Shortlist Candidates</span>
          </button>

          <button
            onClick={onOpenPostJob}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Job</span>
          </button>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/70 hover:bg-red-950/60 border border-slate-700 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Employer Dashboard Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Hiring Overview & Operations</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'jobs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4 text-blue-500" />
          <span>
            Job Postings & Applicants ({applications.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'pipeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>
            Shortlisted ({shortlistedCandidates.length}) & Offer Letters ({offers.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('credits')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'credits'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Contact Credits & Invoices</span>
        </button>

        <button
          onClick={() => setActiveTab('factory')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'factory'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>Company Profile & Team</span>
        </button>
      </div>

      {/* TAB 1: M7 WORKSPACE DASHBOARD & M13 PMVBRY SUBSIDY ESTIMATOR */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">
                Active Shift Vacancies
              </span>
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1 block">
                {jobs.reduce((acc, j) => acc + j.vacanciesLeft, 0)} Seats
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                Across {jobs.length} live job postings
              </span>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">
                Applicants Awaiting Review
              </span>
              <span className="text-2xl font-extrabold text-amber-600 tabular-nums mt-1 block">
                {waitingApplicants.length} Workers
              </span>
              <span className="text-[11px] text-slate-500">
                Target SLA: &lt; 6 hours response
              </span>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">
                Contact Credit Balance
              </span>
              <span className="text-2xl font-extrabold text-blue-700 tabular-nums mt-1 block">
                {employer.huntCredits ?? 0} Credits
              </span>
              <span className="text-[11px] text-slate-500">
                {(employer.unlockedCandidateIds || []).length} candidate contacts unlocked
              </span>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <span className="text-xs text-slate-500 font-semibold block">
                Worker Retention & Offer Accuracy
              </span>
              <span className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1 block">
                {employer.promiseKeptScorePct != null ? `${employer.promiseKeptScorePct}%` : '—'}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {employer.promiseKeptScorePct != null ? 'Verified via post-joining check-ins' : 'Needs 3 worker check-ins'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actionable Task List: Applicants Waiting */}
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                    Priority HR Action Queue
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Applicants Waiting for Shortlist / Interview
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="text-xs font-bold text-blue-700 hover:underline"
                >
                  Open All Applicants →
                </button>
              </div>

              {applications.slice(0, 4).map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">
                      {app.candidateName} · <span className="text-blue-700">{app.candidateTrade}</span>
                    </div>
                    <div className="text-slate-500">
                      Applied for {app.jobTitle} ({app.appliedAt})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateApplicationStatus(app.id, 'Shortlisted')}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold"
                    >
                      Shortlist Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* PM Viksit Bharat Rozgar Yojana (PMVBRY) Subsidy Estimator */}
            <div className="p-6 bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  PM Viksit Bharat Rozgar Yojana (PMVBRY) EPFO Estimator
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Calculate Factory & First-Timer EPFO Government Incentives
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Estimate statutory EPFO incentives for net additional manufacturing hires.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Net Additional Hires
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={pmvbryHeadcount}
                    onChange={(e) => setPmvbryHeadcount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg bg-white font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    First-Time EPFO Workers
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={pmvbryFirstTimers}
                    onChange={(e) => setPmvbryFirstTimers(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg bg-white font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Avg Gross Wage (₹)
                  </label>
                  <input
                    type="number"
                    step={500}
                    value={pmvbryAvgGross}
                    onChange={(e) => setPmvbryAvgGross(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg bg-white font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-emerald-200 rounded-xl text-xs tabular-nums">
                <div>
                  <span className="text-slate-500 block">
                    Part B Employer Incentive (4-Yr Mfg)
                  </span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    ₹{pmvbryResult.totalEmployerIncentive.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    ₹{pmvbryResult.employerMonthlyPerWorker.toLocaleString('en-IN')}/mo per worker
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">
                    Part A Worker Direct Benefit
                  </span>
                  <span className="text-lg font-extrabold text-blue-700">
                    ₹{pmvbryResult.workerDirectBenefitTotal.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Up to ₹15,000 per first-time EPFO worker
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: M7 PER-JOB APPLICANT PIPELINE & BULK ACTIONS */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Active Job Postings & Applicant Pipeline
              </h3>
              <p className="text-xs text-slate-600">
                Review applicants, shortlist candidates, schedule gate trials, and issue digital offer letters.
              </p>
            </div>
            <button
              onClick={onOpenPostJob}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Shift Opening</span>
            </button>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => {
              const jobApps = applications.filter((a) => a.jobId === job.id);
              const isJobOpen = job.isActive !== false && job.vacanciesLeft > 0;

              return (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-blue-700">{job.trade}</span>
                        <span aria-hidden="true">·</span>
                        <span>{job.industrialHub}</span>
                        <span aria-hidden="true">·</span>
                        <span>Expires {job.expiresAt || 'in 30 days'}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">
                        {job.title}
                      </h4>
                      <div className="text-xs text-slate-600 tabular-nums mt-0.5">
                        In-Hand: <strong className="text-emerald-700">₹{job.takeHomeSalary.toLocaleString('en-IN')}/mo</strong> · OT: ₹{job.overtimeHourlyRate}/hr · Shift: {job.shiftPattern}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {jobApps.some((a) => a.status === 'Applied') && (
                        <button
                          type="button"
                          onClick={() => {
                            jobApps
                              .filter((a) => a.status === 'Applied')
                              .forEach((a) =>
                                onUpdateApplicationStatus(a.id, 'Shortlisted')
                              );
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs"
                        >
                          Bulk Shortlist All ({jobApps.filter((a) => a.status === 'Applied').length})
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateJob({
                            ...job,
                            isActive: !isJobOpen,
                          })
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isJobOpen
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isJobOpen ? 'Active Hiring' : 'Paused'}
                      </button>
                    </div>
                  </div>

                  {/* Applicant Cards */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    {jobApps.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">
                        No direct applications for this posting yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {jobApps.map((app) => {
                          const matchedCandidate = candidates.find(
                            (c) => c.id === app.candidateId
                          );
                          return (
                            <div
                              key={app.id}
                              className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-2.5 text-xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                    <span>{app.candidateName}</span>
                                    {app.ncvtVerified && (
                                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                        NCVT Verified
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-600 mt-0.5 tabular-nums">
                                    {app.candidateTrade} · Direct Phone: <strong>{app.candidatePhone}</strong>
                                  </div>
                                </div>

                                <select
                                  value={app.status}
                                  onChange={(e) =>
                                    onUpdateApplicationStatus(
                                      app.id,
                                      e.target.value as JobApplication['status'],
                                      privateNotesMap[app.id]
                                    )
                                  }
                                  className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-800 text-[11px]"
                                >
                                  {[
                                    'Applied',
                                    'Shortlisted',
                                    'Interview',
                                    'Offer Issued',
                                    'Accepted',
                                    'Joined',
                                    'Declined',
                                    'Rejected',
                                    'No-show',
                                  ].filter(
                                    (st) =>
                                      st === app.status ||
                                      (st !== 'Offer Issued' &&
                                        st !== 'Accepted' &&
                                        canTransitionPipeline('employer', app.status as any, st as any))
                                  ).map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Private HR Notes */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="Private HR note (e.g. Fanuc test strong)..."
                                  value={
                                    privateNotesMap[app.id] ??
                                    app.employerPrivateNotes ??
                                    ''
                                  }
                                  onChange={(e) =>
                                    setPrivateNotesMap((prev) => ({
                                      ...prev,
                                      [app.id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded"
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                                <div className="flex items-center gap-1.5">
                                  {matchedCandidate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onInspectCertificate(matchedCandidate)
                                      }
                                      className="px-2 py-1 text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded"
                                    >
                                      View Trade Card
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onUpdateApplicationStatus(app.id, 'Interview')
                                    }
                                    className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded flex items-center gap-1"
                                  >
                                    <Calendar className="w-3 h-3" />
                                    Schedule Gate Trial
                                  </button>
                                </div>

                                {matchedCandidate && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenIssueOffer(matchedCandidate)}
                                    className="px-2.5 py-1 text-[11px] font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded"
                                  >
                                    Issue Offer
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LOCKED-PAY OFFERS & SHORTLISTED CANDIDATES */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Issued Locked-Pay Offer Letters ({offers.length})</span>
            </h3>

            {offers.map((offer) => (
              <div
                key={offer.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] tabular-nums text-slate-500 block">
                      Issued on {offer.issuedDate}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">
                      {offer.candidateName}
                    </h4>
                    <div className="text-xs text-slate-600">
                      {offer.candidateTrade} · {offer.plantLocation}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      offer.status === 'Accepted' || offer.status === 'Joined Confirmed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : offer.status === 'Declined'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {offer.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs tabular-nums">
                  <div>
                    <span className="text-slate-500 block">Net In-Hand</span>
                    <span className="font-bold text-emerald-700">
                      ₹{offer.monthlyInHand.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Overtime</span>
                    <span className="font-bold text-slate-900">
                      ₹{offer.overtimeHourlyRate}/hr
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Joining</span>
                    <span className="font-semibold text-blue-700">
                      {offer.joiningDate}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600" />
              <span>Shortlisted Candidates ({shortlistedCandidates.length})</span>
            </h3>

            {shortlistedCandidates.map((cand) => (
              <div
                key={cand.id}
                className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                      {cand.avatarSeed}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {cand.name}
                      </h4>
                      <div className="text-xs text-slate-600">
                        {cand.trade} · {cand.experienceYears} Yrs Exp · {cand.currentCity}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenIssueOffer(cand)}
                    className="px-3 py-1.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                  >
                    Issue Offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: M12 ATOMIC CREDIT LEDGER, RAZORPAY TOP-UP & GST INVOICE */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: 'PACK_10' as const,
                title: 'Starter Shift Pack (10 Credits)',
                credits: 10,
                baseInr: 999,
                gstInr: 180,
                desc: 'Unlock & invite 10 verified ITI / helper candidates.',
              },
              {
                id: 'PACK_25' as const,
                title: 'Plant Growth Pack (25 Credits)',
                credits: 25,
                baseInr: 1999,
                gstInr: 360,
                desc: 'Best for filling a full 25-hand assembly or CNC shift.',
              },
              {
                id: 'PACK_100' as const,
                title: 'Multi-Plant Enterprise (100 Credits)',
                credits: 100,
                baseInr: 5999,
                gstInr: 1080,
                desc: 'Includes priority walk-in drive promotion & GST input credit.',
              },
            ].map((pack) => (
              <div
                key={pack.id}
                className="p-6 bg-white border-2 border-slate-200 hover:border-amber-400 rounded-2xl shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-xs tabular-nums">
                    +{pack.credits} Hunt Credits
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {pack.title}
                  </h4>
                  <p className="text-xs text-slate-600">{pack.desc}</p>
                  <div className="pt-2">
                    <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      ₹{(pack.baseInr + pack.gstInr).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500 block tabular-nums">
                      (₹{pack.baseInr} Base + ₹{pack.gstInr} 18% GST · SAC 998519)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={purchasingPack === pack.id}
                  onClick={async () => {
                    if (!onPurchaseCredits) return;
                    setPurchasingPack(pack.id);
                    try {
                      await onPurchaseCredits(pack.id);
                    } finally {
                      setPurchasingPack(null);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs"
                >
                  {purchasingPack === pack.id
                    ? 'Processing GST Invoice...'
                    : `Top Up +${pack.credits} Credits`}
                </button>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Credit Transaction Ledger & B2B GST Invoices ({creditLedger.length})
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {creditLedger.map((entry) => (
                <div
                  key={entry.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {entry.description}
                    </span>
                    <div className="text-slate-500 tabular-nums">
                      {entry.createdAt}
                      {entry.gstInvoiceNumber && ` · GST Invoice: ${entry.gstInvoiceNumber}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 tabular-nums">
                    <span
                      className={`font-extrabold ${
                        (entry.deltaCredits ?? entry.change) >= 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {(entry.deltaCredits ?? entry.change) >= 0
                        ? `+${entry.deltaCredits ?? entry.change}`
                        : entry.deltaCredits ?? entry.change}{' '}
                      Credits
                    </span>
                    <span className="text-slate-500">
                      Balance: <strong>{entry.balanceAfter}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MULTI-PLANT GSTINs, TEAM ROLES & M2 FACTORY DATA EXPORT/DELETE */}
      {activeTab === 'factory' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveFactoryProfile} className="space-y-6">
            {saveToast && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Factory profile, multi-plant GSTINs, and team roles saved!</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Multi-Plant Locations (Each with State GSTIN) */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Registered Factory Plants & State GSTINs ({plants.length})
                </h3>
                <div className="space-y-3">
                  {plants.map((pl) => (
                    <div
                      key={pl.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">{pl.plantName}</strong>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold tabular-nums">
                          GSTIN: {pl.gstin}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        {pl.industrialCluster} ({pl.state}) · {pl.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-User Team Members (Owner, Recruiter, Viewer) */}
              <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Factory HR Team Members & Role Permissions
                </h3>
                <div className="space-y-2">
                  {teamMembers.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-slate-900">{mem.name}</strong> ·{' '}
                        <span className="tabular-nums text-slate-600">{mem.phone}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                        {mem.role}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <input
                    type="text"
                    placeholder="HR Name"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="+91 Mobile"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg tabular-nums"
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg"
                  >
                    + Add Member
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save Workspace Settings</span>
              </button>
            </div>
          </form>

          {/* Account Data Export & Deletion */}
          <div className="p-6 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                Account Data Export & Workspace Deletion
              </span>
              <p className="text-xs text-slate-600">
                Download a complete archive of your company profile, job postings, and GST credit ledger, or delete your employer workspace.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleExportFactoryData}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-xs hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Factory JSON</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteFactoryAccount}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Factory Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
