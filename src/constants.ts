import type { CareerSettings, SheetDataMap, SimulationSettings } from './types'

export const BIRTH_DATE = new Date(1993, 10, 30) // November 30, 1993

export const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxcPxC8gZUi1A5rLAN81jwf_lBvRu1JRV4AcuwFEFgzhYOlWUMM6XB-ReDrS6f4tMpaLQ/exec'

export const STORAGE_KEY = 'fire_dashboard_user_settings_v1'
export const CAREER_STORAGE_KEY = 'fire_dashboard_career_v4'

export function getCalculatedAge(asOfDate = new Date()): number {
  let age = asOfDate.getFullYear() - BIRTH_DATE.getFullYear()
  const monthDiff = asOfDate.getMonth() - BIRTH_DATE.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && asOfDate.getDate() < BIRTH_DATE.getDate())) {
    age--
  }
  return age
}

export function fmtDollar(v: number): string {
  const rounded = Math.round(v)
  return (rounded < 0 ? '-$' : '$') + Math.abs(rounded).toLocaleString()
}

export function fmtCompact(v: number): string {
  if (Math.abs(v) >= 10000000) {
    return (v < 0 ? '-$' : '$') + (Math.abs(v) / 1000000).toFixed(1) + 'M'
  }
  return fmtDollar(v)
}

export const DEFAULT_SIMULATION_SETTINGS: SimulationSettings = {
  baseSpend: 95000,
  isCurrentSpendPreset: true,
  healthCost: 3840,
  swr: 3.5,
  nominalReturn: 8.5,
  inflationRate: 2.5,
  annualSavings: 106650,
  retireAge: 37,
  chartMaxAge: 100,
  houseOutlay: 0,
  houseAge: 36,
}

export const SAMPLE_SIMULATION_SETTINGS: SimulationSettings = {
  baseSpend: 42500,
  isCurrentSpendPreset: false,
  healthCost: 3840,
  swr: 3.5,
  nominalReturn: 7.0,
  inflationRate: 2.5,
  annualSavings: 8000,
  retireAge: 65,
  chartMaxAge: 100,
  houseOutlay: 0,
  houseAge: 36,
}

export const DEFAULT_CAREER_SETTINGS: CareerSettings = {
  selectedYear: '2027',
  baseSalary: 192376,
  bonus: 19238,
  cashReward: 21875,
  rsuVesting: 45893,
  employerMatch: 8495,
  k401: 24500,
  healthPreTax: 1800,
  hsaPreTax: 4400,
  replaceMode: 'cash',
  severanceWeeks: 10,
  vestingBuffer: 35988,
  stockPrice: 57.01,
  baseInc: 3.0,
  indMod: 100,
  coMod: 100,
  future2027: 0,
  future2028: 0,
  future2029: 0,
  price2027: 57.01,
  price2028: 57.01,
  price2029: 57.01,
}

export const SAMPLE_CAREER_SETTINGS: CareerSettings = {
  ...DEFAULT_CAREER_SETTINGS,
  selectedYear: 'custom',
  baseSalary: 75000,
  bonus: 0,
  cashReward: 0,
  rsuVesting: 0,
  employerMatch: 3750,
  k401: 7500,
  healthPreTax: 1800,
  hsaPreTax: 0,
}

export interface HealthcarePlanGroup {
  group: string
  options: { value: number; label: string; shortBadge: string }[]
}

