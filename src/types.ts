export type TabId = 'chart' | 'controls' | 'career' | 'strategy' | 'history'

export type CareerSectionFilter = 'all' | 'vesting' | 'taxes'

export type ReplacementMode = 'cash' | 'base' | 'total'

export type CareerPlanYearKey = '2027' | '2028' | '2029' | '2030' | 'custom'

export type HistoryCategoryKey = 'overview' | 'Income' | 'Taxes' | 'Investment Contributions' | 'Living'

export interface SimulationSettings {
  baseSpend: number
  isCurrentSpendPreset: boolean
  healthCost: number
  swr: number // percentage e.g. 3.5
  nominalReturn: number // percentage e.g. 8.5
  inflationRate: number // percentage e.g. 2.5
  annualSavings: number
  retireAge: number
  chartMaxAge: number
  houseOutlay: number
  houseAge: number
}

export interface CareerSettings {
  selectedYear: CareerPlanYearKey
  baseSalary: number
  bonus: number
  cashReward: number
  rsuVesting: number
  employerMatch: number
  k401: number
  healthPreTax: number
  hsaPreTax: number
  replaceMode: ReplacementMode
  severanceWeeks: number
  vestingBuffer: number
  stockPrice: number
  baseInc: number // percentage e.g. 3
  indMod: number // percentage e.g. 100
  coMod: number // percentage e.g. 100
  future2027: number
  future2028: number
  future2029: number
  price2027: number
  price2028: number
  price2029: number
}

export interface MonteCarloQuantile {
  p50Nominal: number
  p50Real: number
  p10Nominal: number
  p10Real: number
  survivalRate: number
}

export interface YearProjection {
  year: number
  age: number
  nominal: number
  real: number
  p50Nominal: number
  p50Real: number
  p10Nominal: number
  p10Real: number
  survivalRate: number
  target: number
  isBaseline: boolean
  isWorking: boolean
  cashFlow: number
  realCashFlow: number
  houseDeduction: number
  growth: number
  netChange: number
}

export interface IncomeTierStatus {
  spend: number
  label: string
  monthly: number
  req4: number
  req35: number
  pct35: number
  gap: number
  isAchieved: boolean
  yearsToReach: number
  estYear: string
}

export interface ProjectionSummary {
  currentAge: number
  totalAnnualSpend: number
  monthlySpend: number
  realReturn: number
  fireTarget: number
  fireTarget4Pct: number
  fireTarget35Pct: number
  fundedStatus: number
  runway: number
  monthlyPassive: number
  monthlySurplus: number
  retireYear: number
  maxAge: number
  maxYear: number
  houseYear: number
  coastFireTarget: number
  isCoastAchieved: boolean
  depletedYear: number | null
  depletedAge: number | null
  allYears: YearProjection[]
  displayedYears: YearProjection[]
  yr2027: YearProjection
  yrRetire: YearProjection
  yrEnd: YearProjection
  recurringPostRetireNetChg: number
  incomeTiers: IncomeTierStatus[]
  planBadge: string
}

export interface VestingScheduleRow {
  period: string
  year: number
  activeCash: number
  futureCash: number
  cashVest: number
  activeShares: number
  futureShares: number
  sharesVest: number
  stockVal: number
  totalVal: number
  remCash: number
  remShares: number
  remStockVal: number
  remTotalVal: number
  hasFuture: boolean
  grantBreakdown: string
}

export interface AnnualVestingSummary {
  year: number
  activeCash: number
  futureCash: number
  cash: number
  activeShares: number
  futureShares: number
  shares: number
  stockVal: number
  total: number
  remTotalVal: number
  remCash: number
  remShares: number
}

export interface MultiYearCompRow {
  year: number
  base: number
  bonusTarget: number
  bonusActual: number
  activeCash: number
  futureCash: number
  cashGrant: number
  totalCash: number
  activeShares: number
  futureShares: number
  shares: number
  stockVal: number
  totalComp: number
  fedTax: number
  ficaTax: number
  njTax: number
  totalTax: number
  netTakeHome: number
  effTaxRate: number
}

export interface TaxBreakdownResult {
  grossComp: number
  cashComp: number
  preTaxTotal: number
  fedTax: number
  ficaTax: number
  njTax: number
  totalTax: number
  netTakeHome: number
  effRate: number
  cashTax: number
  netCashTakeHome: number
  baseTax: number
  netBaseTakeHome: number
  targetNetIncome: number
  targetLabel: string
  targetPreTaxGross: number
  fireCorpusForJob: number
  replacePct: number
  yearsToReplace: number
  sevGross: number
  vestBufGross: number
  uiGross: number
  totalSafetyGross: number
  estSafetyNet: number
  runwayMonths: number
  annualSavingsEst: number
}

export interface SheetDataMap {
  [sheetName: string]: string[][]
}

export interface HistoryRowItem {
  label: string
  section?: string
  valuesByYear: Record<string, number>
  avg: number
  total?: number
  yoyPct: number | null
  isHighlight?: boolean
}

export interface HistorySummaryStats {
  years: string[]
  latestYear: string
  avgGrossIncome: number
  latestGrossIncome: number
  avgTotalTaxes: number
  avgEffTaxRate: number
  avgInvested: number
  avgSavingsRate: number
  avgLivingSpend: number
  latestLivingSpend: number
}
