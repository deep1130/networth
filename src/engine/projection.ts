import { getCalculatedAge, HEALTHCARE_PLANS, INCOME_TIERS } from '../constants'
import type {
  IncomeTierStatus,
  MonteCarloQuantile,
  ProjectionSummary,
  SimulationSettings,
  YearProjection,
} from '../types'

// Official Logarithmic NPER Formula for Years to FIRE: t = ln((FV*r + PMT) / (PV*r + PMT)) / ln(1 + r)
export function computeOfficialYearsToFire(
  currentNW: number,
  targetNW: number,
  annualSavings: number,
  rate: number,
): number {
  if (currentNW >= targetNW) return 0
  const pmt = Math.max(0, annualSavings)
  if (rate <= 0.0001) {
    return pmt > 0 ? Math.ceil((targetNW - currentNW) / pmt) : 99
  }
  const num = targetNW * rate + pmt
  const den = currentNW * rate + pmt
  if (den <= 0 || num <= den) return 99
  const exactYears = Math.log(num / den) / Math.log(1 + rate)
  return Math.max(1, Math.ceil(exactYears))
}

// Deterministic 500-Path Monte Carlo Engine (Lognormal Returns + Sequence-of-Returns Risk, sigma = 15%)
export function runMonteCarloQuantiles(
  startNW: number,
  retireYear: number,
  totalAnnualSpend: number,
  annualSavings: number,
  nominalReturn: number,
  inflationRate: number,
  houseOutlay: number,
  houseYear: number,
): MonteCarloQuantile[] {
  const NUM_PATHS = 500
  const YEARS = 66 // 2027 (i=0, Age 34) to 2093 (Age 100, i=66)
  const sigma = 0.15 // 15% historical annual equity portfolio volatility
  const logMean = Math.log(Math.max(0.01, 1 + nominalReturn)) - 0.5 * sigma * sigma

  // Seeded Mulberry32 PRNG for smooth, reproducible quantiles
  let seed = 133742
  const rand = (): number => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const randNormal = (): number => {
    const u1 = Math.max(1e-9, rand())
    const u2 = rand()
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  }

  const initHouseDed = houseYear === 2027 ? houseOutlay : 0
  const initNW = Math.max(0, startNW - initHouseDed)
  const paths = new Float64Array(NUM_PATHS)
  for (let p = 0; p < NUM_PATHS; p++) paths[p] = initNW

  const quantiles: MonteCarloQuantile[] = [
    {
      p50Nominal: initNW,
      p50Real: initNW,
      p10Nominal: initNW,
      p10Real: initNW,
      survivalRate: 100,
    },
  ]

  const sorted = new Float64Array(NUM_PATHS)
  for (let i = 1; i <= YEARS; i++) {
    const year = 2027 + i
    const isWorking = year <= retireYear
    const inflationFactor = Math.pow(1 + inflationRate, i)
    const nominalWithdrawal = totalAnnualSpend * inflationFactor
    const cashFlow = isWorking ? annualSavings : -nominalWithdrawal
    const houseDed = year === houseYear ? houseOutlay : 0

    let aliveCount = 0
    for (let p = 0; p < NUM_PATHS; p++) {
      const z = randNormal()
      const annualRet = Math.exp(logMean + sigma * z) - 1
      const prev = paths[p]
      if (prev <= 0 && !isWorking) {
        paths[p] = 0
      } else {
        const base = Math.max(0, prev + cashFlow / 2 - houseDed)
        const nextVal = Math.max(0, prev + cashFlow - houseDed + base * annualRet)
        paths[p] = nextVal
        if (nextVal > 0) aliveCount++
      }
      sorted[p] = paths[p]
    }
    sorted.sort()
    const p10Nom = sorted[Math.floor(NUM_PATHS * 0.1)]
    const p50Nom = sorted[Math.floor(NUM_PATHS * 0.5)]
    quantiles.push({
      p50Nominal: p50Nom,
      p50Real: p50Nom / inflationFactor,
      p10Nominal: p10Nom,
      p10Real: p10Nom / inflationFactor,
      survivalRate: (aliveCount / NUM_PATHS) * 100,
    })
  }
  return quantiles
}

export function getPlanBadge(healthCost: number): string {
  for (const grp of HEALTHCARE_PLANS) {
    for (const opt of grp.options) {
      if (opt.value === healthCost) return opt.shortBadge
    }
  }
  return 'Healthcare'
}

