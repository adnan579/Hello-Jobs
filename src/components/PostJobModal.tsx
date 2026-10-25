import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Factory, ShieldCheck, Plus } from 'lucide-react';
import {
  JobListing,
  TradeType,
  WorkerSkillCategory,
  EmployerFactoryProfile,
} from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (job: JobListing) => void;
  employer?: EmployerFactoryProfile;
}

const TRADES: TradeType[] = [
  'Packing & Box Loading (No Certificate)',
  'Factory Floor Helper (No Certificate)',
  'Warehouse Loader / Packer',
  'Assembly Line Helper',
  'Machine Helper (Semi-Skilled)',
  'Press Machine Operator',
  'CNC / VMC Operator',
  'Fitter (Assembly & Bench)',
  'Welder (MIG / TIG / ARC)',
  'Machinist (Lathe / Milling)',
  'Industrial Electrician',
  'Wireman',
  'Diesel Mechanic',
  'Quality Inspector',
];

export const PostJobModal: React.FC<Props> = ({ isOpen, onClose, onJobCreated, employer }) => {
  const [title, setTitle] = useState('');
  const [trade, setTrade] = useState<TradeType>(
    'Packing & Box Loading (No Certificate)'
  );
  const [category, setCategory] = useState<WorkerSkillCategory>('unskilled');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [plantLocation, setPlantLocation] = useState('');
  const [industrialHub, setIndustrialHub] = useState('');
  const [state, setState] = useState('');
  const [takeHomeSalary, setTakeHomeSalary] = useState(0);
  const [grossInput, setGrossInput] = useState(0);
  const [overtimeHourlyRate, setOvertimeHourlyRate] = useState(100);
  const [shiftPattern, setShiftPattern] = useState('8 Hours + Overtime Available');
  const [openingsCount, setOpeningsCount] = useState(1);
  const [hrContactName, setHrContactName] = useState('');
  const [hrContactPhone, setHrContactPhone] = useState('');
  const [hasHostel, setHasHostel] = useState(true);
  const [hasSubsidizedMess, setHasSubsidizedMess] = useState(true);
  const [hasBusPickup, setHasBusPickup] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && employer) {
      setCompanyName(employer.companyName);
      setGstin(employer.gstin);
      setIndustrialHub((v) => v || employer.industrialHub);
      setState((v) => v || employer.state);
      setHrContactName((v) => v || employer.hrManagerName);
      setHrContactPhone((v) => v || employer.hrPhone);
      setPlantLocation((v) => v || employer.plantAddress || employer.industrialHub);
    }
  }, [isOpen, employer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const grossSalary = Number(grossInput);
    if (grossSalary < Number(takeHomeSalary)) {
      window.alert('Gross monthly salary cannot be lower than the in-hand salary.');
      return;
    }
    const noCertNeeded = category !== 'skilled';

    const newJob: JobListing = {
      id: `job-${Date.now()}`,
      title:
        title ||
        `Urgent Requirement: ${openingsCount} ${trade}${
          noCertNeeded ? ' (No Certificate Needed)' : ''
        }`,
      trade,
      category,
      noCertificateRequired: noCertNeeded,
      companyName,
      gstin,
      gstinVerified: false, // set by the server from the factory's verification status
      plantLocation,
      industrialHub,
      state,
      takeHomeSalary: Number(takeHomeSalary),
      grossSalary,
      overtimeHourlyRate: Number(overtimeHourlyRate),
      shiftPattern,
      facilities: {
        hasHostel,
        hasSubsidizedMess,
        hasBusPickup,
        esiPfCovered: employer?.facilities?.esiPfCovered ?? false,
        safetyGearProvided: employer?.facilities?.safetyGearProvided ?? false,
      },
      openingsCount: Number(openingsCount),
      vacanciesLeft: Number(openingsCount),
      hrContactName: hrContactName || employer?.hrManagerName || '',
      hrContactPhone: hrContactPhone || employer?.hrPhone || '',
      whatsappApplyNumber: (hrContactPhone || employer?.hrPhone || '').replace(/\D/g, ''),
      experienceRequired:
        category === 'unskilled'
          ? 'Freshers Welcome (No Experience Needed)'
          : '1 to 3 Years',
      minQualification:
        category === 'skilled'
          ? 'NCVT / SCVT ITI Pass'
          : 'No Certificate Needed · Direct Joining',
      postedAt: 'Just now',
      canteenCostPerMeal: hasSubsidizedMess ? '₹20 / meal' : undefined,
      roomRentDeduction: hasHostel ? 'Free Company Hostel' : undefined,
      isActive: true,
    };

    onJobCreated(newJob);
    setIsSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-blue-300">
                Direct Plant Intake
              </div>
              <h2 className="text-base font-bold text-white">
                Post Factory Requirement (Helpers, Packers & ITI)
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Requirement Published Directly to Job Seekers!
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Your opening for {openingsCount} {trade} positions is now live on the Worker Portal with instant vernacular audio narration in Hindi, Marathi, Tamil, and English.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800 transition-colors"
              >
                View Jobs Feed
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Zero Middlemen Guarantee: Candidates reach your HR team directly. No agency recruitment commission is charged to either party.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Manufacturing Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Endurance Technologies Ltd"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Plant GSTIN (for Direct Verification) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 27AABCE1234F1Z2"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Work Role / Trade *
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value as TradeType)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  {TRADES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Skill Category
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as WorkerSkillCategory)
                  }
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                >
                  <option value="unskilled">
                    Unskilled Helper / Packing (No Certificate)
                  </option>
                  <option value="semi-skilled">
                    Semi-Skilled (Floor Line / Helper)
                  </option>
                  <option value="skilled">Skilled (NCVT / SCVT ITI)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Openings Count (Heads) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={openingsCount}
                  onChange={(e) => setOpeningsCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Plant Industrial Hub *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chakan MIDC, Pune"
                  value={industrialHub}
                  onChange={(e) => setIndustrialHub(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Plant Address / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot No 42, Sector 10"
                  value={plantLocation}
                  onChange={(e) => setPlantLocation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Compensation */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                Transparent Compensation
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Net Monthly In-Hand (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={takeHomeSalary || ''}
                    onChange={(e) => setTakeHomeSalary(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-bold font-mono text-emerald-700 border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Gross Monthly Salary (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={grossInput || ''}
                    onChange={(e) => setGrossInput(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-bold font-mono text-slate-800 border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Overtime Pay (₹/hr) *
                  </label>
                  <input
                    type="number"
                    required
                    min={60}
                    step={5}
                    value={overtimeHourlyRate}
                    onChange={(e) => setOvertimeHourlyRate(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Shift Pattern
                  </label>
                  <input
                    type="text"
                    value={shiftPattern}
                    onChange={(e) => setShiftPattern(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Facilities check */}
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasHostel}
                    onChange={(e) => setHasHostel(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Hostel / Dormitory Available</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasSubsidizedMess}
                    onChange={(e) => setHasSubsidizedMess(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Subsidized Canteen / Mess</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBusPickup}
                    onChange={(e) => setHasBusPickup(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span>Company Bus Route</span>
                </label>
              </div>
            </div>

            {/* HR Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  HR Officer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. K. Patil (Factory HR)"
                  value={hrContactName}
                  onChange={(e) => setHrContactName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  HR Direct Contact Phone / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98220 99881"
                  value={hrContactPhone}
                  onChange={(e) => setHrContactPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

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
                <Plus className="w-3.5 h-3.5" />
                Publish Requirement to Worker Feed
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
