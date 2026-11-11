import type { SheetDataMap } from '../types'

export type HistoryViewMode = 'overview' | 'income' | 'taxes' | 'investing' | 'living'

export const HISTORY_SHEET_META: Record<string, { name: string; label: string }> = {
  income: { name: 'Income', label: 'Income' },
  taxes: { name: 'Taxes', label: 'Taxes' },
  taxReturns: { name: 'Tax returns', label: 'Tax returns' },
  investing: { name: 'Investment Contributions', label: 'Investment contributions' },
  living: { name: 'Living', label: 'Living costs' },
  match: { name: 'Company Match', label: 'Company match' },
}

export function historyYear(value: unknown): number | null {
  const year = Number(value)
  return Number.isInteger(year) && year >= 1900 && year <= 2200 ? year : null
}

export function historyYearColumns(grid?: unknown[][]): { year: number; index: number }[] {
  if (!Array.isArray(grid) || !Array.isArray(grid[0])) return []
  const result: { year: number; index: number }[] = []
  grid[0].forEach((value, index) => {
    const yr = historyYear(value)
    if (yr !== null) result.push({ year: yr, index })
  })
  return result
}

export function getHistoryYears(sheets: SheetDataMap): number[] {
  const years = new Set<number>()
  ;['income', 'taxes', 'taxReturns', 'investing', 'match'].forEach((key) => {
    historyYearColumns(sheets[key]).forEach((item) => years.add(item.year))
  })
  ;(sheets.living || []).slice(1).forEach((row) => {
    const year = historyYear(row?.[0])
    if (year !== null) years.add(year)
  })
  return [...years].sort((a, b) => b - a)
}

export function getHistoryMetric(
  sheets: SheetDataMap,
  sheetKey: string,
  labelPattern: RegExp,
  year: number,
): number | null {
  const grid = sheets[sheetKey]
  if (!Array.isArray(grid) || !grid.length) return null
  if (sheetKey === 'living') {
    const row = grid.slice(1).find((item) => historyYear(item?.[0]) === year)
    const totalIndex = (grid[0] || []).findIndex((value) =>
      /^total$/i.test(String(value ?? '').trim()),
    )
    if (!row || totalIndex < 0 || row[totalIndex] === '') return null
    const value = Number(row[totalIndex])
    return Number.isFinite(value) ? value : null
  }
  const yearColumn = historyYearColumns(grid).find((item) => item.year === year)
  if (!yearColumn) return null
  const row = grid.slice(1).find((item) => labelPattern.test(String(item?.[0] ?? '').trim()))
  if (!row || row[yearColumn.index] === '' || row[yearColumn.index] === undefined) return null
  const value = Number(row[yearColumn.index])
  return Number.isFinite(value) ? value : null
}

export function buildHistoryOverviewGrid(sheets: SheetDataMap): {
  headers: string[]
  rows: (string | number | null)[][]
} {
  const years = getHistoryYears(sheets)
  const headers = [
    'Year',
    'Income total',
    'Taxes total',
    'Effective tax rate',
    'Investment contributions',
    'Investment rate',
    'Employer match',
    'Living costs',
  ]
  const rows = years.map((year) => {
    const income = getHistoryMetric(sheets, 'income', /^total$/i, year)
    const taxes = getHistoryMetric(sheets, 'taxes', /^total taxes?$/i, year)
    const investments = getHistoryMetric(sheets, 'investing', /^total$/i, year)
    const match = getHistoryMetric(sheets, 'match', /^total$/i, year)
    const living = getHistoryMetric(sheets, 'living', /^total$/i, year)
    return [
      year,
      income,
      taxes,
      income && income > 0 && taxes !== null ? `${((taxes / income) * 100).toFixed(1)}%` : null,
      investments,
      income && income > 0 && investments !== null
        ? `${((investments / income) * 100).toFixed(1)}%`
        : null,
      match,
      living,
    ]
  })
  return { headers, rows }
}

