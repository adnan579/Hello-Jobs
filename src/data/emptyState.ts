import type { EmployerFactoryProfile } from '../types';

/** Placeholder used when the signed-in person is not a factory. Never shown as real data. */
export const EMPTY_EMPLOYER: EmployerFactoryProfile = {
  id: '',
  companyName: '',
  gstin: '',
  udyamNumber: '',
  factoryLicenseNumber: '',
  hrManagerName: '',
  hrEmail: '',
  hrPhone: '',
  plantAddress: '',
  industrialHub: '',
  state: '',
  totalWorkforceCount: 0,
  establishedYear: new Date().getFullYear(),
  industrySector: '',
  facilities: {
    hasHostel: false,
    hasSubsidizedMess: false,
    hasBusPickup: false,
    esiPfCovered: false,
    safetyGearProvided: false,
    canteenRate: '',
    hostelDetails: '',
  },
  factoryShowcase: [],
  huntCredits: 0,
  unlockedCandidateIds: [],
  teamMembers: [],
  plants: [],
  kybVerificationStatus: 'PENDING',
};
