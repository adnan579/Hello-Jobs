import React from 'react';
import { UserRole, Language } from '../types';
import { ShieldCheck } from 'lucide-react';

interface Props {
  currentLang: Language;
  onSelectRole: (role: UserRole) => void;
  onOpenCalculator: () => void;
  onOpenReport: () => void;
  onOpenNcvtSearch: () => void;
  onOpenLegalModal: (tab?: 'privacy' | 'terms') => void;
  onOpenAuthModal: (
    tab: 'worker' | 'employer',
    mode: 'login' | 'register'
  ) => void;
}

export const Footer: React.FC<Props> = ({
  onSelectRole,
  onOpenCalculator,
  onOpenReport,
  onOpenNcvtSearch,
  onOpenLegalModal,
  onOpenAuthModal,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-400 text-slate-950 flex items-center justify-center font-extrabold text-xs">
                HJ
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                Hello Jobs
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              Direct Hands for Indian Industry. Connecting skilled ITI technicians, machine operators, and factory helpers directly with verified manufacturing plants across India.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Free for Workers · Direct Factory Payroll</span>
              </span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              For Workers & Employers
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onSelectRole('worker')}
                  className="hover:text-white transition-colors text-left"
                >
                  Browse Jobs Feed
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuthModal('worker', 'register')}
                  className="hover:text-white transition-colors text-left"
                >
                  Register as Worker
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuthModal('employer', 'register')}
                  className="hover:text-white transition-colors text-left"
                >
                  Register as Employer
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenCalculator}
                  className="hover:text-white transition-colors text-left"
                >
                  Take-Home Salary Calculator
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenNcvtSearch}
                  className="hover:text-white transition-colors text-left"
                >
                  NCVT / ITI Certificate Lookup
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              Legal & Worker Support
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onOpenLegalModal('privacy')}
                  className="text-slate-300 hover:text-white font-semibold transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegalModal('terms')}
                  className="text-slate-300 hover:text-white font-semibold transition-colors text-left"
                >
                  Terms & Conditions of Use
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenReport}
                  className="text-red-400 hover:text-red-300 font-semibold transition-colors text-left"
                >
                  Report Unfair Fee Demand
                </button>
              </li>
              <li>
                <span className="text-slate-400">
                  Grievance Officer: grievance@hellojobs.in
                </span>
              </li>
              <li>
                <span className="text-slate-400 tabular-nums">
                  Helpline: 1800-120-4355 (8 AM–8 PM IST)
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Hello Jobs India. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenLegalModal('privacy')}
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </button>
            <span>·</span>
            <button
              onClick={() => onOpenLegalModal('terms')}
              className="hover:text-slate-300 transition-colors"
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
