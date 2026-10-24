import React, { useState } from 'react';
import { X, Calculator, ShieldCheck, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../data/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const TakeHomeCalculatorModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const [grossWage, setGrossWage] = useState(25000);
  const [overtimeHours, setOvertimeHours] = useState(20);
  const [thekedarCutPercent, setThekedarCutPercent] = useState(25);

  if (!isOpen) return null;

  // Overtime rate standard formula: (Gross / (26 * 8)) * 1.5 ~ rough approx ₹120-150/hr
  const otHourlyRate = Math.round((grossWage / 208) * 1.25);
  const totalOtEarnings = overtimeHours * otHourlyRate;
  const totalGrossWithOt = grossWage + totalOtEarnings;

  // Direct Hello Jobs route:
  // Statutory deductions: PF 12% (credited to worker's EPFO account with employer match), ESI 0.75%
  const workerPfDeduction = Math.round(grossWage * 0.12);
  const employerPfMatch = Math.round(grossWage * 0.12); // Employer also adds 12% to worker's PF asset
  const esiDeduction = Math.round(grossWage * 0.0075);
  const directInHand = totalGrossWithOt - workerPfDeduction - esiDeduction;
  const directTotalWealthPerMonth = directInHand + workerPfDeduction + employerPfMatch;

  // Traditional Thekedar route:
  // Thekedar takes cut from the factory bill (25%) and often pays cash without depositing PF
  const thekedarPocketCut = Math.round(totalGrossWithOt * (thekedarCutPercent / 100));
  const thekedarWorkerInHand = totalGrossWithOt - thekedarPocketCut;
  const monthlyExtraInPocket = directInHand - thekedarWorkerInHand;
  const yearlyGain = monthlyExtraInPocket * 12 + employerPfMatch * 12;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
                Fair Pay Transparency Engine
              </div>
              <h2 className="text-base font-bold text-white">
                {t.calculatorTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          <p className="text-xs text-slate-600">
            {t.thekedarCutWarning} On Hello Jobs, 100% of the wage goes directly to the worker with zero recruiter deductions.
          </p>

          {/* Sliders Input Control Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                <span>Monthly Base Factory CTC / Gross:</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  ₹{grossWage.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={16000}
                max={45000}
                step={1000}
                value={grossWage}
                onChange={(e) => setGrossWage(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-0.5">
                <span>₹16,000 (Helper / Trainee)</span>
                <span>₹45,000 (Sr. CNC / Tool & Die)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Monthly Overtime Hours:</span>
                  <span className="font-mono font-bold text-slate-900">{overtimeHours} hrs (₹{totalOtEarnings.toLocaleString('en-IN')})</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Typical Contractor Cut:</span>
                  <span className="font-mono font-bold text-red-600">{thekedarCutPercent}%</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={35}
                  step={5}
                  value={thekedarCutPercent}
                  onChange={(e) => setThekedarCutPercent(Number(e.target.value))}
                  className="w-full accent-red-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thekedar Column */}
            <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Traditional Thekedar System
                </h4>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Factory Bill Amount:</span>
                  <span className="font-mono">₹{totalGrossWithOt.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Thekedar Cut ({thekedarCutPercent}%):</span>
                  <span className="font-mono">- ₹{thekedarPocketCut.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>PF / ESI Deposit:</span>
                  <span className="font-medium text-red-600">Frequently Evaded / Zero</span>
                </div>
              </div>

              <div className="pt-2 border-t border-red-200">
                <span className="text-[11px] text-slate-500 block">Actual Worker In-Hand Cash</span>
                <span className="text-xl font-bold font-mono text-red-700">
                  ₹{thekedarWorkerInHand.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-red-500 block mt-0.5">
                  Delayed cash, no pay slips, no job security.
                </span>
              </div>
            </div>

            {/* Hello Jobs Direct Column */}
            <div className="p-4 bg-emerald-50/50 border-2 border-emerald-300 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Hello Jobs Direct Portal
                </h4>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Gross Pay + Overtime:</span>
                  <span className="font-mono">₹{totalGrossWithOt.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Middleman Commission:</span>
                  <span className="font-mono font-bold">₹0.00 (Zero)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>EPFO Retirement Passbook:</span>
                  <span className="font-mono font-semibold">+ ₹{(workerPfDeduction + employerPfMatch).toLocaleString('en-IN')} / mo</span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200">
                <span className="text-[11px] text-slate-500 block">Guaranteed Bank In-Hand</span>
                <span className="text-xl font-bold font-mono text-emerald-700">
                  ₹{directInHand.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">
                  Direct NEFT on 7th of every month with salary slip.
                </span>
              </div>
            </div>
          </div>

          {/* Yearly Worker Value Summary Callout */}
          <div className="p-4 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs text-amber-400 font-mono font-bold uppercase">
                Annual Fair Pay Difference
              </span>
              <div className="text-base font-bold">
                Extra <span className="text-emerald-400 font-mono">₹{yearlyGain.toLocaleString('en-IN')}</span> / year in your family's hands
              </div>
              <p className="text-[11px] text-slate-400">
                Combines ₹{monthlyExtraInPocket.toLocaleString('en-IN')}/mo extra in-hand plus matching EPFO retirement savings.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded transition-colors whitespace-nowrap shrink-0"
            >
              Start Direct Applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