export function buildHistoryDetailGrid(
  sheets: SheetDataMap,
  view: Exclude<HistoryViewMode, 'overview'>,
): { headers: string[]; rows: (string | number | null)[][] } {
  if (view === 'living') {
    const grid = sheets.living || []
    const headers = grid[0] || []
    const rows = grid
      .slice(1)
      .filter((row) => historyYear(row?.[0]) !== null)
      .map((row) => [
        historyYear(row[0]),
        ...headers.slice(1).map((_, index) => row[index + 1] ?? null),
      ])
      .sort((a, b) => Number(b[0] || 0) - Number(a[0] || 0))
    return {
      headers: ['Year', ...headers.slice(1).map((value) => String(value ?? ''))],
      rows,
    }
  }

  const sourceKeys =
    view === 'income'
      ? ['income']
      : view === 'taxes'
        ? ['taxes', 'taxReturns']
        : ['investing', 'match']
  const items: { label: string; values: Map<number, string | number | null> }[] = []

  sourceKeys.forEach((key) => {
    const grid = sheets[key]
    if (!Array.isArray(grid) || !grid.length) return
    const yearColumns = historyYearColumns(grid)
    grid.slice(1).forEach((row) => {
      const label = String(row?.[0] ?? '').trim()
      if (!label || /^lifetime\s+total$/i.test(label)) return
      const hasAnnualValues = yearColumns.some((column) => {
        const value = row[column.index]
        return (
          value !== '' &&
          value !== null &&
          value !== undefined &&
          Number.isFinite(Number(value))
        )
      })
      if (!hasAnnualValues) return
      const prefix =
        key === 'taxReturns' ? 'Tax return' : key === 'match' ? 'Employer match' : ''
      items.push({
        label: prefix ? `${prefix} · ${label}` : label,
        values: new Map(
          yearColumns.map((column) => [column.year, row[column.index] ?? null]),
        ),
      })
    })
  })
  const years = getHistoryYears(sheets)
  return {
    headers: ['Year', ...items.map((item) => item.label)],
    rows: years.map((year) => [year, ...items.map((item) => item.values.get(year) ?? null)]),
  }
}

export function formatHistoryCell(value: string | number | null, header: string): string {
  if (value === null || value === undefined || value === '') return '—'
  if (
    typeof value === 'number' ||
    (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim()))
  ) {
    const number = Number(value)
    if (/rate|percent|%/i.test(header))
      return `${number.toLocaleString('en-US', { maximumFractionDigits: 1 })}%`
    if (/^year$/i.test(header)) return String(Math.round(number))
    const formatted = Math.abs(number).toLocaleString('en-US', { maximumFractionDigits: 2 })
    return number < 0 ? '-$' + formatted : '$' + formatted
  }
  return String(value)
}

export function buildHistorySummaryItems(
  sheets: SheetDataMap,
): { label: string; value: string }[] {
  const years = getHistoryYears(sheets)
  const latestYear = years.find((year) =>
      ['income', 'taxes', 'investing', 'living'].some((key) => {
        const value = getHistoryMetric(
          sheets,
          key,
          key === 'taxes' ? /^total taxes?$/i : /^total$/i,
          year,
        )
        return value !== null && value !== 0
      }),
    )

  const summaryItems: { label: string; value: string }[] = []
  if (latestYear) {
    const income = getHistoryMetric(sheets, 'income', /^total$/i, latestYear)
    const taxes = getHistoryMetric(sheets, 'taxes', /^total taxes?$/i, latestYear)
    const investments = getHistoryMetric(sheets, 'investing', /^total$/i, latestYear)
    const match = getHistoryMetric(sheets, 'match', /^total$/i, latestYear)
    const living = getHistoryMetric(sheets, 'living', /^total$/i, latestYear)
    summaryItems.push({ label: 'Latest year with data', value: String(latestYear) })
    if (income !== null)
      summaryItems.push({
        label: `Income total · ${latestYear}`,
        value: '$' + Math.round(income).toLocaleString(),
      })
    if (taxes !== null) {
      summaryItems.push({
        label: `Taxes total · ${latestYear}`,
        value: '$' + Math.round(taxes).toLocaleString(),
      })
      if (income && income > 0)
        summaryItems.push({
          label: 'Effective tax rate · calculated',
          value: `${((taxes / income) * 100).toFixed(1)}%`,
        })
    }
    if (investments !== null) {
      summaryItems.push({
        label: `Investment contributions · ${latestYear}`,
        value: '$' + Math.round(investments).toLocaleString(),
      })
      if (income && income > 0)
        summaryItems.push({
          label: 'Investment rate · calculated',
          value: `${((investments / income) * 100).toFixed(1)}% of income`,
        })
    }
    if (match !== null)
      summaryItems.push({
        label: `Employer match · ${latestYear}`,
        value: '$' + Math.round(match).toLocaleString(),
      })
    if (living !== null)
      summaryItems.push({
        label: `Living costs · ${latestYear}`,
        value: '$' + Math.round(living).toLocaleString(),
      })
  }
  return summaryItems
}
