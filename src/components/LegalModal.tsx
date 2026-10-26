import React, { useState, useEffect } from 'react';
import { CONTACT } from '../config/contact';
import {
  X,
  ShieldCheck,
  Scale,
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  Mail,
  Phone,
} from 'lucide-react';
import { CandidateProfile, EmployerFactoryProfile, AuthSession } from '../types';

interface Props {
  isOpen: boolean;
  initialTab?: 'privacy' | 'terms';
  onClose: () => void;
  authSession?: AuthSession | null;
  activeWorker?: CandidateProfile;
  employerProfile?: EmployerFactoryProfile;
  onExportWorkerData?: () => void;
  onDeleteWorkerAccount?: () => void;
}

export const LegalModal: React.FC<Props> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
  authSession,
  activeWorker,
  onExportWorkerData,
  onDeleteWorkerAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setConfirmDelete(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Legal, Privacy Policy & Terms of Use
              </h2>
              <p className="text-xs text-slate-400">
                Hello Jobs India · Direct Industrial Workforce Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-amber-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Privacy Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-amber-600 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Terms & Conditions of Use</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'privacy' ? (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Privacy Policy
                </div>
                <div className="text-slate-500 text-[11px]">
                  Effective Date: October 2026 · Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology Act, 2000.
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  1. Information We Collect & Purpose Limitation
                </h3>
                <p>
                  Hello Jobs collects only the minimum personal information necessary to connect industrial workers directly with verified manufacturing employers:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Workers (Data Principals):</strong> Full name, 10-digit mobile number (verified via OTP), current city/home state, trade skills, machines operated, work experience, expected salary range, and optional ITI/NCVT roll number or 30-second practical skill video.
                  </li>
                  <li>
                    <strong>Employers:</strong> Company name, factory GSTIN, Udyam registration, plant address, and authorized HR manager contact details.
                  </li>
                  <li>
                    <strong>Data Minimization:</strong> We do <strong>not</strong> collect Aadhaar numbers, biometric data, bank account passwords, or caste/religion details.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  2. How Your Data Is Protected & Shared
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Phone Number Masking:</strong> A worker’s phone number is masked in the Employer Candidate Directory (e.g., <span className="tabular-nums">+91 98•••••210</span>) and on public Trade Cards. Your full phone number is shared with an employer only when you directly apply to their job posting or when a verified employer unlocks your profile to invite you for an interview.
                  </li>
                  <li>
                    <strong>Zero Third-Party Sale:</strong> Personal data is never sold or rented to middlemen, labor contractors (thekedars), or unauthorized third-party marketing agencies.
                  </li>
                  <li>
                    <strong>Communication Quiet Hours:</strong> Non-essential job alerts and interview reminders via SMS or WhatsApp respect Indian Standard Time (IST) quiet hours between 9:00 PM and 8:00 AM.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  3. Your Rights Under the DPDP Act, 2023
                </h3>
                <p>
                  As a user on Hello Jobs, you have the following statutory rights regarding your personal data:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Right to Access & Summary:</strong> You can view and download a complete copy of your profile, applications, and offer letters at any time from your Profile Settings.
                  </li>
                  <li>
                    <strong>Right to Correction & Updating:</strong> You can update your name, trade skills, city, expected pay, and work history directly from your Profile page.
                  </li>
                  <li>
                    <strong>Right to Withdraw Consent & Erasure:</strong> You may hide your profile from the Employer Directory or permanently delete your account and personal data at any time, unless retention is required by applicable Indian law.
                  </li>
                  <li>
                    <strong>Right to Nominate:</strong> You may nominate an individual in your Profile Settings to exercise your data rights in the event of death or incapacity.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  4. Data Protection & Grievance Officer
                </h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900">
                    {CONTACT.officerName || 'Grievance & Data Protection Officer: details will be published before launch'}
                  </div>
                  {CONTACT.companyAddress && <div className="text-slate-600">{CONTACT.companyAddress}</div>}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-slate-700 font-medium">
                    {CONTACT.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        {CONTACT.email}
                      </span>
                    )}
                    {CONTACT.helpline && (
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {CONTACT.helpline}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">You can always raise a grievance inside the app under Privacy & Account Settings.</p>
                </div>
              </section>

              {/* Quiet, Self-Serve Data Controls if Logged In as Worker */}
              {authSession?.role === 'worker' && activeWorker && (
                <section className="p-4 bg-slate-100 border border-slate-200 rounded-xl space-y-3">
                  <div className="font-bold text-slate-900">
                    Manage Your Personal Data ({activeWorker.name})
                  </div>
                  <p className="text-[11px] text-slate-600">
                    You can export a copy of your account data or permanently delete your profile from Hello Jobs at any time.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {onExportWorkerData && (
                      <button
                        type="button"
                        onClick={onExportWorkerData}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download My Data</span>
                      </button>
                    )}
                    {onDeleteWorkerAccount && !confirmDelete && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 font-semibold hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete My Account</span>
                      </button>
                    )}
                    {onDeleteWorkerAccount && confirmDelete && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteWorkerAccount();
                            onClose();
                          }}
                          className="px-3.5 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700"
                        >
                          Confirm Permanent Deletion
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-600 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  Terms & Conditions of Use
                </div>
                <div className="text-slate-500 text-[11px]">
                  Governing the use of Hello Jobs by Industrial Job Seekers and Verified Manufacturing Employers.
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  1. Eligibility & Age Requirement (18+ Years)
                </h3>
                <p>
                  In accordance with the Factories Act, 1948 and the Occupational Safety, Health and Working Conditions Code, 2020, all workers registering on Hello Jobs must be at least <strong>18 years of age</strong>. By creating an account, you confirm that you meet this statutory age requirement.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  2. Strictly Zero Recruitment Fee Policy for Workers
                </h3>
                <p>
                  Hello Jobs is 100% free for workers. No employer, HR representative, or agent using this platform is permitted to charge any registration fee, gate-pass fee, security deposit, medical/uniform advance, or salary commission from any candidate. Any employer found demanding fees from workers will have their account immediately suspended.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  3. Employer Verification & Fair Pay Commitments
                </h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Authentic Job Listings:</strong> Employers must hold a valid GSTIN or Udyam Registration and provide accurate monthly in-hand take-home salary, overtime rates, shift timings, and hostel/mess details.
                  </li>
                  <li>
                    <strong>Offer Integrity:</strong> Digital offer letters issued through Hello Jobs must honor the advertised monthly in-hand salary and statutory PF/ESIC provisions under Indian labour codes.
                  </li>
                  <li>
                    <strong>Authorized Use of Candidate Data:</strong> Employers agree to use unlocked worker contact details solely for genuine recruitment at their registered manufacturing plants and never to forward candidate data to third parties.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  4. Accuracy of Worker Profiles & Credentials
                </h3>
                <p>
                  Workers agree to provide truthful information regarding their identity, work experience, machines operated, and optional NCVT/SCVT ITI certificates. Note that the shareable Hello Jobs Trade Card is a skill profile summary for recruitment purposes and is not a government-issued identity document.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">
                  5. Governing Law & Dispute Resolution
                </h3>
                <p>
                  These Terms & Conditions are governed by the laws of the Republic of India, including the Digital Personal Data Protection Act, 2023, the Information Technology Act, 2000, and applicable Indian Labour Codes. Any disputes or grievances may be reported to our Grievance Officer or via the in-app Report Fee Demand tool.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Protected under Indian Labour & Data Privacy Laws</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
