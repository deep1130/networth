import { Database, Lock } from 'lucide-react'
import { useState } from 'react'
import {
  buildHistoryDetailGrid,
  buildHistoryOverviewGrid,
  buildHistorySummaryItems,
  formatHistoryCell,
  getHistoryYears,
  HISTORY_SHEET_META,
  type HistoryViewMode,
} from '../engine/history'
import type { SheetDataMap } from '../types'

interface HistoryViewProps {
  isUnlocked: boolean
  demoMode: boolean
  sheets: SheetDataMap
  status: 'locked' | 'loading' | 'loaded' | 'empty' | 'error'
  errorMessage: string
  sheetErrors: { key: string; message: string }[]
  onOpenKeyModal: () => void
}

const VIEW_TABS: { id: HistoryViewMode; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'income', label: 'Income' },
  { id: 'taxes', label: 'Taxes & Returns' },
  { id: 'investing', label: 'Investing & Match' },
  { id: 'living', label: 'Living Costs' },
]

export function HistoryView({
  isUnlocked,
  demoMode,
  sheets,
  status,
  errorMessage,
  sheetErrors,
  onOpenKeyModal,
}: HistoryViewProps) {
  const [view, setView] = useState<HistoryViewMode>('overview')

  const years = getHistoryYears(sheets)
  const summaryItems = buildHistorySummaryItems(sheets)
  const availableSheetKeys = Object.keys(sheets).filter((k) => sheets[k]?.length)

  let statusTag = 'LOCKED'
  let messageText = 'Connect your sheet or load sample data to inspect multi-year history.'
  if (isUnlocked) {
    if (demoMode) {
      statusTag = `${years.length} SAMPLE YEARS`
      messageText = 'Synthetic example history (2022–2025) · Not loaded from a personal sheet.'
    } else if (status === 'loading') {
      statusTag = 'LOADING...'
      messageText = 'Loading income, taxes, investments, and living costs from Google Sheets…'
    } else if (status === 'error') {
      statusTag = 'UNAVAILABLE'
      messageText = errorMessage || 'Could not load financial history from the spreadsheet.'
    } else if (!years.length) {
      statusTag = 'NO ANNUAL DATA'
      messageText = 'Sheets loaded, but no annual year columns were detected.'
    } else {
      statusTag = `${years.length} YEARS LOADED`
      const loadedLabels = availableSheetKeys.map((k) => HISTORY_SHEET_META[k]?.label || k)
      const missingLabels = sheetErrors.map((e) => HISTORY_SHEET_META[e.key]?.label || e.key)
      messageText = `Loaded ${loadedLabels.join(', ')}.${
        missingLabels.length ? ` Unavailable: ${missingLabels.join(', ')}.` : ''
      }`
    }
  }

  const table =
    view === 'overview'
      ? buildHistoryOverviewGrid(sheets)
      : buildHistoryDetailGrid(sheets, view)

  return (
    <div className="history-stack">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title-group">
              <Database size={16} className="text-accent" />
              <h2 className="panel-title">Historical Income, Taxes, Investing &amp; Living Ledger</h2>
            </div>
            <p className="panel-subtitle">{messageText}</p>
          </div>
          <span className="status-tag">{statusTag}</span>
        </div>

        {!isUnlocked ? (
          <div className="locked-empty-state">
            <div className="empty-lock-circle">
              <Lock size={20} />
            </div>
            <h3>Historical Financial Ledger Locked</h3>
            <p>
              Annual W-2 income, federal/FICA/state taxes, investment contributions, employer match,
              and living expenses remain hidden until unlocked.
            </p>
            <button type="button" className="btn btn-primary" onClick={onOpenKeyModal}>
              Unlock With Secret Key
            </button>
          </div>
        ) : (
          <>
            {/* Summary KPI Cards */}
            {summaryItems.length > 0 && (
              <div className="telemetry-grid">
                {summaryItems.map((item) => (
                  <div key={item.label} className="telemetry-card">
                    <div className="telemetry-label">{item.label.toUpperCase()}</div>
                    <div className="telemetry-value small accent-blue">{item.value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Category Filter Chips */}
            <div className="chips-row" style={{ marginBottom: 14 }}>
              {VIEW_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip ${view === t.id ? 'active' : ''}`}
                  onClick={() => setView(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {table.rows.length === 0 || table.headers.length === 0 ? (
              <div className="empty-inline-msg">No data is available for this view.</div>
            ) : (
              <>
                {/* Mobile-First Year Cards View (<= 820px) */}
                <div className="mobile-cards-view">
                  {table.rows.map((row, rIdx) => {
                    const yearVal = formatHistoryCell(row[0], table.headers[0])
                    return (
                      <div key={`${yearVal}-${rIdx}`} className="m-card">
                        <div className="m-card-head">
                          <div className="m-card-title">Year {yearVal}</div>
                          <span className="year-pill">{view.toUpperCase()}</span>
                        </div>
                        <div className="m-card-metrics-grid">
                          {table.headers.slice(1).map((header, cIdx) => (
                            <div key={header} className="m-metric">
                              <span className="m-metric-label">{header}</span>
                              <span className="m-metric-val">
                                {formatHistoryCell(row[cIdx + 1], header)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table View (> 820px) */}
                <div className="desktop-table-view table-scroll">
                  <table className="ledger-table">
                    <thead>
                      <tr>
                        {table.headers.map((header) => (
                          <th key={header}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {table.headers.map((header, cIdx) => (
                            <td
                              key={header}
                              className={cIdx === 0 ? 'font-bold' : 'mono'}
                            >
                              {formatHistoryCell(row[cIdx], header)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            <div className="history-footnote">
              {demoMode
                ? 'Synthetic sample values for demonstration only; they do not represent a real person or spreadsheet.'
                : 'Values are synced directly from your Google Sheet or local Excel workbook.'}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
