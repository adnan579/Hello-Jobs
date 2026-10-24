import React, { useState } from 'react';
import { CandidateProfile, OfferLetter } from '../types';
import { X, FileText, CheckCircle2, ShieldCheck, Building2, Send, Download } from 'lucide-react';

interface Props {
  candidate: CandidateProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onIssueOffer: (offer: OfferLetter) => void;
}

export const DigitalOfferModal: React.FC<Props> = ({
  candidate,
  isOpen,
  onClose,
  onIssueOffer,
}) => {
  if (!isOpen || !candidate) return null;

  const [companyName, setCompanyName] = useState('Apex Industrial Stampings Ltd');
  const [plantLocation, setPlantLocation] = useState('Chakan MIDC Phase 2, Pune');
  const [gstin, setGstin] = useState('27AAACA9921B1Z2');
  const [monthlyInHand, setMonthlyInHand] = useState(candidate.expectedSalary || 24000);
  const [overtimeHourlyRate, setOvertimeHourlyRate] = useState(120);
  const [shiftPattern, setShiftPattern] = useState('8 Hours Rotational (A/B/C)');
  const [accommodationProvided, setAccommodationProvided] = useState(true);
  const [joiningDate, setJoiningDate] = useState('Immediate (Within 7 Days)');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Calculate gross based on standard Indian factory formula (PF 12% + ESI 0.75%)
  const pfDeduction = Math.round(monthlyInHand * 0.12);
  const esiDeduction = Math.round(monthlyInHand * 0.0075);
  const monthlyGross = monthlyInHand + pfDeduction + esiDeduction;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newOffer: OfferLetter = {
      id: `offer-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateTrade: candidate.trade,
      companyName,
      gstin,
      plantLocation,
      monthlyInHand: Number(monthlyInHand),
      monthlyGross,
      overtimeHourlyRate: Number(overtimeHourlyRate),
      joiningDate,
      shiftPattern,
      accommodationProvided,
      esiPfIncluded: true,
      issuedDate: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Issued',
    };

    onIssueOffer(newOffer);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-blue-300">
                Direct Hiring Pipeline
              </div>
              <h2 className="text-base font-bold text-white">
                Issue Direct Digital Offer Letter
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
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
              Digital Offer Issued Directly to {candidate.name}!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              The direct offer letter with guaranteed ₹{monthlyInHand.toLocaleString('en-IN')}/month in-hand wage and zero contractor cuts has been registered. Candidate notified via direct SMS and WhatsApp alert.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-semibold text-slate-800">{candidate.name} ({candidate.trade})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plant Unit:</span>
                <span className="font-semibold text-slate-800">{companyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guaranteed In-Hand:</span>
                <span className="font-bold text-emerald-700">₹{monthlyInHand.toLocaleString('en-IN')} / month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contractor Leakage:</span>
                <span className="font-bold text-slate-700">₹0 (Zero Middleman Cut)</span>
              </div>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
              >
                Return to Talent Directory
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            {/* Candidate Summary Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Selected Candidate</span>
                <h4 className="text-sm font-bold text-slate-900">{candidate.name}</h4>
                <div className="text-xs text-slate-600">{candidate.trade} · {candidate.experienceYears} Years Exp</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Expected Wage</span>
                <span className="text-sm font-bold text-slate-800">₹{candidate.expectedSalary.toLocaleString('en-IN')} / mo</span>
              </div>
            </div>

            {/* Factory Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Factory & Plant Identification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Plant Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Plant Location / Industrial Hub</label>
                  <input
                    type="text"
                    required
                    value={plantLocation}
                    onChange={(e) => setPlantLocation(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Factory GSTIN</label>
                  <input
                    type="text"
                    required
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Shift Arrangement</label>
                  <input
                    type="text"
                    required
                    value={shiftPattern}
                    onChange={(e) => setShiftPattern(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Compensation & Transparency */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Transparent Wage Breakdown (Zero Deductions)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Monthly In-Hand Net Pay (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={15000}
                    step={500}
                    value={monthlyInHand}
                    onChange={(e) => setMonthlyInHand(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-bold font-mono text-emerald-700 border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Direct bank transfer to candidate</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Overtime Hourly Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    step={5}
                    value={overtimeHourlyRate}
                    onChange={(e) => setOvertimeHourlyRate(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Standard double or 1.5x OT formula</span>
                </div>
              </div>

              {/* Statutory Breakdown preview */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded text-xs space-y-1">
                <div className="flex justify-between font-medium text-emerald-950">
                  <span>Estimated Total CTC / Gross Payroll:</span>
                  <span className="font-mono font-bold">₹{monthlyGross.toLocaleString('en-IN')} / mo</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Employer & Employee PF Contribution:</span>
                  <span className="font-mono">₹{pfDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>ESI Medical Insurance:</span>
                  <span className="font-mono">₹{esiDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold border-t border-emerald-200 pt-1">
                  <span>Guaranteed Worker In-Hand (No Thekedar Cut):</span>
                  <span className="font-mono">₹{monthlyInHand.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Accommodation checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acc-check"
                  checked={accommodationProvided}
                  onChange={(e) => setAccommodationProvided(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="acc-check" className="text-xs text-slate-700 font-medium">
                  Provide Company Hostel / Dormitory Accommodation
                </label>
              </div>
            </div>

            {/* Zero Contractor Legal Clause Box */}
            <div className="p-3 bg-slate-100 border border-slate-200 rounded text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 block mb-0.5">Hello Jobs Direct Employment Covenant:</span>
              By issuing this digital offer, the employer certifies that this candidate is onboarded on direct company payroll or transparent fixed-fee contract. No third-party labor thekedar or intermediary is permitted to claim commission or withhold worker wages.
            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Issue Direct Digital Offer Letter
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
