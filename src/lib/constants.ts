// Single source of truth for domain enums + UI labels.
// Mirrors the enums in prisma/schema.prisma (kept as plain constants so the UI
// and validation layer never depend on generated Prisma types).

export const TRADES = [
  "FITTER",
  "TURNER",
  "MACHINIST",
  "WELDER",
  "ELECTRICIAN",
  "CNC_VMC_OPERATOR",
  "WIREMAN",
  "DIESEL_MECHANIC",
  "HELPER",
  "PACKER",
  "LOADER",
  "ASSEMBLY_LINE",
  "OTHER",
] as const;
export type TradeValue = (typeof TRADES)[number];

export const TRADE_LABELS: Record<TradeValue, { en: string; hi: string }> = {
  FITTER: { en: "Fitter", hi: "फिटर" },
  TURNER: { en: "Turner", hi: "टर्नर" },
  MACHINIST: { en: "Machinist", hi: "मशीनिस्ट" },
  WELDER: { en: "Welder", hi: "वेल्डर" },
  ELECTRICIAN: { en: "Electrician", hi: "इलेक्ट्रीशियन" },
  CNC_VMC_OPERATOR: { en: "CNC / VMC Operator", hi: "सीएनसी / वीएमसी ऑपरेटर" },
  WIREMAN: { en: "Wireman", hi: "वायरमैन" },
  DIESEL_MECHANIC: { en: "Diesel Mechanic", hi: "डीज़ल मैकेनिक" },
  HELPER: { en: "Helper", hi: "हेल्पर" },
  PACKER: { en: "Packer", hi: "पैकर" },
  LOADER: { en: "Loader", hi: "लोडर" },
  ASSEMBLY_LINE: { en: "Assembly Line", hi: "असेंबली लाइन" },
  OTHER: { en: "Other", hi: "अन्य" },
};

export const SKILLED_TRADES: TradeValue[] = [
  "FITTER",
  "TURNER",
  "MACHINIST",
  "WELDER",
  "ELECTRICIAN",
  "CNC_VMC_OPERATOR",
  "WIREMAN",
  "DIESEL_MECHANIC",
];

export const CATEGORIES = ["SKILLED", "SEMI_SKILLED"] as const;
export type CategoryValue = (typeof CATEGORIES)[number];
export const CATEGORY_LABELS: Record<CategoryValue, string> = {
  SKILLED: "Skilled (ITI / Diploma)",
  SEMI_SKILLED: "Semi-skilled (Helper, Packer, Loader, Assembly)",
};

export const INTERACTION_SOURCES = ["WORKER_APPLY", "EMPLOYER_HUNT"] as const;
export type InteractionSourceValue = (typeof INTERACTION_SOURCES)[number];

export const STAGES = [
  "INITIATED",
  "SHORTLISTED",
  "OFFERED",
  "JOINED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type StageValue = (typeof STAGES)[number];

export const STAGE_LABELS: Record<StageValue, string> = {
  INITIATED: "New",
  SHORTLISTED: "Shortlisted",
  OFFERED: "Offer sent",
  JOINED: "Joined",
  REJECTED: "Not selected",
  WITHDRAWN: "Withdrawn",
};

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Jharkhand",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const LANGUAGES = [
  { code: "hi", label: "हिन्दी" },
  { code: "en", label: "English" },
  { code: "mr", label: "मराठी" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "ta", label: "தமிழ்" },
] as const;
