import React, { useState } from 'react';
import { CONTACT } from '../config/contact';
import {
  X,
  ShieldCheck,
  Lock,
  FileText,
  Trash2,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Volume2,
  VolumeX,
  Send,
  Scale,
  History,
} from 'lucide-react';
import {
  CandidateProfile,
  Language,
  JobApplication,
  OfferLetter,
  DpdpConsentSettings,
  DpdpNominee,
  DpdpGrievanceTicket,
  DpdpAuditLog,
} from '../types';
import { getVoiceGuideScript } from '../data/translations';
import { playJobAudio, stopJobAudio } from '../utils/audioNarrator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  activeWorker?: CandidateProfile;
  applications: JobApplication[];
  offers: OfferLetter[];
  grievances: DpdpGrievanceTicket[];
  auditLogs: DpdpAuditLog[];
  onUpdateConsent: (workerId: string, consent: DpdpConsentSettings) => void;
  onUpdateNominee: (workerId: string, nominee: DpdpNominee) => void;
  onEraseWorkerData: (workerId: string) => void;
  onSubmitGrievance: (ticket: DpdpGrievanceTicket) => Promise<string | undefined> | void;
  onDownloadData: () => void | Promise<void>;
}

export const DpdpComplianceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lang,
  activeWorker,
  applications,
  offers,
  grievances,
  auditLogs,
  onUpdateConsent,
  onUpdateNominee,
  onEraseWorkerData,
  onSubmitGrievance,
  onDownloadData,
}) => {
  const [activeTab, setActiveTab] = useState<
    'consent' | 'access-erasure' | 'nominee' | 'grievance'
  >('consent');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const defaultConsent: DpdpConsentSettings = activeWorker?.dpdpConsent || {
    consentArtifactId: `DPDP-IND-2026-${activeWorker?.id.slice(-4) || '9041'}`,
    policyVersion: 'v2026.11',
    directoryDiscovery: true,
    whatsappJobAlerts: true,
    credentialVerification: true,
    consentGrantedAt: '2026-10-21 (Verified via OTP)',
    noticeLanguage: lang,
    isWithdrawn: false,
  };

  const [directoryDiscovery, setDirectoryDiscovery] = useState(
    defaultConsent.directoryDiscovery
  );
  const [whatsappJobAlerts, setWhatsappJobAlerts] = useState(
    defaultConsent.whatsappJobAlerts
  );
  const [credentialVerification, setCredentialVerification] = useState(
    defaultConsent.credentialVerification
  );
  const [isWithdrawn, setIsWithdrawn] = useState(
    Boolean(defaultConsent.isWithdrawn)
  );
  const [consentSavedToast, setConsentSavedToast] = useState('');

  // Section 14 Nominee State
  const [nomineeName, setNomineeName] = useState(
    activeWorker?.dpdpNominee?.nomineeName || 'Sunita Devi'
  );
  const [relationship, setRelationship] = useState(
    activeWorker?.dpdpNominee?.relationship || 'Spouse / Mother'
  );
  const [nomineePhone, setNomineePhone] = useState(
    activeWorker?.dpdpNominee?.nomineePhone || '+91 95460 99881'
  );
  const [nomineeSavedToast, setNomineeSavedToast] = useState(false);

  // Section 12 Erasure Confirmation
  const [confirmErase, setConfirmErase] = useState(false);
  const [erasedSuccess, setErasedSuccess] = useState(false);

  // Section 13 Grievance Form
  const [grievanceName, setGrievanceName] = useState(
    activeWorker?.name || ''
  );
  const [grievancePhone, setGrievancePhone] = useState(
    activeWorker?.phone || ''
  );
  const [grievanceCategory, setGrievanceCategory] = useState<
    DpdpGrievanceTicket['category']
  >('Unauthorized Data Sharing');
  const [grievanceDesc, setGrievanceDesc] = useState('');
  const [grievanceSubmittedId, setGrievanceSubmittedId] = useState('');

  if (!isOpen) return null;

  const workerApps = activeWorker
    ? applications.filter((a) => a.candidateId === activeWorker.id)
    : [];
  const workerOffers = activeWorker
    ? offers.filter((o) => o.candidateId === activeWorker.id)
    : [];

  const sharedFactories = Array.from(
    new Set([
      ...workerApps.map((a) => `${a.companyName} (${a.industrialHub})`),
      ...workerOffers.map((o) => `${o.companyName} (${o.plantLocation})`),
    ])
  );

  const handleToggleVoice = () => {
    if (isVoicePlaying) {
      stopJobAudio();
      setIsVoicePlaying(false);
    } else {
      const script = getVoiceGuideScript('dpdp-notice', lang);
      setIsVoicePlaying(true);
      playJobAudio(
        'dpdp-voice-notice',
        script,
        lang,
        () => setIsVoicePlaying(true),
        () => setIsVoicePlaying(false),
        () => setIsVoicePlaying(false)
      );
    }
  };

  const handleSaveConsent = (withdrawAll = false) => {
    if (!activeWorker) return;
    const updatedConsent: DpdpConsentSettings = {
      consentArtifactId: defaultConsent.consentArtifactId,
      policyVersion: defaultConsent.policyVersion || 'v2026.11',
      directoryDiscovery: withdrawAll ? false : directoryDiscovery,
      whatsappJobAlerts: withdrawAll ? false : whatsappJobAlerts,
      credentialVerification: withdrawAll ? false : credentialVerification,
      consentGrantedAt: new Date().toLocaleString('en-IN'),
      noticeLanguage: lang,
      isWithdrawn: withdrawAll,
    };

    if (withdrawAll) {
      setDirectoryDiscovery(false);
      setWhatsappJobAlerts(false);
      setCredentialVerification(false);
      setIsWithdrawn(true);
    } else {
      setIsWithdrawn(false);
    }

    onUpdateConsent(activeWorker.id, updatedConsent);
    setConsentSavedToast(
      withdrawAll
        ? 'Consent Withdrawn (Section 6(4)): Your profile is now hidden from all Employers.'
        : 'Granular Consent Artifact updated and logged in DPDP Ledger.'
    );
    setTimeout(() => setConsentSavedToast(''), 4000);
  };

  const handleSaveNominee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorker) return;
    onUpdateNominee(activeWorker.id, {
      nomineeName,
      relationship,
      nomineePhone,
      registeredAt: new Date().toLocaleDateString('en-IN'),
    });
    setNomineeSavedToast(true);
    setTimeout(() => setNomineeSavedToast(false), 3500);
  };

  const handleDownloadDataSummary = () => {
    void onDownloadData();
  };

  const handleConfirmErase = () => {
    if (!activeWorker) return;
    onEraseWorkerData(activeWorker.id);
    setErasedSuccess(true);
  };

  const handleSubmitGrievanceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket = {
      dataPrincipalName: grievanceName || activeWorker?.name || '',
      dataPrincipalPhone: grievancePhone || activeWorker?.phone || '',
      role: 'worker',
      category: grievanceCategory,
      description: grievanceDesc,
    } as DpdpGrievanceTicket;
    const id = await onSubmitGrievance(newTicket);
    if (id) {
      setGrievanceSubmittedId(id);
      setGrievanceDesc('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Digital Personal Data Protection Act, 2023 (India)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                  SECTIONS 5, 6, 11–14 COMPLIANT
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                DPDP Data Principal Rights, Consent Manager & DPO Portal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                isVoicePlaying
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isVoicePlaying ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Audio</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen DPDP Notice</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                stopJobAudio();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 p-1.5 border-b border-slate-200 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('consent')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'consent'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Consent & Notice (Sec 5 & 6)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('access-erasure')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'access-erasure'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Access & Erasure (Sec 11 & 12)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nominee')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'nominee'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>3. Right to Nominate (Sec 14)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grievance')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'grievance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. DPO & Grievance (Sec 13)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: SECTION 5 ITEMIZED NOTICE & SECTION 6 GRANULAR CONSENT */}
          {activeTab === 'consent' && (
            <div className="space-y-6">
              {consentSavedToast && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{consentSavedToast}</span>
                </div>
              )}

              {/* Section 5 Itemized Notice Table */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-emerald-700 font-bold block">
                      Section 5 — Itemized Personal Data Notice (Eighth Schedule Languages Supported)
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      What Personal Data We Collect & Why (Strict Purpose Limitation)
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
                    Artifact ID: <strong>{defaultConsent.consentArtifactId}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">
                      1. Data Elements Collected
                    </div>
                    <p className="text-slate-600">
                      Name, 10-digit Mobile Number, Home City/State, Work Category, Work-Readiness Badges, and optional NCVT Roll Number.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-emerald-800">
                      2. Specified Lawful Purpose
                    </div>
                    <p className="text-slate-600">
                      Direct employment matching with GSTIN-verified factories and issuing direct company-roll digital offer letters.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-red-700">
                      3. Zero Third-Party Sale
                    </div>
                    <p className="text-slate-600">
                      Strictly prohibited from sharing with manpower contractors (<em>thekedars</em>), labor brokers, or spam callers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 6 Granular Consent Manager */}
              <div className="p-5 bg-white border-2 border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Section 6 — Granular Consent Manager ({activeWorker?.name || 'Active Worker'})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Control exactly how your profile is processed, or withdraw consent in 1 tap under Section 6(4).
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isWithdrawn
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isWithdrawn ? 'Consent Withdrawn' : 'Consent Active'}
                  </span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Purpose 1: Verified Factory Talent Directory Discovery
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Allow GSTIN-verified Plant HR Managers to view your trade/helper profile and issue direct job offers.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={directoryDiscovery}
                      onChange={(e) => setDirectoryDiscovery(e.target.checked)}
                      className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Purpose 2: Direct HR Interview Calls & WhatsApp Gate-Pass Alerts
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Allow factories you apply to or receive offers from to contact your mobile number directly.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappJobAlerts}
                      onChange={(e) => setWhatsappJobAlerts(e.target.checked)}
                      className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Purpose 3: Work-Readiness & Optional NCVT Badge Display
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Display your verified stamina badges or NCVT roll number on your Digital Worker Gate-Pass ID.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={credentialVerification}
                      onChange={(e) =>
                        setCredentialVerification(e.target.checked)
                      }
                      className="mt-1 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleSaveConsent(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Withdraw All Consent (Hide My Profile)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveConsent(false)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Save Granular Consent Preferences</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTION 11 RIGHT TO INFORMATION & SECTION 12 RIGHT TO ERASURE */}
          {activeTab === 'access-erasure' && (
            <div className="space-y-6">
              {erasedSuccess ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Personal Data Erased Permanently (Section 12(3))
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your personal profile, job applications, and offer records have been erased from the active database and an immutable erasure receipt has been logged.
                  </p>
                </div>
              ) : (
                <>
                  {/* Section 11: Summary of Personal Data & Shared Fiduciaries */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-blue-700 font-bold block">
                          Section 11 — Right to Access Information About Personal Data
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">
                          Your Personal Data Ledger & Shared Factory List
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={handleDownloadDataSummary}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Portable Data Summary (JSON)</span>
                      </button>
                    </div>

                    {activeWorker && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <div className="font-bold text-slate-800">
                            Stored Personal Data Attributes:
                          </div>
                          <div>
                            <span className="text-slate-500">Full Name:</span>{' '}
                            <strong>{activeWorker.name}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Mobile (OTP):</span>{' '}
                            <strong className="font-mono">{activeWorker.phone}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Work Role:</span>{' '}
                            <strong>{activeWorker.trade}</strong> ({activeWorker.category})
                          </div>
                          <div>
                            <span className="text-slate-500">Origin:</span>{' '}
                            <strong>
                              {activeWorker.currentCity}, {activeWorker.homeState}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                          <div className="font-bold text-slate-800">
                            Factories With Whom Data Has Been Shared ({sharedFactories.length}):
                          </div>
                          {sharedFactories.length === 0 ? (
                            <p className="text-slate-500">
                              Your personal data has not been shared with any external factory yet.
                            </p>
                          ) : (
                            <ul className="space-y-1 text-slate-700">
                              {sharedFactories.map((f) => (
                                <li key={f} className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 12(3): Right to Erasure */}
                  <div className="p-5 bg-red-50/50 border-2 border-red-200 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-red-700 font-bold block">
                          Section 12(3) — Right to Erasure of Personal Data
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">
                          Erase My Personal Profile & Applications ("Right to be Forgotten")
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">
                          Request immediate deletion of your worker profile, mobile number, job applications, and offer letters from Hello Jobs servers.
                        </p>
                      </div>
                    </div>

                    {!confirmErase ? (
                      <button
                        type="button"
                        onClick={() => setConfirmErase(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Erase My Personal Data Permanently</span>
                      </button>
                    ) : (
                      <div className="p-4 bg-white border border-red-300 rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs font-bold text-red-900">
                          Confirm permanent erasure of {activeWorker?.name}'s profile under Section 12(3)?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmErase(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleConfirmErase}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg"
                          >
                            Yes, Erase Permanently
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: SECTION 14 RIGHT TO NOMINATE */}
          {activeTab === 'nominee' && (
            <form onSubmit={handleSaveNominee} className="space-y-5">
              {nomineeSavedToast && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Section 14 Nominee registered! Your designated family nominee is now recorded on your DPDP profile.
                  </span>
                </div>
              )}

              <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-2">
                <span className="text-[11px] font-mono uppercase text-blue-800 font-bold block">
                  Section 14 — Right to Nominate
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Appoint a Family Nominee for Your Digital Personal Data & Wage Records
                </h3>
                <p className="text-xs text-slate-600">
                  Under Section 14 of the DPDP Act 2023, every worker has the right to nominate any other individual who shall, in the event of death or incapacity of the worker, exercise the Data Principal's rights (accessing offer letters, PF/ESI records, or requesting erasure).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominee Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Relationship with Worker *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Spouse, Mother, Father, Brother"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominee Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={nomineePhone}
                    onChange={(e) => setNomineePhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Register Designated DPDP Nominee</span>
              </button>
            </form>
          )}

          {/* TAB 4: SECTION 13 DPO & GRIEVANCE REDRESSAL + AUDIT LOG */}
          {activeTab === 'grievance' && (
            <div className="space-y-6">
              {/* Data Protection Officer Card */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">
                    Data Protection Officer (DPO)
                  </span>
                  <div className="font-bold text-sm mt-0.5">
                    {CONTACT.officerName || 'Details will be published before launch'}
                  </div>
                  <div className="text-slate-300 font-mono mt-0.5">
                    {[CONTACT.email, CONTACT.helpline].filter(Boolean).join(' · ') || 'Use the form below to raise a grievance'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                    Statutory Resolution SLA (Sec 13)
                  </span>
                  <div className="font-bold text-sm mt-0.5">
                    Within 7 Business Days
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    Zero-cost grievance redressal for all workers
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-blue-300 block">
                    Appellate Authority (Sec 13(3))
                  </span>
                  <div className="font-bold text-sm mt-0.5">
                    Data Protection Board of India
                  </div>
                  <div className="text-slate-300 mt-0.5">
                    Escalation available after DPO SLA
                  </div>
                </div>
              </div>

              {grievanceSubmittedId && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-semibold flex items-center justify-between">
                  <span>
                    DPDP Grievance Registered! Ticket ID:{' '}
                    <strong className="font-mono">{grievanceSubmittedId}</strong> (Assigned to DPO)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: File a DPDP Grievance */}
                <form
                  onSubmit={handleSubmitGrievanceForm}
                  className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3"
                >
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Submit Section 13 Privacy Grievance to DPO
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={grievanceName}
                        onChange={(e) => setGrievanceName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={grievancePhone}
                        onChange={(e) => setGrievancePhone(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      DPDP Grievance Category *
                    </label>
                    <select
                      value={grievanceCategory}
                      onChange={(e) =>
                        setGrievanceCategory(e.target.value as any)
                      }
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    >
                      <option value="Unauthorized Data Sharing">
                        Unauthorized Contact / Contractor Misuse of Phone Number
                      </option>
                      <option value="Consent Withdrawal Delay">
                        Consent Withdrawal Not Respected
                      </option>
                      <option value="Data Erasure Request">
                        Immediate Account & Data Erasure Request
                      </option>
                      <option value="Incorrect Personal Data">
                        Correction / Updating of Personal or NCVT Data
                      </option>
                      <option value="Other DPDP Right">
                        Other Data Principal Right Inquiry
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Grievance Details *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Describe the privacy concern or data right you wish to exercise..."
                      value={grievanceDesc}
                      onChange={(e) => setGrievanceDesc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>Register Grievance Ticket with DPO</span>
                  </button>
                </form>

                {/* Right: Live DPDP Audit Ledger */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>Immutable DPDP Consent & Rights Ledger</span>
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      {auditLogs.length} Events
                    </span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] text-emerald-700">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800">
                          {log.principalName}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {log.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
