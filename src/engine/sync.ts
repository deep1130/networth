import { SCRIPT_URL } from '../constants'
import type { SheetDataMap } from '../types'
import { HISTORY_SHEET_META } from './history'

function safeNum(val: unknown, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? fallback : n
}

export async function fetchSheetDashboard(
  key: string,
): Promise<{ netWorth: number; liveBaseSpend: number }> {
  const url = `${SCRIPT_URL}?key=${encodeURIComponent(key)}&action=read&sheet=Dashboard&range=A2:B6`
  const resp = await fetch(url)
  const json = await resp.json()
  if (json && json.data) {
    const nwVal = safeNum(json.data[1] ? json.data[1][1] : 0, 0)
    const spendVal = safeNum(json.data[3] ? json.data[3][1] : 0, 0)
    if (nwVal <= 0) {
      throw new Error('Invalid portfolio data returned from spreadsheet.')
    }
    return { netWorth: nwVal, liveBaseSpend: spendVal }
  }
  const errMsg = json && json.error ? String(json.error) : 'Invalid access key or access denied.'
  throw new Error(errMsg)
}

export async function fetchSheetHistory(
  key: string,
): Promise<{ sheets: SheetDataMap; errors: { key: string; message: string }[] }> {
  const requests = Object.entries(HISTORY_SHEET_META).map(async ([sheetKey, sheet]) => {
    const params = new URLSearchParams({
      key,
      action: 'read',
      sheet: sheet.name,
      range: 'A1:Z500',
    })
    const response = await fetch(`${SCRIPT_URL}?${params.toString()}`)
    const json = await response.json()
    if (!response.ok) throw new Error(`Sheets API returned ${response.status}.`)
    if (json?.error) throw new Error(String(json.error))
    if (!Array.isArray(json?.data)) throw new Error('No data table returned.')
    return { key: sheetKey, data: json.data as string[][] }
  })

  const results = await Promise.allSettled(requests)
  const sheets: SheetDataMap = {}
  const errors: { key: string; message: string }[] = []

  results.forEach((result, index) => {
    const sheetKey = Object.keys(HISTORY_SHEET_META)[index]
    if (result.status === 'fulfilled') {
      sheets[result.value.key] = result.value.data
    } else {
      errors.push({
        key: sheetKey,
        message: result.reason?.message || 'Unavailable',
      })
    }
  })

  return { sheets, errors }
}

export async function parseExcelFile(
  file: File,
): Promise<{ netWorth: number; liveBaseSpend: number; historySheets: SheetDataMap }> {
  const XLSX = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })

  const readCellNum = (sheet: Record<string, { v?: unknown; w?: unknown }> | undefined, addr: string): number => {
    if (!sheet || !sheet[addr]) return 0
    const cell = sheet[addr]
    return safeNum(cell.v !== undefined ? cell.v : cell.w, 0)
  }

  let parsedNW = 0
  let parsedSpend = 0

  if (workbook.Sheets['Dashboard']) {
    const sheet = workbook.Sheets['Dashboard']
    parsedNW = readCellNum(sheet, 'B3') || readCellNum(sheet, 'B2')
    parsedSpend = readCellNum(sheet, 'B5') || readCellNum(sheet, 'B4')
  }
  if (parsedNW <= 0 && workbook.Sheets['Goals']) {
    const sheet = workbook.Sheets['Goals']
    parsedNW = readCellNum(sheet, 'L3') || readCellNum(sheet, 'K3') || readCellNum(sheet, 'B3')
  }
  if (parsedNW <= 0 && workbook.Sheets['Overall']) {
    const sheet = workbook.Sheets['Overall']
    parsedNW = readCellNum(sheet, 'B3') || readCellNum(sheet, 'B2')
  }
  if (parsedNW <= 0 && workbook.SheetNames.length > 0) {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    parsedNW = readCellNum(firstSheet, 'B3') || readCellNum(firstSheet, 'B2')
    if (!parsedSpend) parsedSpend = readCellNum(firstSheet, 'B5')
  }

  const historySheets: SheetDataMap = {}
  Object.entries(HISTORY_SHEET_META).forEach(([key, meta]) => {
    const ws = workbook.Sheets[meta.name]
    if (ws) {
      const grid = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 })
      if (Array.isArray(grid) && grid.length > 0) {
        historySheets[key] = grid
      }
    }
  })

  return { netWorth: parsedNW, liveBaseSpend: parsedSpend, historySheets }
}
