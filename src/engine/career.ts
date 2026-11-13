import type { CareerSettings, SimulationSettings } from '../types'
import { computeOfficialYearsToFire } from './projection'

export interface DynamicVestingQuarterRow {
  date: string
  year: number
  cash: number
  shares: number
  stockVal: number
  dayTotal: number
  remainingVal: number
  note: string
}

export interface MultiYearColumnData {
  year: 2027 | 2028 | 2029 | 2030
  base: number
  bonus: number
  activeCash: number
  futureCash: number
  cashReward: number
  trueCash: number
  activeShares: number
  futureShares: number
  totalShares: number
  activeEq: number
  futureEq: number
  totEq: number
  trueComp: number
  cashStatus: string
  cashNext: string
}

export interface TaxTableRow {
  name: string
  annual: number
  monthly: number
  pctStr: string
  notes: string
  isDeduction?: boolean
  highlight?: 'blue' | 'red' | 'green' | 'cyan'
}

export interface ComputedCareerReport {
  multiYearByYear: Record<2027 | 2028 | 2029 | 2030, MultiYearColumnData>
  multiYearList: MultiYearColumnData[]
  vestingRows: DynamicVestingQuarterRow[]
  totalCashVal: number
  totalShares: number
  totalStockVal: number
  totalCombined: number
  nextDayVal: number
  annualVestingByYear: Record<
    2027 | 2028 | 2029 | 2030,
    { cash: number; stock: number; shares: number; total: number }
  >
  simAwardSplit: {
    cashPortion: number
    stockPortion: number
    totalShares: number
    vest2028Total: number
    vest2028Cash: number
    vest2028Stock: number
    vest2029Total: number
    vest2029From27: number
    vest2029From28: number
    vest2030Total: number
    vest2030From27: number
    vest2030From28: number
    vest2030From29: number
  }
  activeBaseSalary: number
  activeBonus: number
  activeCashReward: number
  activeRsuVesting: number
  activeYrShares: number
  activeMatch: number
  activeK401: number
  activeHealth: number
  activeHsa: number
  earnedGross: number
  preTaxDeductions: number
  fedTaxable: number
  fedTax: number
  ssTax: number
  medBaseTax: number
  medSurtax: number
  totalFica: number
  njTaxable: number
  njTax: number
  totalTaxes: number
  netTakeHomeAnnual: number
  monthlyTakeHome: number
  biWeeklyTakeHome: number
  effectiveTaxRate: number
  totalWealthRetained: number
  bridgeDesc: string
  bridgeTargetAnnual: number
  monthlyJobTakeHome: number
  monthlyPassive: number
  replacePct: number
  monthlyGap: number
  timelineText: string
  severancePay: number
  njUiTotal: number
  grossSafety: number
  netSafety: number
  monthlySpendForSafety: number
  runwayMonths: number
  taxRows: TaxTableRow[]
}

export function getFutureGrantShares(grantAmount: number, grantPrice: number): number {
  const safeGrantPrice = Math.max(0.01, grantPrice || 57.01)
  return Math.round((Math.max(0, grantAmount || 0) * 0.5) / safeGrantPrice)
}

export function computeFedTax(taxable: number): number {
  if (taxable <= 0) return 0
  if (taxable > 638875) return 192544 + (taxable - 638875) * 0.37
  if (taxable > 255525) return 58371.5 + (taxable - 255525) * 0.35
  if (taxable > 201250) return 41003.5 + (taxable - 201250) * 0.32
  if (taxable > 105425) return 18005.5 + (taxable - 105425) * 0.24
  if (taxable > 49450) return 5691 + (taxable - 49450) * 0.22
  if (taxable > 12150) return 1215 + (taxable - 12150) * 0.12
  return taxable * 0.1
}

export function computeFica(wageBase: number): {
  ssTax: number
  medBaseTax: number
  medSurtax: number
  totalFica: number
} {
  if (wageBase <= 0) return { ssTax: 0, medBaseTax: 0, medSurtax: 0, totalFica: 0 }
  const ssTax = Math.min(wageBase, 181800) * 0.062
  const medBaseTax = wageBase * 0.0145
  const medSurtax = wageBase > 200000 ? (wageBase - 200000) * 0.009 : 0
  return { ssTax, medBaseTax, medSurtax, totalFica: ssTax + medBaseTax + medSurtax }
}

export function computeNjTax(njTaxable: number): number {
  if (njTaxable <= 0) return 0
  if (njTaxable > 1000000) return 74700 + (njTaxable - 1000000) * 0.1075
  if (njTaxable > 500000) return 29850 + (njTaxable - 500000) * 0.0897
  if (njTaxable > 75000) return 2777.5 + (njTaxable - 75000) * 0.0637
  if (njTaxable > 40000) return 843.75 + (njTaxable - 40000) * 0.05525
  if (njTaxable > 35000) return 542.5 + (njTaxable - 35000) * 0.035
  if (njTaxable > 20000) return 280 + (njTaxable - 20000) * 0.0175
  return njTaxable * 0.014
}