export function computeProjectionSummary(
  netWorth: number,
  settings: SimulationSettings,
): ProjectionSummary {
  const swrDec = Math.max(0.005, settings.swr / 100)
  const nomRetDec = settings.nominalReturn / 100
  const infDec = settings.inflationRate / 100

  // Exact Fisher Equation Real Return: (1 + nominalReturn) / (1 + inflationRate) - 1
  const realReturn = (1 + nomRetDec) / (1 + infDec) - 1
  const retireYear = 1993 + settings.retireAge
  const maxAge = Math.max(settings.retireAge, settings.chartMaxAge || 100)
  const maxYear = 1993 + maxAge
  const houseYear = 1993 + settings.houseAge
  const currentAge = getCalculatedAge()

  const totalAnnualSpend = settings.baseSpend + settings.healthCost
  const monthlySpend = totalAnnualSpend / 12
  const fireTarget = totalAnnualSpend / swrDec
  const fireTarget4Pct = totalAnnualSpend / 0.04
  const fireTarget35Pct = totalAnnualSpend / 0.035
  const fundedStatus = fireTarget > 0 ? (netWorth / fireTarget) * 100 : 0
  const runway = totalAnnualSpend > 0 ? netWorth / totalAnnualSpend : 0
  const monthlyPassive = (netWorth * swrDec) / 12
  const monthlySurplus = monthlyPassive - monthlySpend

  const yearsUntilRetire = Math.max(0, retireYear - 2027)
  const coastFireTarget = fireTarget / Math.pow(1 + Math.max(0.001, realReturn), yearsUntilRetire)
  const isCoastAchieved = netWorth >= coastFireTarget

  const mcQuantiles = runMonteCarloQuantiles(
    netWorth,
    retireYear,
    totalAnnualSpend,
    settings.annualSavings,
    nomRetDec,
    infDec,
    settings.houseOutlay,
    houseYear,
  )

  const allYears: YearProjection[] = []
  let runningNW = netWorth
  let depletedYear: number | null = null
  let depletedAge: number | null = null

  for (let i = 0; i <= 66; i++) {
    const year = 2027 + i
    const age = year - 1993
    const inflationFactor = Math.pow(1 + infDec, i)
    const mc = mcQuantiles[i] || mcQuantiles[mcQuantiles.length - 1]
    if (i === 0) {
      const initHouseDed = year === houseYear ? settings.houseOutlay : 0
      runningNW = Math.max(0, netWorth - initHouseDed)
      allYears.push({
        year,
        age,
        nominal: runningNW,
        real: runningNW,
        p50Nominal: mc.p50Nominal,
        p50Real: mc.p50Real,
        p10Nominal: mc.p10Nominal,
        p10Real: mc.p10Real,
        survivalRate: mc.survivalRate,
        target: fireTarget,
        isBaseline: true,
        isWorking: year <= retireYear,
        cashFlow: 0,
        realCashFlow: 0,
        houseDeduction: initHouseDed,
        growth: 0,
        netChange: -initHouseDed,
      })
    } else {
      const isWorking = year <= retireYear
      const prevNW = runningNW
      const nominalWithdrawal = totalAnnualSpend * inflationFactor
      const cashFlow = isWorking ? settings.annualSavings : -nominalWithdrawal
      const realCashFlow = isWorking ? settings.annualSavings : -totalAnnualSpend
      const houseDeduction = year === houseYear ? settings.houseOutlay : 0
      const investableBase = Math.max(0, runningNW + cashFlow / 2 - houseDeduction)
      const growth = investableBase * nomRetDec
      runningNW = Math.max(0, runningNW + cashFlow - houseDeduction + growth)
      if (runningNW === 0 && !depletedYear && !isWorking) {
        depletedYear = year
        depletedAge = age
      }
      const realNW = runningNW / inflationFactor
      allYears.push({
        year,
        age,
        nominal: runningNW,
        real: realNW,
        p50Nominal: mc.p50Nominal,
        p50Real: mc.p50Real,
        p10Nominal: mc.p10Nominal,
        p10Real: mc.p10Real,
        survivalRate: mc.survivalRate,
        target: fireTarget,
        isBaseline: false,
        isWorking,
        cashFlow,
        realCashFlow,
        houseDeduction,
        growth,
        netChange: runningNW - prevNW,
      })
    }
  }

  const yr2027 = allYears[0]
  const clampedRetireYear = Math.max(2027, Math.min(2093, retireYear))
  const yrRetire =
    allYears.find((y) => y.year === clampedRetireYear) || allYears[allYears.length - 1]
  const yrEnd = allYears.find((y) => y.age === maxAge) || allYears[allYears.length - 1]

  const postRetireYearsFrom2027 = clampedRetireYear - 2027 + 1
  const postRetireInflation = Math.pow(1 + infDec, postRetireYearsFrom2027)
  const postRetireNominalWithdrawal = totalAnnualSpend * postRetireInflation
  const postRetireGrowth =
    Math.max(0, yrRetire.nominal - postRetireNominalWithdrawal / 2) * nomRetDec
  const recurringPostRetireNetChg =
    Math.max(0, yrRetire.nominal - postRetireNominalWithdrawal + postRetireGrowth) -
    yrRetire.nominal

  const displayedYears = allYears.filter((y) => y.year >= 2027 && y.year <= maxYear)

  const incomeTiers: IncomeTierStatus[] = INCOME_TIERS.map((t) => {
    const req4 = t.spend / 0.04
    const req35 = t.spend / 0.035
    const pct35 = (netWorth / req35) * 100
    const gap = req35 - netWorth
    const isAchieved = netWorth >= req35
    const yearsToReach = computeOfficialYearsToFire(
      netWorth,
      req35,
      settings.annualSavings,
      nomRetDec,
    )
    const estYear = isAchieved
      ? 'CURRENT / ACHIEVED'
      : `${2027 + yearsToReach} (Age ${2027 + yearsToReach - 1993})`
    return {
      spend: t.spend,
      label: t.label,
      monthly: Math.round(t.spend / 12),
      req4,
      req35,
      pct35,
      gap,
      isAchieved,
      yearsToReach,
      estYear,
    }
  })

  return {
    currentAge,
    totalAnnualSpend,
    monthlySpend,
    realReturn,
    fireTarget,
    fireTarget4Pct,
    fireTarget35Pct,
    fundedStatus,
    runway,
    monthlyPassive,
    monthlySurplus,
    retireYear,
    maxAge,
    maxYear,
    houseYear,
    coastFireTarget,
    isCoastAchieved,
    depletedYear,
    depletedAge,
    allYears,
    displayedYears,
    yr2027,
    yrRetire,
    yrEnd,
    recurringPostRetireNetChg,
    incomeTiers,
    planBadge: getPlanBadge(settings.healthCost),
  }
}