export const HEALTHCARE_PLANS: HealthcarePlanGroup[] = [
  {
    group: 'Tier 1: Max NJ Subsidies (MAGI $22k – $31k)',
    options: [
      {
        value: 0,
        label: 'Silver CSR 94 ($0 Ded) — $0/mo ($0/yr)',
        shortBadge: '$0/mo Subsidized Silver',
      },
      {
        value: 0,
        label: 'Bronze HDHP (HSA-Eligible) — $0/mo ($0/yr)',
        shortBadge: '$0/mo Bronze HDHP',
      },
      {
        value: 600,
        label: 'Silver CSR 87 (Low Ded) — $50/mo ($600/yr)',
        shortBadge: 'Silver Plan ($50/mo)',
      },
    ],
  },
  {
    group: 'Tier 2: Moderate NJ Subsidies (MAGI $32k – $48k)',
    options: [
      {
        value: 1980,
        label: 'Silver CSR 73 — $165/mo ($1,980/yr)',
        shortBadge: 'Silver Plan ($165/mo)',
      },
      {
        value: 2160,
        label: 'Bronze / HSA-Compatible — $180/mo ($2,160/yr)',
        shortBadge: 'Bronze Plan ($180/mo)',
      },
      {
        value: 2580,
        label: 'Standard Silver — $215/mo ($2,580/yr)',
        shortBadge: 'Silver Plan ($215/mo)',
      },
      {
        value: 3840,
        label: 'Subsidized Gold Plan — $320/mo ($3,840/yr)',
        shortBadge: 'Gold Plan ($320/mo)',
      },
    ],
  },
  {
    group: 'Tier 3: Partial / NJ State Subsidy (MAGI $49k – $62k)',
    options: [
      {
        value: 6240,
        label: 'Partially Subsidized Gold — $520/mo ($6,240/yr)',
        shortBadge: 'Gold Plan ($520/mo)',
      },
    ],
  },
  {
    group: 'Tier 4: Unsubsidized / Full Retail (MAGI > $63k)',
    options: [
      {
        value: 5400,
        label: 'Full-Price Bronze (HSA-Eligible) — $450/mo ($5,400/yr)',
        shortBadge: 'Bronze Plan ($450/mo)',
      },
      {
        value: 7200,
        label: 'Full-Price Silver — $600/mo ($7,200/yr)',
        shortBadge: 'Silver Plan ($600/mo)',
      },
      {
        value: 9360,
        label: 'Full-Price Gold / COBRA — $780/mo ($9,360/yr)',
        shortBadge: 'Gold Plan ($780/mo)',
      },
    ],
  },
]

export const SPEND_PRESETS = [
  { label: 'Current', value: 'current' as const },
  { label: '$65k', value: 65000 },
  { label: '$75k', value: 75000 },
  { label: '$90k', value: 90000 },
  { label: '$100k', value: 100000 },
  { label: '$125k', value: 125000 },
  { label: '$150k', value: 150000 },
  { label: '$200k', value: 200000 },
]

export const RETIRE_AGE_PRESETS = [34, 37, 40, 45, 50, 55, 65]

export const HOUSE_OUTLAY_PRESETS = [
  { label: 'None ($0)', value: 0 },
  { label: '$100k', value: 100000 },
  { label: '$150k', value: 150000 },
  { label: '$200k', value: 200000 },
  { label: '$250k', value: 250000 },
  { label: '$350k', value: 350000 },
]

export const HOUSE_AGE_PRESETS = [35, 36, 37, 38, 40]

export const INCOME_TIERS = [
  { spend: 65000, label: 'Comfortable / Upgraded Lifestyle' },
  { spend: 75000, label: 'Affluent / Travel & House Upgrade' },
  { spend: 90000, label: 'Fat FIRE / High Discretionary Spend' },
  { spend: 100000, label: 'Ultra-Fat FIRE / Complete Abundance' },
  { spend: 125000, label: 'Luxury Fat FIRE / Dual Home & World Travel' },
  { spend: 150000, label: 'High Net Worth Lifestyle / Executive Living' },
  { spend: 200000, label: 'Generational Abundance / Ultimate Freedom' },
]

export const BASE_VESTING_SCHEDULE = [
  { period: 'Mar 2027', year: 2027, cashVest: 6250, sharesVest: 424 },
  { period: 'Jun 2027', year: 2027, cashVest: 6250, sharesVest: 127 },
  { period: 'Sep 2027', year: 2027, cashVest: 6250, sharesVest: 127 },
  { period: 'Dec 2027', year: 2027, cashVest: 3125, sharesVest: 127 },
  { period: 'Mar 2028', year: 2028, cashVest: 3125, sharesVest: 128 },
  { period: 'Jun 2028', year: 2028, cashVest: 3125, sharesVest: 74 },
  { period: 'Sep 2028', year: 2028, cashVest: 3125, sharesVest: 74 },
  { period: 'Dec 2028', year: 2028, cashVest: 3125, sharesVest: 73 },
  { period: 'Mar 2029', year: 2029, cashVest: 3125, sharesVest: 73 },
  { period: 'Jun 2029', year: 2029, cashVest: 0, sharesVest: 0 },
  { period: 'Sep 2029', year: 2029, cashVest: 0, sharesVest: 0 },
  { period: 'Dec 2029', year: 2029, cashVest: 0, sharesVest: 0 },
  { period: 'Mar 2030', year: 2030, cashVest: 0, sharesVest: 0 },
  { period: 'Jun 2030', year: 2030, cashVest: 0, sharesVest: 0 },
  { period: 'Sep 2030', year: 2030, cashVest: 0, sharesVest: 0 },
  { period: 'Dec 2030', year: 2030, cashVest: 0, sharesVest: 0 },
]

