import type { TradeType, WorkerSkillCategory, PipelineStage } from '../../src/types/index.ts';

export const TRADES = [
  'Packing & Box Loading (No Certificate)',
  'Factory Floor Helper (No Certificate)',
  'Warehouse Loader / Packer',
  'Assembly Line Helper',
  'Machine Helper (Semi-Skilled)',
  'CNC / VMC Operator',
  'Fitter (Assembly & Bench)',
  'Welder (MIG / TIG / ARC)',
  'Machinist (Lathe / Milling)',
  'Industrial Electrician',
  'Wireman',
  'Diesel Mechanic',
  'Press Machine Operator',
  'Quality Inspector',
] as const satisfies readonly TradeType[];

export const CATEGORIES = ['unskilled', 'semi-skilled', 'skilled'] as const satisfies readonly WorkerSkillCategory[];

export const STAGES = [
  'Applied',
  'Shortlisted',
  'Interview',
  'Offer Issued',
  'Accepted',
  'Joined',
  'Declined',
  'Rejected',
  'Withdrawn',
  'No-show',
] as const satisfies readonly PipelineStage[];

export const POLICY_VERSION = 'v2026.11';

import type { TradeType as _T, WorkerSkillCategory as _C } from '../../src/types/index.ts';
export const TRADE_CATEGORY: Record<_T, _C> = {
  'Packing & Box Loading (No Certificate)': 'unskilled',
  'Factory Floor Helper (No Certificate)': 'unskilled',
  'Warehouse Loader / Packer': 'semi-skilled',
  'Assembly Line Helper': 'semi-skilled',
  'Machine Helper (Semi-Skilled)': 'semi-skilled',
  'CNC / VMC Operator': 'skilled',
  'Fitter (Assembly & Bench)': 'skilled',
  'Welder (MIG / TIG / ARC)': 'skilled',
  'Machinist (Lathe / Milling)': 'skilled',
  'Industrial Electrician': 'skilled',
  Wireman: 'skilled',
  'Diesel Mechanic': 'skilled',
  'Press Machine Operator': 'skilled',
  'Quality Inspector': 'skilled',
};
