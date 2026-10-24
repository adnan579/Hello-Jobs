import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertOctagon, Send } from 'lucide-react';
import { WhistleblowerReport, Language } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { submitReportApi } from '../utils/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  prefilledCompany?: string;
}

export const WhistleblowerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  lang,
  prefilledCompany = '',
}) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [reportedCompany, setReportedCompany] = useState(prefilledCompany);
  const [thekedarName, setThekedarName] = useState('');
  const [issueType, setIssueType] = useState<WhistleblowerReport['issueType']>('Fee Demanded');
  const [details, setDetails] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const report: WhistleblowerReport = {
      id: `rep-${Date.now()}`,
      reportedCompany: reportedCompany || 'Unspecified Factory',
      thekedarName: thekedarName || 'Unknown Contractor',
      issueType,
      details,
      reporterPhone,
      timestamp: new Date().toISOString(),
    };

    await submitReportApi(report);

    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-500/20 border border-red-400/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-red-400">
                Anti-Exploitation Hotline
              </div>
              <h2 className="text-base font-bold text-white">
                {t.reportModalTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-red-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Complaint Registered Confidentially
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you for keeping Indian manufacturing clean. Our Labor Compliance & Factory Audit team will review this notice within 24 hours. Factories violating direct-pay rules are de-listed immediately.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>
                <strong>100% Free Policy:</strong> No recruiter, HR, or thekedar on Hello Jobs is allowed to ask for registration fees, uniform charges, or salary percentage.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Violation Type *
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600"
              >
                <option value="Fee Demanded">Recruiter Demanded Joining / Registration Fee</option>
                <option value="Wage Cut Withheld">Thekedar Deducting Monthly Wage Commission</option>
                <option value="PF Not Deposited">Factory/Agency Not Depositing PF or ESI</option>
                <option value="Passbook Confiscated">Bank Passbook / Original Certificate Withheld</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Factory / Plant Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Noida Sector 63 Auto Unit"
                  value={reportedCompany}
                  onChange={(e) => setReportedCompany(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Thekedar / Agency Person Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sharma Manpower Services"
                  value={thekedarName}
                  onChange={(e) => setThekedarName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Your Mobile Number (Kept Confidential) *
              </label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Describe What Happened *
              </label>
              <textarea
                required
                rows={3}
                placeholder="State how much money was asked, date, or what threat was made..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Anonymous Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
