/**
 * Example listings for the About page. They are NOT jobs: no id in the database, no contact,
 * no apply path. The factories are fictional and say so on screen. Keep them out of every
 * list that a worker can apply from.
 */
export type Perk = 'hostel' | 'mess' | 'bus' | 'pf-esi';

export interface SampleListing {
  id: string;
  title: string;
  /** Made-up factory name. Never use a real company name here. */
  factory: string;
  industrialHub: string;
  state: string;
  inHandPerMonth: number;
  overtimePerHour: number;
  shift: string;
  qualification: string;
  openings: number;
  perks: Perk[];
}

export const SAMPLE_LISTINGS: SampleListing[] = [
  {
    id: 'sample-fitter',
    title: 'Fitter, assembly line',
    factory: 'Example Auto Components',
    industrialHub: 'Chakan MIDC, Pune',
    state: 'Maharashtra',
    inHandPerMonth: 21500,
    overtimePerHour: 110,
    shift: '8 hours, 2 shifts',
    qualification: 'ITI Fitter',
    openings: 12,
    perks: ['hostel', 'pf-esi'],
  },
  {
    id: 'sample-cnc',
    title: 'CNC operator',
    factory: 'Example Precision Works',
    industrialHub: 'Coimbatore',
    state: 'Tamil Nadu',
    inHandPerMonth: 24000,
    overtimePerHour: 130,
    shift: '8 hours, general shift',
    qualification: 'ITI Machinist or diploma',
    openings: 6,
    perks: ['bus', 'pf-esi'],
  },
  {
    id: 'sample-helper',
    title: 'Packing helper',
    factory: 'Example Packaging Unit',
    industrialHub: 'Sector 63, Noida',
    state: 'Uttar Pradesh',
    inHandPerMonth: 15500,
    overtimePerHour: 80,
    shift: '8 hours, 2 shifts',
    qualification: 'No certificate needed',
    openings: 25,
    perks: ['mess', 'pf-esi'],
  },
];