export const CAREER_YEAR_DATA: Record<
  '2027' | '2028' | '2029' | '2030',
  {
    label: string
    baseSalary: number
    bonus: number
    cashReward: number
    shares: number
    rsuVesting: number
    employerMatch: number
    k401: number
    healthPreTax: number
    hsaPreTax: number
  }
> = {
  '2027': {
    label: '2027 Total Rewards Projection (805 RSUs + $21,875 Cash Grant)',
    baseSalary: 192376,
    bonus: 19238,
    cashReward: 21875,
    shares: 805,
    rsuVesting: 45893,
    employerMatch: 8495,
    k401: 24500,
    healthPreTax: 1800,
    hsaPreTax: 4400,
  },
  '2028': {
    label: '2028 Total Rewards Projection (349 RSUs + $12,500 Cash Grant)',
    baseSalary: 198147,
    bonus: 19815,
    cashReward: 12500,
    shares: 349,
    rsuVesting: 19896,
    employerMatch: 8718,
    k401: 24500,
    healthPreTax: 1800,
    hsaPreTax: 4400,
  },
  '2029': {
    label: '2029 Total Rewards Projection (73 RSUs + $3,125 Final Cash Grant)',
    baseSalary: 204092,
    bonus: 20409,
    cashReward: 3125,
    shares: 73,
    rsuVesting: 4162,
    employerMatch: 8980,
    k401: 24500,
    healthPreTax: 1800,
    hsaPreTax: 4400,
  },
  '2030': {
    label: '2030 Post-Cliff Projection (Base + 10% AIP Bonus Only)',
    baseSalary: 210215,
    bonus: 21021,
    cashReward: 0,
    shares: 0,
    rsuVesting: 0,
    employerMatch: 9249,
    k401: 24500,
    healthPreTax: 1800,
    hsaPreTax: 4400,
  },
}

export const SAMPLE_HISTORY_SHEETS: SheetDataMap = {
  Income: [
    ['Income', '2022', '2023', '2024', '2025'],
    ['Base salary', '58000', '62000', '68000', '72000'],
    ['Bonus', '0', '1500', '2500', '3000'],
    ['Total', '58000', '63500', '70500', '75000'],
  ],
  Taxes: [
    ['Taxes', '2022', '2023', '2024', '2025'],
    ['Federal income tax', '4300', '4900', '5900', '6500'],
    ['FICA taxes', '4400', '4850', '5350', '5700'],
    ['State income tax', '600', '450', '550', '550'],
    ['Total taxes', '9300', '10200', '11800', '12750'],
  ],
  'Tax returns': [
    ['Tax returns', '2022', '2023', '2024', '2025'],
    ['Federal refund', '350', '450', '300', '550'],
  ],
  'Investment Contributions': [
    ['Investment contributions', '2022', '2023', '2024', '2025'],
    ['401(k)', '3000', '4000', '6000', '7500'],
    ['Roth IRA', '1500', '2000', '2500', '3000'],
    ['Brokerage', '3500', '4000', '5000', '5500'],
    ['Total', '8000', '10000', '13500', '16000'],
  ],
  Living: [
    [
      'Year',
      'Housing',
      'Utilities',
      'Groceries',
      'Transportation',
      'Insurance',
      'Dining & travel',
      'Total',
    ],
    ['2022', '15000', '2400', '4800', '3600', '1800', '5400', '33000'],
    ['2023', '16200', '2500', '5000', '3900', '1900', '6100', '35600'],
    ['2024', '17400', '2700', '5400', '4200', '2000', '6900', '38600'],
    ['2025', '18000', '2900', '5700', '4500', '2100', '7800', '41000'],
  ],
  'Company Match': [
    ['Employer match', '2022', '2023', '2024', '2025'],
    ['Total', '1500', '2000', '3000', '3750'],
  ],
}