export function getDynamicVestingSchedule(
  stockPrice: number,
  future2027 = 0,
  future2028 = 0,
  future2029 = 0,
  grantPrices: { 2027: number; 2028: number; 2029: number } = {
    2027: 57.01,
    2028: 57.01,
    2029: 57.01,
  },
): DynamicVestingQuarterRow[] {
  const safePrice = stockPrice > 0 ? stockPrice : 57.01
  const f27 = Math.max(0, future2027 || 0)
  const f28 = Math.max(0, future2028 || 0)
  const f29 = Math.max(0, future2029 || 0)
  const grantShares27 = getFutureGrantShares(f27, grantPrices[2027])
  const grantShares28 = getFutureGrantShares(f28, grantPrices[2028])
  const grantShares29 = getFutureGrantShares(f29, grantPrices[2029])

  const baseQuarters = [
    {
      date: 'March 1, 2027',
      year: 2027,
      q: 1,
      activeCash: 12500,
      activeShares: 412,
      baseNote: 'Major 1/3 Cliff + AIP Performance Shares',
    },
    {
      date: 'June 1, 2027',
      year: 2027,
      q: 2,
      activeCash: 3125,
      activeShares: 131,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'September 1, 2027',
      year: 2027,
      q: 3,
      activeCash: 3125,
      activeShares: 131,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'December 1, 2027',
      year: 2027,
      q: 4,
      activeCash: 3125,
      activeShares: 131,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'March 1, 2028',
      year: 2028,
      q: 1,
      activeCash: 3125,
      activeShares: 130,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'June 1, 2028',
      year: 2028,
      q: 2,
      activeCash: 3125,
      activeShares: 73,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'September 1, 2028',
      year: 2028,
      q: 3,
      activeCash: 3125,
      activeShares: 73,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'December 1, 2028',
      year: 2028,
      q: 4,
      activeCash: 3125,
      activeShares: 73,
      baseNote: 'Quarterly Installment (1/12)',
    },
    {
      date: 'March 1, 2029',
      year: 2029,
      q: 1,
      activeCash: 3125,
      activeShares: 73,
      baseNote: 'Final Active Grant Vest (100% Completed)',
    },
    {
      date: 'June 1, 2029',
      year: 2029,
      q: 2,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
    {
      date: 'September 1, 2029',
      year: 2029,
      q: 3,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
    {
      date: 'December 1, 2029',
      year: 2029,
      q: 4,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
    {
      date: 'March 1, 2030',
      year: 2030,
      q: 1,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
    {
      date: 'June 1, 2030',
      year: 2030,
      q: 2,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
    {
      date: 'September 1, 2030',
      year: 2030,
      q: 3,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
    {
      date: 'December 1, 2030',
      year: 2030,
      q: 4,
      activeCash: 0,
      activeShares: 0,
      baseNote: 'Future Award Quarterly Vest',
    },
  ]

  const rows: DynamicVestingQuarterRow[] = []
  baseQuarters.forEach((qItem) => {
    let fut27Cash = 0
    let fut27Shares = 0
    let fut28Cash = 0
    let fut28Shares = 0
    let fut29Cash = 0
    let fut29Shares = 0
    const notes: string[] = []
    if (qItem.activeCash > 0 || qItem.activeShares > 0) {
      notes.push(qItem.baseNote)
    }

    if (f27 > 0) {
      if (qItem.year === 2028 && qItem.q === 1) {
        fut27Cash = (f27 / 2) * (4 / 12)
        fut27Shares = Math.round(grantShares27 * (4 / 12))
        notes.push('+2027 Grant 1/3 Cliff')
      } else if (
        (qItem.year === 2028 && qItem.q >= 2) ||
        qItem.year === 2029 ||
        (qItem.year === 2030 && qItem.q === 1)
      ) {
        fut27Cash = (f27 / 2) * (1 / 12)
        fut27Shares = Math.round(grantShares27 * (1 / 12))
        notes.push(
          qItem.year === 2030 && qItem.q === 1
            ? '+2027 Grant Final (1/12)'
            : '+2027 Grant (1/12)',
        )
      }
    }

    if (f28 > 0) {
      if (qItem.year === 2029 && qItem.q === 1) {
        fut28Cash = (f28 / 2) * (4 / 12)
        fut28Shares = Math.round(grantShares28 * (4 / 12))
        notes.push('+2028 Grant 1/3 Cliff')
      } else if ((qItem.year === 2029 && qItem.q >= 2) || qItem.year === 2030) {
        fut28Cash = (f28 / 2) * (1 / 12)
        fut28Shares = Math.round(grantShares28 * (1 / 12))
        notes.push('+2028 Grant (1/12)')
      }
    }

    if (f29 > 0) {
      if (qItem.year === 2030 && qItem.q === 1) {
        fut29Cash = (f29 / 2) * (4 / 12)
        fut29Shares = Math.round(grantShares29 * (4 / 12))
        notes.push('+2029 Grant 1/3 Cliff')
      } else if (qItem.year === 2030 && qItem.q >= 2) {
        fut29Cash = (f29 / 2) * (1 / 12)
        fut29Shares = Math.round(grantShares29 * (1 / 12))
        notes.push('+2029 Grant (1/12)')
      }
    }

    const totalCash = Math.round(qItem.activeCash + fut27Cash + fut28Cash + fut29Cash)
    const totalShares = qItem.activeShares + fut27Shares + fut28Shares + fut29Shares
    const totalStockVal = Math.round(totalShares * safePrice)

    if (totalCash > 0 || totalShares > 0) {
      rows.push({
        date: qItem.date,
        year: qItem.year,
        cash: totalCash,
        shares: totalShares,
        stockVal: totalStockVal,
        dayTotal: totalCash + totalStockVal,
        remainingVal: 0,
        note: notes.join(' • '),
      })
    }
  })

  const expectedByYear: Record<number, number> = {
    2027: 805,
    2028: 349 + Math.round(grantShares27 * (7 / 12)),
    2029: 73 + Math.round(grantShares27 * (4 / 12)) + Math.round(grantShares28 * (7 / 12)),
    2030:
      Math.round(grantShares27 * (1 / 12)) +
      Math.round(grantShares28 * (4 / 12)) +
      Math.round(grantShares29 * (7 / 12)),
  }

  ;[2027, 2028, 2029, 2030].forEach((yr) => {
    const yrRows = rows.filter((r) => r.year === yr)
    if (yrRows.length > 0 && expectedByYear[yr] !== undefined) {
      const sumShares = yrRows.reduce((s, r) => s + r.shares, 0)
      const lastRow = yrRows[yrRows.length - 1]
      lastRow.shares += expectedByYear[yr] - sumShares
      lastRow.stockVal = Math.round(lastRow.shares * safePrice)
      lastRow.dayTotal = lastRow.cash + lastRow.stockVal
    }
  })

  const totalScheduleVal = rows.reduce((sum, r) => sum + r.dayTotal, 0)
  let cumulativeVested = 0
  rows.forEach((r) => {
    cumulativeVested += r.dayTotal
    r.remainingVal = Math.max(0, totalScheduleVal - cumulativeVested)
  })

  return rows
}

export function computeCareerReport(
  career: CareerSettings,
  netWorth: number,
  sim: SimulationSettings,
  njUiWeekly = 854,
  njUiWeeks = 26,
  demoMode = false,
): ComputedCareerReport {
  const stockPrice = Math.max(1, career.stockPrice || 57.01)
  const baseInc = career.baseInc ?? 3
  const indivMod = career.indMod ?? 100
  const compPerf = career.coMod ?? 100
  const future2027 = Math.max(0, career.future2027 || 0)
  const future2028 = Math.max(0, career.future2028 || 0)
  const future2029 = Math.max(0, career.future2029 || 0)
  const grantPrices = {
    2027: Math.max(0.01, career.price2027 || 57.01),
    2028: Math.max(0.01, career.price2028 || 57.01),
    2029: Math.max(0.01, career.price2029 || 57.01),
  }

  const isDemo = demoMode || career.baseSalary === 75000
  const base2027 = isDemo ? (career.baseSalary || 75000) : Math.round(186773 * (1 + baseInc / 100))
  const base2028 = Math.round(base2027 * (1 + baseInc / 100))
  const base2029 = Math.round(base2028 * (1 + baseInc / 100))
  const base2030 = Math.round(base2029 * (1 + baseInc / 100))

  const bonusFactor = (indivMod / 100) * (compPerf / 100)
  const bonusPct = isDemo && career.bonus > 0 ? career.bonus / career.baseSalary : 0.1
  const bonus2027 = isDemo ? (career.bonus || Math.round(base2027 * 0.1)) : Math.round(base2027 * 0.1 * bonusFactor)
  const bonus2028 = Math.round(base2028 * bonusPct * bonusFactor)
  const bonus2029 = Math.round(base2029 * bonusPct * bonusFactor)
  const bonus2030 = Math.round(base2030 * bonusPct * bonusFactor)

  const cashReward2027 = isDemo ? (career.cashReward || 0) : 21875
  const cashReward2028 = isDemo ? 0 : 12500
  const cashReward2029 = isDemo ? 0 : 3125
  const cashReward2030 = 0

  const futureCash2027 = 0
  const futureCash2028 = isDemo ? 0 : Math.round((future2027 / 2) * (7 / 12))
  const futureCash2029 = isDemo
    ? 0
    : Math.round((future2027 / 2) * (4 / 12)) + Math.round((future2028 / 2) * (7 / 12))
  const futureCash2030 = isDemo
    ? 0
    : Math.round((future2027 / 2) * (1 / 12)) +
      Math.round((future2028 / 2) * (4 / 12)) +
      Math.round((future2029 / 2) * (7 / 12))

  const futureShares2027 = isDemo ? 0 : getFutureGrantShares(future2027, grantPrices[2027])
  const futureShares2028 = isDemo ? 0 : getFutureGrantShares(future2028, grantPrices[2028])
  const futureShares2029 = isDemo ? 0 : getFutureGrantShares(future2029, grantPrices[2029])

  const eq2027 = isDemo ? (career.rsuVesting || 0) : Math.round(805 * stockPrice)
  const eq2028 = isDemo ? 0 : Math.round(349 * stockPrice)
  const eq2029 = isDemo ? 0 : Math.round(73 * stockPrice)
  const eq2030 = 0

  const activeShares2027 = isDemo ? 0 : 805
  const activeShares2028 = isDemo ? 0 : 349
  const activeShares2029 = isDemo ? 0 : 73

  const futShIn28 = isDemo ? 0 : Math.round(futureShares2027 * (7 / 12))
  const futShIn29 = isDemo
    ? 0
    : Math.round(futureShares2027 * (4 / 12)) + Math.round(futureShares2028 * (7 / 12))
  const futShIn30 = isDemo
    ? 0
    : Math.round(futureShares2027 * (1 / 12)) +
      Math.round(futureShares2028 * (4 / 12)) +
      Math.round(futureShares2029 * (7 / 12))

  const futureStock2027 = 0
  const futureStock2028 = Math.round(futShIn28 * stockPrice)
  const futureStock2029 = Math.round(futShIn29 * stockPrice)
  const futureStock2030 = Math.round(futShIn30 * stockPrice)

  const multiYearByYear: Record<2027 | 2028 | 2029 | 2030, MultiYearColumnData> = {
    2027: {
      year: 2027,
      base: base2027,
      bonus: bonus2027,
      activeCash: cashReward2027,
      futureCash: futureCash2027,
      cashReward: cashReward2027 + futureCash2027,
      trueCash: base2027 + bonus2027 + cashReward2027 + futureCash2027,
      activeShares: activeShares2027,
      futureShares: 0,
      totalShares: activeShares2027,
      activeEq: eq2027,
      futureEq: futureStock2027,
      totEq: eq2027 + futureStock2027,
      trueComp: base2027 + bonus2027 + cashReward2027 + futureCash2027 + eq2027 + futureStock2027,
      cashStatus: isDemo
        ? 'Sample Demonstration Profile'
        : `$${(cashReward2027 + futureCash2027).toLocaleString()} vesting in 2027`,
      cashNext: isDemo
        ? 'Unlock with access key for live compensation'
        : 'Mar $12.5k cliff + $3,125 quarterly',
    },
    2028: {
      year: 2028,
      base: base2028,
      bonus: bonus2028,
      activeCash: cashReward2028,
      futureCash: futureCash2028,
      cashReward: cashReward2028 + futureCash2028,
      trueCash: base2028 + bonus2028 + cashReward2028 + futureCash2028,
      activeShares: activeShares2028,
      futureShares: futShIn28,
      totalShares: activeShares2028 + futShIn28,
      activeEq: eq2028,
      futureEq: futureStock2028,
      totEq: eq2028 + futureStock2028,
      trueComp: base2028 + bonus2028 + cashReward2028 + futureCash2028 + eq2028 + futureStock2028,
      cashStatus: isDemo
        ? 'Sample Demonstration Profile'
        : `$${(cashReward2028 + futureCash2028).toLocaleString()} vesting in 2028`,
      cashNext: isDemo
        ? 'Sample projection'
        : futureCash2028 > 0
          ? `$12,500 active + $${futureCash2028.toLocaleString()} future grant`
          : '$3,125 quarterly × 4 quarters',
    },
    2029: {
      year: 2029,
      base: base2029,
      bonus: bonus2029,
      activeCash: cashReward2029,
      futureCash: futureCash2029,
      cashReward: cashReward2029 + futureCash2029,
      trueCash: base2029 + bonus2029 + cashReward2029 + futureCash2029,
      activeShares: activeShares2029,
      futureShares: futShIn29,
      totalShares: activeShares2029 + futShIn29,
      activeEq: eq2029,
      futureEq: futureStock2029,
      totEq: eq2029 + futureStock2029,
      trueComp: base2029 + bonus2029 + cashReward2029 + futureCash2029 + eq2029 + futureStock2029,
      cashStatus: isDemo
        ? 'Sample Demonstration Profile'
        : `$${(cashReward2029 + futureCash2029).toLocaleString()} vesting in 2029`,
      cashNext: isDemo
        ? 'Sample projection'
        : futureCash2029 > 0
          ? `$3,125 active + $${futureCash2029.toLocaleString()} future grants`
          : '$3,125 final payout installment on Mar 1, 2029',
    },
    2030: {
      year: 2030,
      base: base2030,
      bonus: bonus2030,
      activeCash: cashReward2030,
      futureCash: futureCash2030,
      cashReward: cashReward2030 + futureCash2030,
      trueCash: base2030 + bonus2030 + cashReward2030 + futureCash2030,
      activeShares: 0,
      futureShares: futShIn30,
      totalShares: futShIn30,
      activeEq: eq2030,
      futureEq: futureStock2030,
      totEq: eq2030 + futureStock2030,
      trueComp: base2030 + bonus2030 + cashReward2030 + futureCash2030 + eq2030 + futureStock2030,
      cashStatus: isDemo
        ? 'Sample Demonstration Profile'
        : cashReward2030 + futureCash2030 > 0
          ? `$${(cashReward2030 + futureCash2030).toLocaleString()} vesting in 2030`
          : 'Active grant completed in 2029 ($0)',
      cashNext: isDemo
        ? 'Sample projection'
        : cashReward2030 + futureCash2030 > 0
          ? 'Quarterly vesting from 2027–2029 awards'
          : 'Enter 2027–2029 grants above to model 2030 awards',
    },
  }

  const multiYearList = [
    multiYearByYear[2027],
    multiYearByYear[2028],
    multiYearByYear[2029],
    multiYearByYear[2030],
  ]

  const vestingRows = isDemo
    ? []
    : getDynamicVestingSchedule(
        stockPrice,
        future2027,
        future2028,
        future2029,
        grantPrices,
      )
  const totalCashVal = vestingRows.reduce((s, r) => s + r.cash, 0)
  const totalShares = vestingRows.reduce((s, r) => s + r.shares, 0)
  const totalStockVal = vestingRows.reduce((s, r) => s + r.stockVal, 0)
  const totalCombined = totalCashVal + totalStockVal
  const nextDayVal =
    vestingRows.length > 0 ? vestingRows[0].dayTotal : Math.round(12500 + 412 * stockPrice)

  const annualVestingByYear = {
    2027: { cash: 0, stock: 0, shares: 0, total: 0 },
    2028: { cash: 0, stock: 0, shares: 0, total: 0 },
    2029: { cash: 0, stock: 0, shares: 0, total: 0 },
    2030: { cash: 0, stock: 0, shares: 0, total: 0 },
  }
  ;([2027, 2028, 2029, 2030] as const).forEach((yr) => {
    const yrRows = vestingRows.filter((r) => r.year === yr)
    const c = yrRows.reduce((s, r) => s + r.cash, 0)
    const st = yrRows.reduce((s, r) => s + r.stockVal, 0)
    const sh = yrRows.reduce((s, r) => s + r.shares, 0)
    annualVestingByYear[yr] = { cash: c, stock: st, shares: sh, total: c + st }
  })

  // Future award breakdown
  const totalFutureAward = future2027 + future2028 + future2029
  const vest2028Cash = Math.round((future2027 / 2) * (7 / 12))
  const vest2028Stock = Math.round(Math.round(futureShares2027 * (7 / 12)) * stockPrice)
  const vest2029From27 =
    Math.round((future2027 / 2) * (4 / 12)) +
    Math.round(Math.round(futureShares2027 * (4 / 12)) * stockPrice)
  const vest2029From28 =
    Math.round((future2028 / 2) * (7 / 12)) +
    Math.round(Math.round(futureShares2028 * (7 / 12)) * stockPrice)
  const vest2030From27 =
    Math.round((future2027 / 2) * (1 / 12)) +
    Math.round(Math.round(futureShares2027 * (1 / 12)) * stockPrice)
  const vest2030From28 =
    Math.round((future2028 / 2) * (4 / 12)) +
    Math.round(Math.round(futureShares2028 * (4 / 12)) * stockPrice)
  const vest2030From29 =
    Math.round((future2029 / 2) * (7 / 12)) +
    Math.round(Math.round(futureShares2029 * (7 / 12)) * stockPrice)

  const simAwardSplit = {
    cashPortion: totalFutureAward / 2,
    stockPortion: totalFutureAward / 2,
    totalShares: futureShares2027 + futureShares2028 + futureShares2029,
    vest2028Total: vest2028Cash + vest2028Stock,
    vest2028Cash,
    vest2028Stock,
    vest2029Total: vest2029From27 + vest2029From28,
    vest2029From27,
    vest2029From28,
    vest2030Total: vest2030From27 + vest2030From28 + vest2030From29,
    vest2030From27,
    vest2030From28,
    vest2030From29,
  }

  // Active W-2 Tax Year figures
  const yrKey = career.selectedYear !== 'custom' ? Number(career.selectedYear) : null
  const presetCol =
    yrKey && (yrKey === 2027 || yrKey === 2028 || yrKey === 2029 || yrKey === 2030)
      ? multiYearByYear[yrKey]
      : null

  const activeBaseSalary = presetCol ? presetCol.base : Math.max(0, career.baseSalary)
  const activeBonus = presetCol ? presetCol.bonus : Math.max(0, career.bonus)
  const activeCashReward = presetCol ? presetCol.cashReward : Math.max(0, career.cashReward)
  const activeRsuVesting = presetCol ? presetCol.totEq : Math.max(0, career.rsuVesting)
  const activeYrShares = presetCol
    ? presetCol.totalShares
    : Math.round(activeRsuVesting / stockPrice)
  const activeMatch = presetCol
    ? isDemo
      ? Math.round(activeBaseSalary * 0.05)
      : yrKey === 2027 && baseInc === 3 && indivMod === 100 && compPerf === 100
        ? 8495
        : Math.round((activeBaseSalary + activeBonus) * 0.04)
    : Math.max(0, career.employerMatch)
  const activeK401 = Math.max(0, career.k401)
  const activeHealth = Math.max(0, career.healthPreTax)
  const activeHsa = Math.max(0, career.hsaPreTax)

  const grossCash = activeBaseSalary + activeBonus + activeCashReward
  const totalComp = grossCash + activeRsuVesting
  const earnedGross = totalComp
  const preTaxDeductions = activeK401 + activeHealth + activeHsa

  const fedStdDeduction = 16100
  const fedTaxable = Math.max(0, earnedGross - preTaxDeductions - fedStdDeduction)
  const fedTax = computeFedTax(fedTaxable)

  const ficaWageBase = Math.max(0, earnedGross - activeHealth - activeHsa)
  const fica = computeFica(ficaWageBase)
  const { ssTax, medBaseTax, medSurtax, totalFica } = fica

  const njGross = Math.max(0, earnedGross - activeK401 - activeHealth)
  const njTaxable = Math.max(0, njGross - 1000)
  const njTax = computeNjTax(njTaxable)

  const totalTaxes = fedTax + totalFica + njTax
  const netTakeHomeAnnual = earnedGross - totalTaxes - preTaxDeductions
  const monthlyTakeHome = netTakeHomeAnnual / 12
  const biWeeklyTakeHome = netTakeHomeAnnual / 26
  const effectiveTaxRate = earnedGross > 0 ? (totalTaxes / earnedGross) * 100 : 0
  const totalWealthRetained = netTakeHomeAnnual + activeK401 + activeHsa + activeMatch

  // Freedom Replacement Bridge
  let bridgeTargetAnnual = netTakeHomeAnnual
  let bridgeDesc = 'Total Cash Take-Home (Base + AIP + Cash Reward):'
  if (career.replaceMode === 'base') {
    const bFed = computeFedTax(Math.max(0, activeBaseSalary - preTaxDeductions - fedStdDeduction))
    const bFica = computeFica(Math.max(0, activeBaseSalary - activeHealth - activeHsa))
    const bNj = computeNjTax(Math.max(0, activeBaseSalary - activeK401 - activeHealth - 1000))
    bridgeTargetAnnual = activeBaseSalary - (bFed + bFica.totalFica + bNj) - preTaxDeductions
    bridgeDesc = 'Base Salary Cash Take-Home:'
  } else if (career.replaceMode === 'total') {
    bridgeTargetAnnual = netTakeHomeAnnual
    bridgeDesc = 'Total Comp Take-Home (Cash + RSUs):'
  } else {
    const cFed = computeFedTax(Math.max(0, grossCash - preTaxDeductions - fedStdDeduction))
    const cFica = computeFica(Math.max(0, grossCash - activeHealth - activeHsa))
    const cNj = computeNjTax(Math.max(0, grossCash - activeK401 - activeHealth - 1000))
    bridgeTargetAnnual = grossCash - (cFed + cFica.totalFica + cNj) - preTaxDeductions
    bridgeDesc = 'Total Cash Take-Home (Base + AIP + Cash Reward):'
  }

  const swrDec = Math.max(0.005, sim.swr / 100)
  const nomRetDec = sim.nominalReturn / 100
  const monthlyJobTakeHome = bridgeTargetAnnual / 12
  const monthlyPassive = (netWorth * swrDec) / 12
  const replacePct = monthlyJobTakeHome > 0 ? (monthlyPassive / monthlyJobTakeHome) * 100 : 0
  const monthlyGap = Math.max(0, monthlyJobTakeHome - monthlyPassive)
  const targetPortReq = bridgeTargetAnnual / swrDec
  const portGap = Math.max(0, targetPortReq - netWorth)
  const yearsToReplace = computeOfficialYearsToFire(
    netWorth,
    targetPortReq,
    sim.annualSavings,
    nomRetDec,
  )
  const timelineText =
    portGap <= 0
      ? '100% Replaced Today'
      : `in ~${yearsToReplace} yrs (${2027 + yearsToReplace}, Age ${2027 + yearsToReplace - 1993})`

  // Severance & NJ UI Safety Net
  const sevWeeks = Math.max(0, career.severanceWeeks)
  const vestBuffer = Math.max(0, career.vestingBuffer)
  const severancePay = Math.round((sevWeeks / 52) * activeBaseSalary)
  const njUiTotal = Math.round(Math.max(0, njUiWeekly) * Math.max(0, njUiWeeks))
  const grossSafety = severancePay + vestBuffer + njUiTotal
  const netSafety = Math.round(grossSafety * 0.8)
  const totalAnnualBudget = (sim.baseSpend > 0 ? sim.baseSpend : 95000) + (sim.healthCost ?? 3840)
  const monthlySpendForSafety = Math.max(1, Math.round(totalAnnualBudget / 12))
  const runwayMonths = monthlySpendForSafety > 0 ? netSafety / monthlySpendForSafety : 0

  // Cash-only net vs RSU net
  const cFed = computeFedTax(Math.max(0, grossCash - preTaxDeductions - fedStdDeduction))
  const cFica = computeFica(Math.max(0, grossCash - activeHealth - activeHsa))
  const cNj = computeNjTax(Math.max(0, grossCash - activeK401 - activeHealth - 1000))
  const netCashOnly = grossCash - (cFed + cFica.totalFica + cNj) - preTaxDeductions
  const netRsuOnly = netTakeHomeAnnual - netCashOnly

  const rawRows: {
    name: string
    annual: number
    isDeduction?: boolean
    pctOverride?: string
    highlight?: 'blue' | 'red' | 'green' | 'cyan'
    notes: string
  }[] = [
    {
      name: 'Base Annual Salary',
      annual: activeBaseSalary,
      notes: `Regular base pay ($${Math.round(activeBaseSalary / 12).toLocaleString()} / month)`,
    },
    {
      name: 'AIP Annual Incentive Bonus',
      annual: activeBonus,
      notes: `AIP Cash Bonus (Target 10% = $${Math.round(activeBaseSalary * 0.1).toLocaleString()}; modifier applied)`,
    },
    {
      name: 'Long Term Cash Award ("Cash Reward")',
      annual: activeCashReward,
      notes:
        activeCashReward > 0
          ? 'Vested portion of active/future cash grants paid via payroll in USD'
          : 'Active grant completed in 2029 ($21,875 in 2027, $12,500 in 2028, $3,125 in 2029)',
    },
    {
      name: 'Equity Award (RSUs Vesting)',
      annual: activeRsuVesting,
      notes: `Always included in W-2 gross taxable earnings (${activeYrShares.toLocaleString()} shares @ $${stockPrice.toFixed(2)}) per IRS & NJ tax law`,
    },
    {
      name: 'Gross Taxable Earnings (W-2)',
      annual: earnedGross,
      highlight: 'blue',
      notes: `100.0% W-2 Gross = Base ($${Math.round(activeBaseSalary).toLocaleString()}) + AIP ($${Math.round(activeBonus).toLocaleString()}) + Cash Award ($${Math.round(activeCashReward).toLocaleString()}) + RSUs ($${Math.round(activeRsuVesting).toLocaleString()})`,
    },
    {
      name: 'Pre-Tax 401(k) Employee Contribution',
      annual: activeK401,
      isDeduction: true,
      notes:
        'IRS Elective Limit: $24,500. Diverted into your 401(k) shield (Exempt from Federal & NJ income tax)',
    },
    {
      name: 'Pre-Tax HSA & Health Insurance',
      annual: activeHealth + activeHsa,
      isDeduction: true,
      notes: `HSA ($${Math.round(activeHsa).toLocaleString()}) + Health Insurance ($${Math.round(activeHealth).toLocaleString()}). Exempt from Federal & FICA taxes`,
    },
    {
      name: 'Federal Income Tax (IRS)',
      annual: fedTax,
      isDeduction: true,
      notes: `Taxable Income: $${Math.round(fedTaxable).toLocaleString()} after $16,100 std deduction & $${Math.round(preTaxDeductions).toLocaleString()} pre-tax shields`,
    },
    {
      name: 'Social Security Tax (FICA)',
      annual: ssTax,
      isDeduction: true,
      notes: '6.20% up to $181,800 cap ($11,272 max). Zero tax on income above cap!',
    },
    {
      name: 'Medicare Tax & Surtax (FICA)',
      annual: medBaseTax + medSurtax,
      isDeduction: true,
      notes: `1.45% base Medicare${medSurtax > 0 ? ' + $' + Math.round(medSurtax).toLocaleString() + ' 0.9% additional Medicare surtax (> $200k)' : ' (no wage cap)'}`,
    },
    {
      name: 'New Jersey State Tax (NJ-1040)',
      annual: njTax,
      isDeduction: true,
      notes: `NJ Taxable: $${Math.round(njTaxable).toLocaleString()} after $${Math.round(activeK401 + activeHealth).toLocaleString()} 401(k)/health deduction & $1k exemption`,
    },
    {
      name: 'Total Taxes + Pre-Tax Deductions',
      annual: totalTaxes + preTaxDeductions,
      isDeduction: true,
      highlight: 'red',
      notes: `Taxes: $${Math.round(totalTaxes).toLocaleString()} (${earnedGross > 0 ? ((totalTaxes / earnedGross) * 100).toFixed(1) : '0.0'}%) + Pre-Tax 401k/HSA/Health: $${Math.round(preTaxDeductions).toLocaleString()} (${earnedGross > 0 ? ((preTaxDeductions / earnedGross) * 100).toFixed(1) : '0.0'}%)`,
    },
    {
      name: 'Net Take-Home (Cash + Net Vested RSUs)',
      annual: netTakeHomeAnnual,
      highlight: 'green',
      notes: `100% Gross − ${earnedGross > 0 ? ((preTaxDeductions / earnedGross) * 100).toFixed(1) : '0.0'}% Pre-Tax − ${earnedGross > 0 ? ((totalTaxes / earnedGross) * 100).toFixed(1) : '0.0'}% Taxes = ${earnedGross > 0 ? ((netTakeHomeAnnual / earnedGross) * 100).toFixed(1) : '0.0'}% Net ($${Math.round(netCashOnly).toLocaleString()} net cash + $${Math.round(netRsuOnly).toLocaleString()} net RSUs)`,
    },
    {
      name: 'Employer 401(k) Match (Non-Taxable Bonus)',
      annual: activeMatch,
      pctOverride:
        '+' + (earnedGross > 0 ? ((activeMatch / earnedGross) * 100).toFixed(1) : '0') + '%',
      notes:
        'Deposited directly to your 401(k) by employer on top of W-2 gross. Not taxed until retirement withdrawal',
    },
    {
      name: 'Total Wealth Retained (Net + 401k + HSA + Match)',
      annual: totalWealthRetained,
      highlight: 'cyan',
      notes: `Net Take-Home ($${Math.round(netTakeHomeAnnual).toLocaleString()}) + 401k ($${Math.round(activeK401).toLocaleString()}) + HSA ($${Math.round(activeHsa).toLocaleString()}) + Match ($${Math.round(activeMatch).toLocaleString()})`,
    },
  ]

  const taxRows: TaxTableRow[] = rawRows.map((r) => {
    const sign = r.isDeduction ? '-' : ''
    const pctStr =
      r.pctOverride ||
      (earnedGross > 0 ? sign + ((r.annual / earnedGross) * 100).toFixed(1) + '%' : '0%')
    return {
      name: r.name,
      annual: r.annual,
      monthly: Math.round(r.annual / 12),
      pctStr,
      notes: r.notes,
      isDeduction: r.isDeduction,
      highlight: r.highlight,
    }
  })

  return {
    multiYearByYear,
    multiYearList,
    vestingRows,
    totalCashVal,
    totalShares,
    totalStockVal,
    totalCombined,
    nextDayVal,
    annualVestingByYear,
    simAwardSplit,
    activeBaseSalary,
    activeBonus,
    activeCashReward,
    activeRsuVesting,
    activeYrShares,
    activeMatch,
    activeK401,
    activeHealth,
    activeHsa,
    earnedGross,
    preTaxDeductions,
    fedTaxable,
    fedTax,
    ssTax,
    medBaseTax,
    medSurtax,
    totalFica,
    njTaxable,
    njTax,
    totalTaxes,
    netTakeHomeAnnual,
    monthlyTakeHome,
    biWeeklyTakeHome,
    effectiveTaxRate,
    totalWealthRetained,
    bridgeDesc,
    bridgeTargetAnnual,
    monthlyJobTakeHome,
    monthlyPassive,
    replacePct,
    monthlyGap,
    timelineText,
    severancePay,
    njUiTotal,
    grossSafety,
    netSafety,
    monthlySpendForSafety,
    runwayMonths,
    taxRows,
  }
}

export async function fetchPayPalQuote(): Promise<number> {
  try {
    const resp = await fetch('https://api.nasdaq.com/api/quote/PYPL/info?assetclass=stocks', {
      headers: { Accept: 'application/json' },
    })
    if (resp.ok) {
      const json = await resp.json()
      const rawPrice = json?.data?.primaryData?.lastSalePrice
      if (rawPrice) {
        const parsed = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''))
        if (!isNaN(parsed) && parsed > 0) return parsed
      }
    }
  } catch {
    // Fallback to Yahoo
  }

  try {
    const resp = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/PYPL')
    if (resp.ok) {
      const json = await resp.json()
      const p = json?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (p && !isNaN(p) && p > 0) return Number(p)
    }
  } catch {
    // Fallback to default
  }

  return 57.01
}
