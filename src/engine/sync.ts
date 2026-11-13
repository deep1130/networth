import { SCRIPT_URL } from '../constants'
import type { SheetDataMap } from '../types'
import { HISTORY_SHEET_META } from './history'

function safeNum(val: unknown, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? fallback : n
}

async function parseJsonResponse(resp: Response): Promise<Record<string, unknown>> {
  const text = await resp.text()
  if (!resp.ok) {
    throw new Error(`Sheets API returned ${resp.status}.`)
  }
  try {
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new Error('Invalid response from Google Sheets endpoint.')
  }
}

export async function fetchSheetDashboard(
  key: string,
): Promise<{ netWorth: number; liveBaseSpend: number }> {
  const url = `${SCRIPT_URL}?key=${encodeURIComponent(key)}&action=read&sheet=Dashboard&range=A2:B6`
  const resp = await fetch(url)
  const json = await parseJsonResponse(resp)
  if (Array.isArray(json?.data)) {
    const rows = json.data as unknown[][]
    const nwVal = safeNum(rows[1] ? rows[1][1] : 0, 0)
    const spendVal = safeNum(rows[3] ? rows[3][1] : 0, 0)
    if (nwVal <= 0) {
      throw new Error('Invalid portfolio data returned from spreadsheet.')
    }
    return { netWorth: nwVal, liveBaseSpend: spendVal }
  }
  const errMsg = json?.error ? String(json.error) : 'Invalid access key or access denied.'
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
