import {
  Briefcase,
  Calendar,
  Calculator,
  Lock,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { fmtDollar } from '../constants'
import type { ComputedCareerReport } from '../engine/career'
import type {
  CareerPlanYearKey,
  CareerSettings,
  ReplacementMode,
} from '../types'

interface CareerViewProps {
  isUnlocked: boolean
  demoMode: boolean
  career: CareerSettings
  report: ComputedCareerReport
  isFetchingStock: boolean
  onUpdateCareer: (partial: Partial<CareerSettings>) => void
  onSelectPlanYear: (year: CareerPlanYearKey) => void
  onRefreshStockPrice: () => void
  onOpenKeyModal: () => void
}

type CareerSubTab = 'comp' | 'vesting' | 'taxes' | 'safety'

export function CareerView({
  isUnlocked,
  demoMode,
  career,
  report,
  isFetchingStock,
  onUpdateCareer,
  onSelectPlanYear,
  onRefreshStockPrice,
  onOpenKeyModal,
}: CareerViewProps) {
  const [subTab, setSubTab] = useState<CareerSubTab>('comp')
  const [njUiWeekly, setNjUiWeekly] = useState(854)
  const [njUiWeeks, setNjUiWeeks] = useState(26)

  const mask = (text: string) => (isUnlocked ? text : '$---,---')

  return (
    <div className="view-stack">
      {/* Sub-view Navigation Tabs */}
      <div className="section-head compact-nav">
        <div className="view-pill-tabs">
          <button
            type="button"
            className={`pill-tab ${subTab === 'comp' ? 'active' : ''}`}
            onClick={() => setSubTab('comp')}
          >
            <Briefcase size={12} />
            <span>Compensation (2027–2030)</span>
          </button>
          {!demoMode && (
            <button
              type="button"
              className={`pill-tab ${subTab === 'vesting' ? 'active' : ''}`}
              onClick={() => setSubTab('vesting')}
            >
              <Calendar size={12} />
              <span>Vesting Schedule</span>
            </button>
          )}
          <button
            type="button"
            className={`pill-tab ${subTab === 'taxes' ? 'active' : ''}`}
            onClick={() => setSubTab('taxes')}
          >
            <Calculator size={12} />
            <span>W-2 Taxes &amp; Bridge</span>
          </button>
          <button
            type="button"
            className={`pill-tab ${subTab === 'safety' ? 'active' : ''}`}
            onClick={() => setSubTab('safety')}
          >
            <ShieldAlert size={12} />
            <span>Safety Net &amp; Runway</span>
          </button>
        </div>

        {!demoMode && (
          <div className="inline-quote-tag">
            <span>PYPL:</span>
            <strong>{isUnlocked ? `$${career.stockPrice.toFixed(2)}` : '$--.--'}</strong>
            <button
              type="button"
              className="icon-mini-btn"
              onClick={onRefreshStockPrice}
              disabled={isFetchingStock}
              title="Refresh PayPal stock quote"
            >
              <RefreshCw size={11} className={isFetchingStock ? 'spin' : ''} />
            </button>
          </div>
        )}
      </div>

      {!isUnlocked && (
        <div className="empty-prompt">
          <Lock size={18} className="text-accent" />
          <p>Career compensation &amp; vesting figures are locked. Enter your secret key or load sample data.</p>
          <button type="button" className="btn btn-primary" onClick={onOpenKeyModal}>
            Unlock Dashboard
          </button>
        </div>
      )}

      {/* 1. MULTI-YEAR TOTAL COMPENSATION */}
      {subTab === 'comp' && (
        <div className="section-panel">
          <div className="section-head">
            <div className="section-title-wrap">
              <Briefcase size={15} className="text-accent" />
              <h2>Multi-Year Total Comp Projections (2027–2030)</h2>
            </div>
            <div className="pill-group">
              <span className="mono-sub">Base Merit: +{career.baseInc}% / yr</span>
            </div>
          </div>

          {/* Quick Assumptions */}
          <div className="compact-inputs-row">
            <div className="compact-field">
              <label>Merit Base Inc %</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                disabled={!isUnlocked}
                value={career.baseInc}
                onChange={(e) => onUpdateCareer({ baseInc: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>AIP Indiv Mod %</label>
              <input
                type="number"
                step="5"
                min="0"
                max="250"
                disabled={!isUnlocked}
                value={career.indMod}
                onChange={(e) => onUpdateCareer({ indMod: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>AIP Company Mod %</label>
              <input
                type="number"
                step="5"
                min="0"
                max="250"
                disabled={!isUnlocked}
                value={career.coMod}
                onChange={(e) => onUpdateCareer({ coMod: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>Stock Price ($)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                disabled={!isUnlocked}
                value={career.stockPrice}
                onChange={(e) => onUpdateCareer({ stockPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Mobile Cards (<= 820px) */}
          <div className="mobile-cards-view">
            {report.multiYearList.map((col) => (
              <div key={col.year} className="m-card">
                <div className="m-card-head">
                  <div>
                    <div className="m-card-title">{col.year} Comp</div>
                    <div className="m-card-sub">{col.cashStatus} · {col.cashNext}</div>
                  </div>
                  <div className="m-card-primary-val text-positive">
                    {mask(fmtDollar(col.trueComp))}
                  </div>
                </div>
                <div className="m-card-metrics-grid">
                  <div className="m-metric">
                    <span className="m-metric-label">Base Salary</span>
                    <span className="m-metric-val">{mask(fmtDollar(col.base))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">AIP Bonus</span>
                    <span className="m-metric-val">{mask(fmtDollar(col.bonus))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Active Cash</span>
                    <span className="m-metric-val">{mask(fmtDollar(col.activeCash))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Future Cash (Est.)</span>
                    <span className="m-metric-val text-accent">{mask(fmtDollar(col.futureCash))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Total Cash</span>
                    <span className="m-metric-val text-accent">{mask(fmtDollar(col.trueCash))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Active RSUs</span>
                    <span className="m-metric-val">
                      {isUnlocked ? `${fmtDollar(col.activeEq)} (${col.activeShares} sh)` : '$---'}
                    </span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Future RSUs (Est.)</span>
                    <span className="m-metric-val">
                      {isUnlocked ? `${fmtDollar(col.futureEq)} (${col.futureShares} sh)` : '$---'}
                    </span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Total Equity (RSUs)</span>
                    <span className="m-metric-val text-accent">
                      {isUnlocked ? `${fmtDollar(col.totEq)} (${col.totalShares} sh)` : '$---,---'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (> 820px) */}
          <div className="desktop-table-view table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>2027</th>
                  <th>2028</th>
                  <th>2029</th>
                  <th>2030</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Base Salary</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">{mask(fmtDollar(c.base))}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>AIP Bonus (10% Target)</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">{mask(fmtDollar(c.bonus))}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Active Cash Awards</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">{mask(fmtDollar(c.activeCash))}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Future Cash Awards (Est.)</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono text-accent">{mask(fmtDollar(c.futureCash))}</td>
                  ))}
                </tr>
                <tr className="row-tint">
                  <td><strong>Total Cash (Base + AIP + Cash Awards)</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono font-bold">{mask(fmtDollar(c.trueCash))}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Active RSU Equity</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      {isUnlocked ? `${fmtDollar(c.activeEq)} (${c.activeShares} sh)` : '$---,---'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Future RSU Equity (Est.)</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono text-accent">
                      {isUnlocked ? `${fmtDollar(c.futureEq)} (${c.futureShares} sh)` : '$---,---'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Total RSU Equity Vesting</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono font-bold">
                      {isUnlocked ? `${fmtDollar(c.totEq)} (${c.totalShares} sh)` : '$---,---'}
                    </td>
                  ))}
                </tr>
                <tr className="row-tint">
                  <td><strong>Total W-2 Compensation</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono font-bold text-positive">{mask(fmtDollar(c.trueComp))}</td>
                  ))}
                </tr>
                <tr>
                  <td><strong>Status / Next Vest</strong></td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="cell-sub">
                      <div>{c.cashStatus}</div>
                      <div>{c.cashNext}</div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. UNIFIED VESTING SCHEDULE */}
      {subTab === 'vesting' && !demoMode && (
        <div className="section-panel">
          <div className="section-head">
            <div className="section-title-wrap">
              <Calendar size={15} className="text-accent" />
              <h2>16-Quarter Unified Vesting Schedule (2027–2030)</h2>
            </div>
            <span className="section-meta-pill">
              {isUnlocked ? `${report.vestingRows.length} QUARTERS` : 'LOCKED'}
            </span>
          </div>

          {/* Future Grant Awards Simulator (2027–2029) */}
          <div className="compact-inputs-row" style={{ marginBottom: 14 }}>
            <div className="compact-field">
              <label>2027 Future Award ($)</label>
              <input
                type="number"
                step="5000"
                min="0"
                disabled={!isUnlocked}
                value={career.future2027}
                onChange={(e) => onUpdateCareer({ future2027: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>2027 Grant Price ($)</label>
              <input
                type="number"
                step="1"
                min="1"
                disabled={!isUnlocked}
                value={career.price2027}
                onChange={(e) => onUpdateCareer({ price2027: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>2028 Future Award ($)</label>
              <input
                type="number"
                step="5000"
                min="0"
                disabled={!isUnlocked}
                value={career.future2028}
                onChange={(e) => onUpdateCareer({ future2028: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>2028 Grant Price ($)</label>
              <input
                type="number"
                step="1"
                min="1"
                disabled={!isUnlocked}
                value={career.price2028}
                onChange={(e) => onUpdateCareer({ price2028: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>2029 Future Award ($)</label>
              <input
                type="number"
                step="5000"
                min="0"
                disabled={!isUnlocked}
                value={career.future2029}
                onChange={(e) => onUpdateCareer({ future2029: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>2029 Grant Price ($)</label>
              <input
                type="number"
                step="1"
                min="1"
                disabled={!isUnlocked}
                value={career.price2029}
                onChange={(e) => onUpdateCareer({ price2029: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* 4 Summary Pills */}
          <div className="telemetry-bar">
            <div className="telemetry-cell">
              <span className="telemetry-label">TOTAL CASH AWARDS (2027–2030)</span>
              <div className="telemetry-value text-accent">{mask(fmtDollar(report.totalCashVal))}</div>
              <span className="telemetry-sub">
                {isUnlocked ? `${report.vestingRows.length} payroll installments` : 'LOCKED'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">TOTAL RSU EQUITY (2027–2030)</span>
              <div className="telemetry-value text-accent">
                {isUnlocked ? `${report.totalShares.toLocaleString()} shares` : '---- shares'}
              </div>
              <span className="telemetry-sub">
                {isUnlocked ? `${fmtDollar(report.totalStockVal)} @ $${career.stockPrice.toFixed(2)}/sh` : 'LOCKED'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">COMBINED 4-YR VESTING</span>
              <div className="telemetry-value text-positive">{mask(fmtDollar(report.totalCombined))}</div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `Cash ($${(report.totalCashVal / 1000).toFixed(1)}k) + Stock ($${(report.totalStockVal / 1000).toFixed(1)}k)`
                  : 'LOCKED'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">MARCH 1, 2027 CLIFF PAYOUT</span>
              <div className="telemetry-value">{mask(fmtDollar(report.nextDayVal))}</div>
              <span className="telemetry-sub">Major 1/3 Cliff + AIP Shares</span>
            </div>
          </div>

          {/* Annual Vesting Breakdown Strip */}
          <div className="telemetry-bar" style={{ marginTop: 10 }}>
            {([2027, 2028, 2029, 2030] as const).map((yr) => {
              const av = report.annualVestingByYear[yr]
              return (
                <div key={yr} className="telemetry-cell">
                  <span className="telemetry-label">{yr} COMBINED VESTING</span>
                  <div className="telemetry-value">{mask(fmtDollar(av.total))}</div>
                  <span className="telemetry-sub">
                    {isUnlocked
                      ? `Cash: ${fmtDollar(av.cash)} · Stock: ${fmtDollar(av.stock)} (${av.shares} sh)`
                      : 'Cash: $--- · Stock: $---'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* 2027-2029 Future Award Formula Breakdown */}
          <div className="telemetry-bar" style={{ marginTop: 10, marginBottom: 14 }}>
            <div className="telemetry-cell">
              <span className="telemetry-label">FUTURE GRANTS (50% CASH / 50% STOCK)</span>
              <div className="telemetry-value text-accent">
                {mask(fmtDollar(report.simAwardSplit.cashPortion + report.simAwardSplit.stockPortion))}
              </div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `${fmtDollar(report.simAwardSplit.cashPortion)} Cash · ${report.simAwardSplit.totalShares.toLocaleString()} RSUs`
                  : '---'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">2028 EST. FUTURE VEST</span>
              <div className="telemetry-value">{mask(fmtDollar(report.simAwardSplit.vest2028Total))}</div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `Cash: ${fmtDollar(report.simAwardSplit.vest2028Cash)} · Stock: ${fmtDollar(report.simAwardSplit.vest2028Stock)}`
                  : '---'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">2029 EST. FUTURE VEST</span>
              <div className="telemetry-value">{mask(fmtDollar(report.simAwardSplit.vest2029Total))}</div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `From '27: ${fmtDollar(report.simAwardSplit.vest2029From27)} · '28: ${fmtDollar(report.simAwardSplit.vest2029From28)}`
                  : '---'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">2030 EST. FUTURE VEST</span>
              <div className="telemetry-value">{mask(fmtDollar(report.simAwardSplit.vest2030Total))}</div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `'27: ${fmtDollar(report.simAwardSplit.vest2030From27)} · '28: ${fmtDollar(report.simAwardSplit.vest2030From28)} · '29: ${fmtDollar(report.simAwardSplit.vest2030From29)}`
                  : '---'}
              </span>
            </div>
          </div>

          {isUnlocked && (
            <>
              {/* Mobile Cards (<= 820px) */}
              <div className="mobile-cards-view">
                {report.vestingRows.map((row) => (
                  <div key={row.date} className="m-card">
                    <div className="m-card-head">
                      <div>
                        <div className="m-card-title">{row.date}</div>
                        <div className="m-card-sub">{row.note}</div>
                      </div>
                      <div className="m-card-primary-val text-positive">{fmtDollar(row.dayTotal)}</div>
                    </div>
                    <div className="m-card-metrics-grid">
                      <div className="m-metric">
                        <span className="m-metric-label">Cash Vest</span>
                        <span className="m-metric-val">{fmtDollar(row.cash)}</span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">RSU Shares</span>
                        <span className="m-metric-val">{row.shares} sh ({fmtDollar(row.stockVal)})</span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">Remaining Unvested</span>
                        <span className="m-metric-val">{fmtDollar(row.remainingVal)}</span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">Plan Year</span>
                        <span className="m-metric-val">{row.year}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (> 820px) */}
              <div className="desktop-table-view table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vesting Date</th>
                      <th>Cash Award</th>
                      <th>RSU Shares</th>
                      <th>Day Total</th>
                      <th>Remaining</th>
                      <th>Tranche Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.vestingRows.map((row) => (
                      <tr key={row.date}>
                        <td><strong>{row.date}</strong></td>
                        <td className="mono">{fmtDollar(row.cash)}</td>
                        <td className="mono">{row.shares} sh <span className="cell-sub">({fmtDollar(row.stockVal)})</span></td>
                        <td className="mono font-bold text-positive">{fmtDollar(row.dayTotal)}</td>
                        <td className="mono">{fmtDollar(row.remainingVal)}</td>
                        <td className="cell-sub">{row.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. W-2 TAXES & FREEDOM BRIDGE */}
      {subTab === 'taxes' && (
        <div className="section-panel">
          <div className="section-head">
            <div className="section-title-wrap">
              <Calculator size={15} className="text-accent" />
              <h2>W-2 Tax Engine &amp; Freedom Bridge</h2>
            </div>
            {/* Year Selector Pills */}
            <div className="pill-group">
              {(['2027', '2028', '2029', '2030', 'custom'] as const).map((yr) => {
                const col =
                  yr !== 'custom'
                    ? report.multiYearByYear[Number(yr) as 2027 | 2028 | 2029 | 2030]
                    : null
                return (
                  <button
                    key={yr}
                    type="button"
                    className={`pill-choice ${career.selectedYear === yr ? 'active' : ''}`}
                    onClick={() => onSelectPlanYear(yr)}
                  >
                    {yr === 'custom'
                      ? 'Custom'
                      : isUnlocked && col
                        ? `${yr} (+$${(col.cashReward / 1000).toFixed(1)}k)`
                        : yr}
                  </button>
                )
              })}
            </div>
          </div>

          {/* W-2 Compensation & Pre-Tax Deductions Editor */}
          <div className="compact-inputs-row">
            <div className="compact-field">
              <label>Base Salary ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={1000}
                disabled={!isUnlocked}
                value={isUnlocked ? report.activeBaseSalary : '000000'}
                onChange={(e) =>
                  onUpdateCareer({
                    selectedYear: 'custom',
                    baseSalary: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="compact-field">
              <label>AIP Bonus ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={500}
                disabled={!isUnlocked}
                value={isUnlocked ? report.activeBonus : '00000'}
                onChange={(e) =>
                  onUpdateCareer({
                    selectedYear: 'custom',
                    bonus: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="compact-field">
              <label>Cash Grant Vesting ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={500}
                disabled={!isUnlocked}
                value={isUnlocked ? report.activeCashReward : '00000'}
                onChange={(e) =>
                  onUpdateCareer({
                    selectedYear: 'custom',
                    cashReward: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="compact-field">
              <label>RSU Vesting ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={1000}
                disabled={!isUnlocked}
                value={isUnlocked ? report.activeRsuVesting : '00000'}
                onChange={(e) =>
                  onUpdateCareer({
                    selectedYear: 'custom',
                    rsuVesting: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="compact-field">
              <label>Pre-Tax 401(k) ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={500}
                disabled={!isUnlocked}
                value={isUnlocked ? career.k401 : '00000'}
                onChange={(e) => onUpdateCareer({ k401: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>Pre-Tax HSA ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={100}
                disabled={!isUnlocked}
                value={isUnlocked ? career.hsaPreTax : '0000'}
                onChange={(e) => onUpdateCareer({ hsaPreTax: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>Pre-Tax Health ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={100}
                disabled={!isUnlocked}
                value={isUnlocked ? career.healthPreTax : '0000'}
                onChange={(e) => onUpdateCareer({ healthPreTax: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>Employer Match ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={250}
                disabled={!isUnlocked}
                value={isUnlocked ? report.activeMatch : '0000'}
                onChange={(e) =>
                  onUpdateCareer({
                    selectedYear: 'custom',
                    employerMatch: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* 5 Primary KPIs */}
          <div className="telemetry-bar five-cols">
            <div className="telemetry-cell">
              <span className="telemetry-label">W-2 GROSS EARNINGS</span>
              <div className="telemetry-value">{mask(fmtDollar(report.earnedGross))}</div>
              <span className="telemetry-sub">
                {isUnlocked ? `Base + AIP + Cash + RSUs` : '---'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">PRE-TAX SHIELDS</span>
              <div className="telemetry-value text-accent">{mask(fmtDollar(report.preTaxDeductions))}</div>
              <span className="telemetry-sub">
                {isUnlocked ? `401k + HSA + Health` : '---'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">TOTAL TAXES ({report.effectiveTaxRate.toFixed(1)}%)</span>
              <div className="telemetry-value text-negative">{mask(fmtDollar(report.totalTaxes))}</div>
              <span className="telemetry-sub">Fed + FICA + NJ-1040</span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">NET TAKE-HOME</span>
              <div className="telemetry-value text-positive">{mask(fmtDollar(report.netTakeHomeAnnual))}</div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `${fmtDollar(report.monthlyTakeHome)}/mo (${fmtDollar(report.biWeeklyTakeHome)}/pay)`
                  : '---'}
              </span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">TOTAL WEALTH RETAINED</span>
              <div className="telemetry-value text-positive">{mask(fmtDollar(report.totalWealthRetained))}</div>
              <span className="telemetry-sub">
                {isUnlocked
                  ? `Net + $${Math.round((report.activeK401 + report.activeHsa + report.activeMatch) / 1000)}k (401k/HSA/Match)`
                  : '---'}
              </span>
            </div>
          </div>

          {/* Freedom Bridge Mini-Panel */}
          <div className="compact-bridge-box">
            <div className="bridge-header-row">
              <div className="bridge-title-group">
                <TrendingUp size={14} className="text-accent" />
                <span className="font-bold">Compensation Replacement Bridge</span>
              </div>
              <div className="pill-group">
                {(
                  [
                    { id: 'cash', label: 'Cash' },
                    { id: 'base', label: 'Base' },
                    { id: 'total', label: 'Total' },
                  ] as { id: ReplacementMode; label: string }[]
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`pill-choice ${career.replaceMode === m.id ? 'active' : ''}`}
                    onClick={() => onUpdateCareer({ replaceMode: m.id })}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="m-progress-track" style={{ margin: '8px 0' }}>
              <div
                className="m-progress-fill achieved"
                style={{ width: `${Math.min(100, Math.max(2, report.replacePct)).toFixed(1)}%` }}
              />
            </div>

            <div className="bridge-metrics-line mono">
              <span>Target Net: <strong>{isUnlocked ? `${fmtDollar(report.monthlyJobTakeHome)}/mo` : '$---'}</strong></span>
              <span>Passive SWR: <strong className="text-positive">{isUnlocked ? `${fmtDollar(report.monthlyPassive)}/mo` : '$---'}</strong></span>
              <span>Replaced: <strong className="text-accent">{isUnlocked ? `${report.replacePct.toFixed(1)}%` : '---%'}</strong></span>
              <span>ETA: <strong>{isUnlocked ? report.timelineText : '---'}</strong></span>
            </div>
          </div>

          {/* Tax Breakdown Mobile Cards + Desktop Table */}
          {isUnlocked && (
            <>
              <div className="mobile-cards-view" style={{ marginTop: 14 }}>
                {report.taxRows.map((r) => {
                  const sign = r.isDeduction ? '-' : ''
                  return (
                    <div key={r.name} className="m-card">
                      <div className="m-card-head">
                        <div>
                          <div className="m-card-title">{r.name}</div>
                          <div className="m-card-sub">{r.notes}</div>
                        </div>
                        <div className={`m-card-primary-val ${r.isDeduction ? 'text-negative' : 'text-positive'}`}>
                          {sign}{fmtDollar(r.annual)}
                        </div>
                      </div>
                      <div className="m-card-metrics-grid">
                        <div className="m-metric">
                          <span className="m-metric-label">Monthly</span>
                          <span className="m-metric-val">{sign}{fmtDollar(r.monthly)} / mo</span>
                        </div>
                        <div className="m-metric">
                          <span className="m-metric-label">% of W-2 Gross</span>
                          <span className="m-metric-val">{r.pctStr}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="desktop-table-view table-wrap" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Line Item</th>
                      <th>Annual</th>
                      <th>Monthly</th>
                      <th>% of Gross</th>
                      <th>Tax Rule</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.taxRows.map((r) => {
                      const sign = r.isDeduction ? '-' : ''
                      return (
                        <tr key={r.name}>
                          <td><strong>{r.name}</strong></td>
                          <td className="mono">{sign}{fmtDollar(r.annual)}</td>
                          <td className="mono">{sign}{fmtDollar(r.monthly)} / mo</td>
                          <td className="mono">{r.pctStr}</td>
                          <td className="cell-sub">{r.notes}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. SAFETY NET & RUNWAY */}
      {subTab === 'safety' && (
        <div className="section-panel">
          <div className="section-head">
            <div className="section-title-wrap">
              <ShieldAlert size={15} className="text-accent" />
              <h2>Severance &amp; NJ Unemployment Safety Net</h2>
            </div>
            <span className="section-meta-pill">ZERO ASSET DRAWDOWN</span>
          </div>

          <div className="telemetry-bar">
            <div className="telemetry-cell">
              <span className="telemetry-label">EST. NET SAFETY PACKAGE</span>
              <div className="telemetry-value text-accent">{mask(fmtDollar(report.netSafety))}</div>
              <span className="telemetry-sub">Gross: {mask(fmtDollar(report.grossSafety))}</span>
            </div>
            <div className="telemetry-cell">
              <span className="telemetry-label">ZERO-LIQUIDATION RUNWAY</span>
              <div className="telemetry-value text-positive">
                {isUnlocked ? `${report.runwayMonths.toFixed(1)} Months` : '--- Months'}
              </div>
              <span className="telemetry-sub">Based on ${report.monthlySpendForSafety.toLocaleString()}/mo spend</span>
            </div>
          </div>

          <div className="compact-inputs-row" style={{ marginTop: 14 }}>
            <div className="compact-field">
              <label>Severance (Wks)</label>
              <input
                type="number"
                min="0"
                max="52"
                disabled={!isUnlocked}
                value={career.severanceWeeks}
                onChange={(e) => onUpdateCareer({ severanceWeeks: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>Cliff Buffer ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step="1000"
                min="0"
                disabled={!isUnlocked}
                value={isUnlocked ? career.vestingBuffer : '0000'}
                onChange={(e) => onUpdateCareer({ vestingBuffer: Number(e.target.value) })}
              />
            </div>
            <div className="compact-field">
              <label>NJ UI $/wk</label>
              <input
                type="number"
                min="0"
                max="1500"
                disabled={!isUnlocked}
                value={njUiWeekly}
                onChange={(e) => setNjUiWeekly(Number(e.target.value))}
              />
            </div>
            <div className="compact-field">
              <label>NJ UI Wks</label>
              <input
                type="number"
                min="0"
                max="52"
                disabled={!isUnlocked}
                value={njUiWeeks}
                onChange={(e) => setNjUiWeeks(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
