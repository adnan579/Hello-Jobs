import React, { useState, useEffect } from 'react';
import { CandidateProfile } from '../types';
import { X, Play, Pause, RotateCcw, CheckCircle2, ShieldCheck, Flame, Wrench } from 'lucide-react';

interface Props {
  candidate: CandidateProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PracticalVideoModal: React.FC<Props> = ({ candidate, isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
  }, [isOpen]);

  // Simulate 30s video progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return prev + 1;
        });
      }, 300); // 300ms * 100 = 30 seconds
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  if (!isOpen || !candidate) return null;

  const currentSeconds = Math.floor((progress / 100) * 30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
              30-Second Practical Video Proof · {candidate.trade}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Screen Area */}
        <div className="relative aspect-video bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Industrial Ambient Grid Background */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Machine Simulation Graphics */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {candidate.trade.includes('Welder') ? (
                  <Flame className="w-10 h-10 animate-pulse text-amber-400" />
                ) : (
                  <Wrench className="w-10 h-10 animate-spin text-amber-400" style={{ animationDuration: '6s' }} />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 bg-emerald-600 text-[10px] font-mono font-bold rounded">
                LIVE DEMO
              </div>
            </div>

            <div>
              <div className="text-base font-bold text-white tracking-tight">
                {candidate.videoDemoTitle || `${candidate.trade} Practical Demonstration`}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Technician: <span className="text-white font-medium">{candidate.name}</span> · {candidate.currentCity}
              </div>
            </div>

            {/* Practical Verification Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Hands-on Shop Floor Demonstration
            </div>
          </div>

          {/* Live HUD Overlay */}
          <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            REC 00:{currentSeconds < 10 ? `0${currentSeconds}` : currentSeconds} / 00:30
          </div>
          <div className="absolute top-3 right-3 text-[11px] font-mono text-emerald-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Safety Gear Confirmed (PPE)
          </div>

          {/* Video Control Bar at bottom of screen */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-6 flex flex-col gap-2">
            {/* Scrubber */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1 text-white hover:text-amber-400 transition-colors"
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setProgress(0);
                    setIsPlaying(true);
                  }}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  aria-label="Replay video"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-slate-400 text-[11px]">
                  00:{currentSeconds < 10 ? `0${currentSeconds}` : currentSeconds} / 00:30
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Machines: {candidate.machinesOperated.slice(0, 2).join(', ')}
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Practical Skills Summary */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Evaluation Criteria:</span>
            <span className="font-semibold text-emerald-400">Practical Grade {candidate.ncvtCertificate.grade} ({candidate.ncvtCertificate.practicalScore}/{candidate.ncvtCertificate.maxPracticalScore})</span>
          </div>
          <div className="text-slate-300">
            {candidate.about}
          </div>
        </div>
      </div>
    </div>
  );
};
