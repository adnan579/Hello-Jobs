import React, { useState } from 'react';
import { X, Search, ShieldCheck, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { CandidateProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateProfile[];
  onSelectCandidate: (candidate: CandidateProfile) => void;
}

export const NcvtSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  candidates,
  onSelectCandidate,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const verifiedCandidates = candidates.filter((c) => c.ncvtCertificate.isVerified);
  const matching = verifiedCandidates.filter(
    (c) =>
      query === '' ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.ncvtCertificate.rollNumber.includes(query) ||
      c.ncvtCertificate.certificateNumber.toLowerCase().includes(query.toLowerCase()) ||
      c.trade.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
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
                Workers with a checked ITI certificate
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

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter NCVT MIS Roll Number (e.g. 210809028114) or Candidate Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-2">
            <span>Lists workers whose ITI certificate Hello Jobs staff have checked. This is not a live government registry lookup.</span>
          </div>
        </div>

        {/* Results List */}
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Verified NCVT Records ({matching.length})
          </div>

          <div className="space-y-2">
            {matching.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => {
                  onSelectCandidate(candidate);
                }}
                className="p-4 border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 rounded-lg transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{candidate.name}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      Grade {candidate.ncvtCertificate.grade} Verified
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{candidate.trade}</span> · MIS Roll:{' '}
                    <span className="font-mono font-bold text-slate-900">
                      {candidate.ncvtCertificate.rollNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {candidate.ncvtCertificate.itiCollege} (Batch {candidate.ncvtCertificate.passingYear})
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 group-hover:text-amber-800 shrink-0">
                  <span>View Full Certificate</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
