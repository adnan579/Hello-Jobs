import React from 'react';
import { NcvtCertificate } from '../types';
import { X, CheckCircle2, ShieldCheck, Award, QrCode, Printer } from 'lucide-react';

interface Props {
  candidateName: string;
  certificate: NcvtCertificate;
  isOpen: boolean;
  onClose: () => void;
}

export const NcvtCertificateModal: React.FC<Props> = ({
  candidateName,
  certificate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const totalScore = certificate.practicalScore + certificate.theoryScore;
  const maxTotalScore = certificate.maxPracticalScore + certificate.maxTheoryScore;
  const percentage = maxTotalScore > 0 ? Math.round((totalScore / maxTotalScore) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-amber-400">
                Hello Jobs Credential Check
              </div>
              <h2 className="text-base font-bold text-white">
                ITI National Trade Certificate
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

        {/* Certificate Body Container */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Authentic Certificate Parchment Card */}
          <div className="p-6 bg-amber-50/40 border-2 border-amber-200 rounded-lg relative space-y-5">
            {/* National Emblem & Watermark Header */}
            <div className="text-center pb-4 border-b border-amber-200/80">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/70 border border-amber-300 rounded text-xs font-semibold text-amber-900 mb-2">
                <Award className="w-4 h-4 text-amber-700" />
                Details entered by the worker · checked by Hello Jobs staff
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                NATIONAL TRADE CERTIFICATE (NTC)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Conferred under the auspices of the National Council for Vocational Training (NCVT)
              </p>
            </div>

            {/* Verification Key Metric Badge Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white border border-amber-200/70 rounded-md text-xs">
              <div>
                <span className="text-slate-500 block">Certificate No.</span>
                <span className="font-mono font-bold text-slate-900 break-all">
                  {certificate.certificateNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">MIS Roll No.</span>
                <span className="font-mono font-bold text-slate-900">
                  {certificate.rollNumber || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Passing Year</span>
                <span className="font-bold text-slate-900">{certificate.passingYear}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Overall Grade</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  Grade {certificate.grade} ({percentage}%)
                </span>
              </div>
            </div>

            {/* Candidate & ITI Details */}
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 block">Certified Candidate Name</span>
                  <span className="font-bold text-slate-900 text-base">{candidateName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Designated Industrial Trade</span>
                  <span className="font-bold text-slate-900">{certificate.tradeName}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Recognized ITI Institution</span>
                <span className="font-medium text-slate-800">{certificate.itiCollege}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">State Technical Directorate</span>
                <span className="text-slate-700">{certificate.stateDirectorate}</span>
              </div>
            </div>

            {/* Practical & Theory Score Matrix */}
            <div className="border border-slate-200 rounded-md overflow-hidden bg-white text-xs">
              <div className="grid grid-cols-3 bg-slate-100 p-2 font-semibold text-slate-700 border-b border-slate-200">
                <span>Evaluation Module</span>
                <span className="text-right">Marks Obtained</span>
                <span className="text-right">Max Marks</span>
              </div>
              <div className="grid grid-cols-3 p-2.5 border-b border-slate-100 text-slate-800">
                <span className="font-medium">Trade Practical (Machine & Tool Floor Test)</span>
                <span className="text-right font-mono font-bold text-emerald-700">
                  {certificate.practicalScore}
                </span>
                <span className="text-right font-mono text-slate-500">
                  {certificate.maxPracticalScore}
                </span>
              </div>
              <div className="grid grid-cols-3 p-2.5 border-b border-slate-100 text-slate-800">
                <span className="font-medium">Trade Theory & Engineering Drawing</span>
                <span className="text-right font-mono font-bold text-slate-900">
                  {certificate.theoryScore}
                </span>
                <span className="text-right font-mono text-slate-500">
                  {certificate.maxTheoryScore}
                </span>
              </div>
              <div className="grid grid-cols-3 p-2.5 bg-slate-50 font-semibold text-slate-900">
                <span>Total Score</span>
                <span className="text-right font-mono text-emerald-700">{totalScore}</span>
                <span className="text-right font-mono text-slate-600">{maxTotalScore}</span>
              </div>
            </div>

            {/* Verification Footer Stamp */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-amber-200/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white border border-slate-300 rounded shadow-xs">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
                <div className="text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Checked by Hello Jobs staff
                  </div>
                  <div className="text-slate-500">Validation Date: {certificate.verifiedDate}</div>
                </div>
              </div>

              <div className="text-center sm:text-right text-xs text-slate-500">
                <div className="font-mono text-slate-700 font-semibold">Hello Jobs Check</div>
                <div className="text-[11px] text-slate-400">Direct hiring, no middleman</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Certified document issued under Craftsmen Training Scheme (CTS).
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Verification Card
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
