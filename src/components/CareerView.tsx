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
  CareerSectionFilter,
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
  const [sectionFilter, setSectionFilter] = useState<CareerSectionFilter>('all')
  const [njUiWeekly, setNjUiWeekly] = useState(854)
  const [njUiWeeks, setNjUiWeeks] = useState(26)

  const showVesting = !demoMode && (sectionFilter === 'all' || sectionFilter === 'vesting')
  const showTaxes = sectionFilter === 'all' || sectionFilter === 'taxes'

  const mask = (text: string) => (isUnlocked ? text : '$---,---')

  return (
    <div className="career-stack">
      {/* Sub-navigation filter pills */}
      <div className="subnav-bar">
        <div className="chips-row">
          <button
            type="button"
            className={`chip ${sectionFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSectionFilter('all')}
          >
            All Sections
          </button>
          {!demoMode && (
            <button
              type="button"
              className={`chip ${sectionFilter === 'vesting' ? 'active' : ''}`}
              onClick={() => setSectionFilter('vesting')}
            >
              Total Comp &amp; Vesting (2027–2030)
            </button>
          )}
          <button
            type="button"
            className={`chip ${sectionFilter === 'taxes' ? 'active' : ''}`}
            onClick={() => setSectionFilter('taxes')}
          >
            W-2 Taxes &amp; Safety Net
          </button>
        </div>

        <div className="stock-quote-pill">
          <span>PYPL Valuation:</span>
          <strong>
            {isUnlocked ? `$${career.stockPrice.toFixed(2)}` : '$--.--'}
          </strong>
          <button
            type="button"
            className="pill-btn small"
            onClick={onRefreshStockPrice}
            disabled={isFetchingStock}
          >
            <RefreshCw size={11} className={isFetchingStock ? 'spin' : ''} />
            <span>Quote</span>
          </button>
        </div>
      </div>

      {!isUnlocked && (
        <div className="locked-empty-state compact">
          <div className="empty-lock-circle">
            <Lock size={18} />
          </div>
          <h3>Career Compensation &amp; Vesting Schedule Locked</h3>
          <p>
            Multi-year salary, AIP bonus, cash grants, RSU vesting, and W-2 tax shields are masked
            until unlocked.
          </p>
          <button type="button" className="btn btn-primary" onClick={onOpenKeyModal}>
            Unlock With Secret Key
          </button>
        </div>
      )}

      {/* SECTION 1: MULTI-YEAR COMPENSATION PROJECTION (2027-2030) */}
      {showVesting && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-group">
                <Briefcase size={16} className="text-accent" />
                <h2 className="panel-title">
                  Multi-Year Total Compensation Projection (2027–2030)
                </h2>
              </div>
              <p className="panel-subtitle">
                Base salary merit compounding, 10% AIP target bonus modifiers, active cash/RSU
                grants, and future annual awards (50% Cash / 50% Stock)
              </p>
            </div>
          </div>

          {/* Assumptions & Future Grant Inputs */}
          <div className="comp-inputs-grid">
            <div className="input-card">
              <label>Annual Merit Base Inc (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                disabled={!isUnlocked}
                value={career.baseInc}
                onChange={(e) => onUpdateCareer({ baseInc: Number(e.target.value) })}
              />
              <span className="input-card-sub">Compounds over $186,773 ('26 base)</span>
            </div>

            <div className="input-card">
              <label>AIP Indiv / Co Mod (%)</label>
              <div className="dual-input-row">
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="250"
                  disabled={!isUnlocked}
                  value={career.indMod}
                  onChange={(e) => onUpdateCareer({ indMod: Number(e.target.value) })}
                  title="Individual Performance Modifier %"
                />
                <input
                  type="number"
                  step="5"
                  min="0"
                  max="250"
                  disabled={!isUnlocked}
                  value={career.coMod}
                  onChange={(e) => onUpdateCareer({ coMod: Number(e.target.value) })}
                  title="Company Performance Modifier %"
                />
              </div>
              <span className="input-card-sub">10% Target × Indiv% × Co%</span>
            </div>

            <div className="input-card">
              <label>Stock Price ($ / sh)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                disabled={!isUnlocked}
                value={career.stockPrice}
                onChange={(e) => onUpdateCareer({ stockPrice: Number(e.target.value) })}
              />
              <span className="input-card-sub">Values all active &amp; future RSUs</span>
            </div>

            <div className="input-card">
              <label>2027 Future Award ($)</label>
              <div className="dual-input-row">
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step="5000"
                  min="0"
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.future2027 : '0000'}
                  onChange={(e) => onUpdateCareer({ future2027: Number(e.target.value) })}
                />
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step="1"
                  min="1"
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.price2027 : '00'}
                  onChange={(e) => onUpdateCareer({ price2027: Number(e.target.value) })}
                  title="2027 Grant Conversion Price"
                />
              </div>
              <span className="input-card-sub">50% Cash / 50% Stock @ Grant $</span>
            </div>

            <div className="input-card">
              <label>2028 Future Award ($)</label>
              <div className="dual-input-row">
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step="5000"
                  min="0"
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.future2028 : '0000'}
                  onChange={(e) => onUpdateCareer({ future2028: Number(e.target.value) })}
                />
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step="1"
                  min="1"
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.price2028 : '00'}
                  onChange={(e) => onUpdateCareer({ price2028: Number(e.target.value) })}
                  title="2028 Grant Conversion Price"
                />
              </div>
              <span className="input-card-sub">Vests '29 (7/12) &amp; '30 (4/12)</span>
            </div>

            <div className="input-card">
              <label>2029 Future Award ($)</label>
              <div className="dual-input-row">
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step="5000"
                  min="0"
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.future2029 : '0000'}
                  onChange={(e) => onUpdateCareer({ future2029: Number(e.target.value) })}
                />
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step="1"
                  min="1"
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.price2029 : '00'}
                  onChange={(e) => onUpdateCareer({ price2029: Number(e.target.value) })}
                  title="2029 Grant Conversion Price"
                />
              </div>
              <span className="input-card-sub">Vests '30 (7/12 cliff+qtrs)</span>
            </div>
          </div>

          {/* Mobile-First Year Cards View (<= 820px) */}
          <div className="mobile-cards-view">
            {report.multiYearList.map((col) => (
              <div key={col.year} className="m-card">
                <div className="m-card-head">
                  <div>
                    <div className="m-card-title">{col.year} Compensation</div>
                    <div className="m-card-sub">{col.cashStatus}</div>
                  </div>
                  <div className="m-card-primary-val accent-green">
                    {mask(fmtDollar(col.trueComp))}
                  </div>
                </div>
                <div className="m-card-metrics-grid">
                  <div className="m-metric">
                    <span className="m-metric-label">Base Salary</span>
                    <span className="m-metric-val">{mask(fmtDollar(col.base))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">AIP Bonus (10%)</span>
                    <span className="m-metric-val">{mask(fmtDollar(col.bonus))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Cash Awards</span>
                    <span className="m-metric-val accent-amber">
                      {mask(`+${fmtDollar(col.cashReward)}`)}
                    </span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Total Cash</span>
                    <span className="m-metric-val">{mask(fmtDollar(col.trueCash))}</span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Active RSUs</span>
                    <span className="m-metric-val">
                      {isUnlocked
                        ? `${fmtDollar(col.activeEq)} (${col.activeShares} sh)`
                        : '$---,---'}
                    </span>
                  </div>
                  <div className="m-metric">
                    <span className="m-metric-label">Total Equity</span>
                    <span className="m-metric-val accent-blue">
                      {isUnlocked
                        ? `${fmtDollar(col.totEq)} (${col.totalShares} sh)`
                        : '$---,---'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (> 820px) */}
          <div className="desktop-table-view table-scroll">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Compensation Component</th>
                  <th>2027</th>
                  <th>2028</th>
                  <th>2029</th>
                  <th>2030</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Base Annual Salary</strong>
                    <div className="cell-sub">+{career.baseInc}% annual merit compounding</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      {mask(fmtDollar(c.base))}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>AIP Annual Bonus (10% Target)</strong>
                    <div className="cell-sub">
                      Indiv {career.indMod}% × Co {career.coMod}% modifier
                    </div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      {mask(fmtDollar(c.bonus))}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Active Long-Term Cash Grant</strong>
                    <div className="cell-sub">Scheduled quarterly payroll cash vests</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono accent-amber">
                      {mask(c.activeCash > 0 ? `+${fmtDollar(c.activeCash)}` : '$0')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Future Cash Awards (50% Cash Split)</strong>
                    <div className="cell-sub">From 2027–2029 annual awards</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono accent-amber">
                      {mask(c.futureCash > 0 ? `+${fmtDollar(c.futureCash)}` : '$0')}
                    </td>
                  ))}
                </tr>
                <tr className="row-highlight-amber">
                  <td>
                    <strong>Total Cash Compensation</strong>
                    <div className="cell-sub">Base + AIP Bonus + All Cash Grants</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      <strong>{mask(fmtDollar(c.trueCash))}</strong>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Active RSU Equity Vesting</strong>
                    <div className="cell-sub">
                      805 sh ('27) · 349 sh ('28) · 73 sh ('29) @ ${career.stockPrice.toFixed(2)}
                    </div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      {isUnlocked ? (
                        <>
                          {fmtDollar(c.activeEq)}
                          <div className="cell-sub">{c.activeShares} shares</div>
                        </>
                      ) : (
                        '$---,---'
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <strong>Future Stock Awards (50% RSU Split)</strong>
                    <div className="cell-sub">Valued at ${career.stockPrice.toFixed(2)}/sh</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono accent-blue">
                      {isUnlocked ? (
                        <>
                          {c.futureEq > 0 ? `+${fmtDollar(c.futureEq)}` : '$0'}
                          <div className="cell-sub">{c.futureShares} shares</div>
                        </>
                      ) : (
                        '$---,---'
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="row-highlight-blue">
                  <td>
                    <strong>Total Equity Vesting (RSUs)</strong>
                    <div className="cell-sub">Active + Future RSU shares vesting</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      <strong>{mask(fmtDollar(c.totEq))}</strong>
                    </td>
                  ))}
                </tr>
                <tr className="row-highlight-green">
                  <td>
                    <strong>Total Annual Compensation (W-2 Gross)</strong>
                    <div className="cell-sub">Total Cash + Total Equity Vesting</div>
                  </td>
                  {report.multiYearList.map((c) => (
                    <td key={c.year} className="mono">
                      <strong>{mask(fmtDollar(c.trueComp))}</strong>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: UNIFIED ACTIVE & FUTURE VESTING SCHEDULE (2027-2030) */}
      {showVesting && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-group">
                <Calendar size={16} className="text-accent" />
                <h2 className="panel-title">
                  Unified Active &amp; Future Vesting Schedule (2027–2030)
                </h2>
              </div>
              <p className="panel-subtitle">
                Every quarterly Cash Grant and RSU Stock vesting event combined chronologically
              </p>
            </div>
            <span className="status-tag">
              {isUnlocked ? `${report.vestingRows.length} VESTING EVENTS` : 'LOCKED'}
            </span>
          </div>

          {/* 4 Top Vesting Summary Cards */}
          <div className="telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-label">TOTAL CASH AWARDS (2027–2030)</div>
              <div className="telemetry-value accent-amber">
                {mask(fmtDollar(report.totalCashVal))}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `${report.vestingRows.length} payroll installments`
                  : 'LOCKED'}
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">TOTAL RSU EQUITY (2027–2030)</div>
              <div className="telemetry-value accent-blue">
                {isUnlocked ? `${report.totalShares.toLocaleString()} shares` : '---- shares'}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `${fmtDollar(report.totalStockVal)} @ $${career.stockPrice.toFixed(2)}/sh`
                  : 'LOCKED'}
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">COMBINED 4-YR VESTING</div>
              <div className="telemetry-value accent-green">
                {mask(fmtDollar(report.totalCombined))}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `Cash ($${(report.totalCashVal / 1000).toFixed(1)}k) + Stock ($${(report.totalStockVal / 1000).toFixed(1)}k)`
                  : 'LOCKED'}
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">MARCH 1, 2027 CLIFF PAYOUT</div>
              <div className="telemetry-value accent-purple">
                {mask(fmtDollar(report.nextDayVal))}
              </div>
              <div className="telemetry-sub">Major 1/3 Cliff + AIP Shares</div>
            </div>
          </div>

          {/* Annual Vesting Breakdown Strip */}
          <div className="telemetry-grid formulas-strip">
            {([2027, 2028, 2029, 2030] as const).map((yr) => {
              const av = report.annualVestingByYear[yr]
              return (
                <div key={yr} className="telemetry-card subtle">
                  <div className="telemetry-label">{yr} COMBINED VESTING</div>
                  <div className="telemetry-value small">{mask(fmtDollar(av.total))}</div>
                  <div className="telemetry-sub">
                    {isUnlocked
                      ? `Cash: ${fmtDollar(av.cash)} · Stock: ${fmtDollar(av.stock)} (${av.shares} sh)`
                      : 'Cash: $--- · Stock: $---'}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mobile-First Vesting Cards View (<= 820px) */}
          {isUnlocked && (
            <div className="mobile-cards-view">
              {report.vestingRows.map((row) => {
                const isMajor = row.shares >= 400 || row.dayTotal >= 25000
                return (
                  <div
                    key={row.date}
                    className={`m-card ${isMajor ? 'achieved-border' : ''}`}
                  >
                    <div className="m-card-head">
                      <div>
                        <div className="m-card-title">{row.date}</div>
                        <div className="m-card-sub">{row.note}</div>
                      </div>
                      <div className="m-card-primary-val accent-green">
                        {fmtDollar(row.dayTotal)}
                      </div>
                    </div>
                    <div className="m-card-metrics-grid">
                      <div className="m-metric">
                        <span className="m-metric-label">Cash Vest</span>
                        <span className="m-metric-val accent-amber">{fmtDollar(row.cash)}</span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">RSU Shares</span>
                        <span className="m-metric-val accent-blue">
                          {row.shares} sh ({fmtDollar(row.stockVal)})
                        </span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">Unvested Rem.</span>
                        <span className="m-metric-val">{fmtDollar(row.remainingVal)}</span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">Plan Year</span>
                        <span className="m-metric-val">{row.year}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Desktop Vesting Table (> 820px) */}
          {isUnlocked && (
            <div className="desktop-table-view table-scroll">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Vesting Date</th>
                    <th>Cash Award</th>
                    <th>RSU Shares (Value)</th>
                    <th>Day Total</th>
                    <th>Remaining Unvested</th>
                    <th>Grant Tranche Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.vestingRows.map((row) => {
                    const isMajor = row.shares >= 400 || row.dayTotal >= 25000
                    return (
                      <tr key={row.date} className={isMajor ? 'row-highlight-blue' : ''}>
                        <td>
                          <strong>{row.date}</strong>
                        </td>
                        <td className="mono accent-amber">{fmtDollar(row.cash)}</td>
                        <td className="mono accent-blue">
                          {row.shares.toLocaleString()} sh{' '}
                          <span className="cell-inline-muted">({fmtDollar(row.stockVal)})</span>
                        </td>
                        <td className="mono accent-green">
                          <strong>{fmtDollar(row.dayTotal)}</strong>
                        </td>
                        <td className="mono">{fmtDollar(row.remainingVal)}</td>
                        <td className="cell-sub">
                          <span className="year-pill">{row.year}</span> {row.note}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: W-2 TAXES, FREEDOM REPLACEMENT BRIDGE & NJ UI SAFETY NET */}
      {showTaxes && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title-group">
                <Calculator size={16} className="text-accent" />
                <h2 className="panel-title">
                  W-2 Tax Engine, Job Replacement Bridge &amp; Safety Net
                </h2>
              </div>
              <p className="panel-subtitle">
                2027+ IRS Federal progressive brackets ($16,100 std deduction), FICA ($181,800 SS
                cap + Medicare surtax), and NJ-1040 state taxes
              </p>
            </div>

            {/* Plan Year Selector Chips */}
            <div className="chips-row">
              {(['2027', '2028', '2029', '2030', 'custom'] as const).map((yr) => {
                const isAct = career.selectedYear === yr
                const col =
                  yr !== 'custom'
                    ? report.multiYearByYear[Number(yr) as 2027 | 2028 | 2029 | 2030]
                    : null
                return (
                  <button
                    key={yr}
                    type="button"
                    className={`chip ${isAct ? 'active' : ''}`}
                    onClick={() => onSelectPlanYear(yr)}
                  >
                    {yr === 'custom'
                      ? 'Custom'
                      : isUnlocked && col
                        ? `${yr} (+Cash: $${(col.cashReward / 1000).toFixed(1)}k)`
                        : yr}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 5 Tax & Net Take-Home KPI Cards */}
          <div className="telemetry-grid five-cols">
            <div className="telemetry-card">
              <div className="telemetry-label">W-2 GROSS EARNINGS</div>
              <div className="telemetry-value accent-blue">
                {mask(fmtDollar(report.earnedGross))}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `Base + AIP + Cash + RSUs ($${Math.round(report.earnedGross / 1000)}k W-2)`
                  : 'Base + AIP + Cash + RSUs'}
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">PRE-TAX SHIELDS</div>
              <div className="telemetry-value accent-amber">
                {mask(fmtDollar(report.preTaxDeductions))}
              </div>
              <div className="telemetry-sub">401(k) + HSA + Cafeteria Health</div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">TOTAL TAXES (FED+FICA+NJ)</div>
              <div className="telemetry-value accent-rose">
                {mask(fmtDollar(report.totalTaxes))}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `Effective Tax Rate: ${report.effectiveTaxRate.toFixed(1)}%`
                  : 'Effective Tax Rate: ---%'}
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">NET TAKE-HOME</div>
              <div className="telemetry-value accent-green">
                {mask(fmtDollar(report.netTakeHomeAnnual))}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `${fmtDollar(report.monthlyTakeHome)}/mo (${fmtDollar(report.biWeeklyTakeHome)}/pay)`
                  : '$--- / month in hand'}
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-label">TOTAL WEALTH RETAINED</div>
              <div className="telemetry-value accent-purple">
                {mask(fmtDollar(report.totalWealthRetained))}
              </div>
              <div className="telemetry-sub">
                {isUnlocked
                  ? `Net + $${Math.round((report.activeK401 + report.activeHsa + report.activeMatch) / 1000)}k (401k/HSA/Match)`
                  : 'Net + 401(k) + HSA + Match'}
              </div>
            </div>
          </div>

          {/* Two-Column Bridge & Safety Net Cards */}
          <div className="dual-panel-grid">
            {/* Freedom Replacement Bridge */}
            <div className="subpanel">
              <div className="subpanel-head">
                <div className="panel-title-group">
                  <TrendingUp size={15} className="text-accent" />
                  <h3>Freedom Job Replacement Bridge</h3>
                </div>
                <div className="chips-row compact">
                  {(
                    [
                      { id: 'cash', label: 'Total Cash' },
                      { id: 'base', label: 'Base Only' },
                      { id: 'total', label: 'Total Comp' },
                    ] as { id: ReplacementMode; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={`chip ${career.replaceMode === m.id ? 'active' : ''}`}
                      onClick={() => onUpdateCareer({ replaceMode: m.id })}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bridge-stat-row">
                <div>
                  <div className="bridge-label">{report.bridgeDesc}</div>
                  <div className="bridge-sub">
                    Passive SWR income vs net after-tax paycheck
                  </div>
                </div>
                <div className="bridge-pct accent-green">
                  {isUnlocked ? `${report.replacePct.toFixed(1)}%` : '---%'}
                </div>
              </div>

              <div className="m-progress-track">
                <div
                  className="m-progress-fill achieved"
                  style={{
                    width: isUnlocked
                      ? `${Math.min(100, Math.max(2, report.replacePct)).toFixed(1)}%`
                      : '0%',
                  }}
                />
              </div>

              <div className="m-card-metrics-grid">
                <div className="m-metric">
                  <span className="m-metric-label">Target Net / Mo</span>
                  <span className="m-metric-val">
                    {isUnlocked ? `${fmtDollar(report.monthlyJobTakeHome)}/mo` : '$---/mo'}
                  </span>
                </div>
                <div className="m-metric">
                  <span className="m-metric-label">Safe Passive / Mo</span>
                  <span className="m-metric-val accent-green">
                    {isUnlocked ? `${fmtDollar(report.monthlyPassive)}/mo` : '$---/mo'}
                  </span>
                </div>
                <div className="m-metric">
                  <span className="m-metric-label">Monthly Gap</span>
                  <span className="m-metric-val accent-amber">
                    {!isUnlocked
                      ? '$---/mo'
                      : report.monthlyGap <= 0
                        ? '$0 (Surplus!)'
                        : `-${fmtDollar(report.monthlyGap)}/mo`}
                  </span>
                </div>
                <div className="m-metric">
                  <span className="m-metric-label">100% Replace ETA</span>
                  <span className="m-metric-val">
                    {isUnlocked ? report.timelineText : '---'}
                  </span>
                </div>
              </div>
            </div>

            {/* Severance, Layoff & NJ Unemployment Safety Net */}
            <div className="subpanel">
              <div className="subpanel-head">
                <div className="panel-title-group">
                  <ShieldAlert size={15} className="text-accent" />
                  <h3>Severance &amp; NJ Unemployment Safety Net</h3>
                </div>
                <span className="status-tag">ZERO ASSET DRAWDOWN</span>
              </div>

              <div className="bridge-stat-row">
                <div>
                  <div className="bridge-label">Zero-Liquidation Runway</div>
                  <div className="bridge-sub">
                    {isUnlocked
                      ? `Est. Net Package: ~${fmtDollar(report.netSafety)} (Gross: ${fmtDollar(report.grossSafety)})`
                      : 'Enter key to calculate runway'}
                  </div>
                </div>
                <div className="bridge-pct accent-amber">
                  {isUnlocked ? `${report.runwayMonths.toFixed(1)} Mos` : '--- Mos'}
                </div>
              </div>

              <div className="m-progress-track">
                <div
                  className="m-progress-fill"
                  style={{
                    width: isUnlocked
                      ? `${Math.min(100, (report.runwayMonths / 12) * 100).toFixed(1)}%`
                      : '0%',
                  }}
                />
              </div>

              <div className="safety-inputs-grid">
                <div className="mini-input">
                  <label>Severance Wks ({mask(fmtDollar(report.severancePay))})</label>
                  <input
                    type="number"
                    min={0}
                    max={52}
                    disabled={!isUnlocked}
                    value={career.severanceWeeks}
                    onChange={(e) =>
                      onUpdateCareer({ severanceWeeks: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="mini-input">
                  <label>Cliff Buffer ($)</label>
                  <input
                    type={isUnlocked ? 'number' : 'password'}
                    step={1000}
                    min={0}
                    disabled={!isUnlocked}
                    value={isUnlocked ? career.vestingBuffer : '0000'}
                    onChange={(e) =>
                      onUpdateCareer({ vestingBuffer: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="mini-input">
                  <label>NJ UI $/wk ({mask(fmtDollar(report.njUiTotal))})</label>
                  <div className="dual-input-row">
                    <input
                      type="number"
                      min={0}
                      max={1500}
                      disabled={!isUnlocked}
                      value={njUiWeekly}
                      onChange={(e) => setNjUiWeekly(Number(e.target.value))}
                    />
                    <input
                      type="number"
                      min={0}
                      max={52}
                      disabled={!isUnlocked}
                      value={njUiWeeks}
                      onChange={(e) => setNjUiWeeks(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* W-2 Compensation & Pre-Tax Deductions Editor */}
          <div className="comp-inputs-grid">
            <div className="input-card">
              <label>Base Annual Salary ($)</label>
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

            <div className="input-card">
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

            <div className="input-card">
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

            <div className="input-card">
              <label>RSU Equity Vesting ($)</label>
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

            <div className="input-card">
              <label>Pre-Tax 401(k) ($)</label>
              <input
                type={isUnlocked ? 'number' : 'password'}
                step={500}
                disabled={!isUnlocked}
                value={isUnlocked ? career.k401 : '00000'}
                onChange={(e) => onUpdateCareer({ k401: Number(e.target.value) })}
              />
            </div>

            <div className="input-card">
              <label>HSA + Health Pre-Tax ($)</label>
              <div className="dual-input-row">
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step={100}
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.hsaPreTax : '0000'}
                  onChange={(e) => onUpdateCareer({ hsaPreTax: Number(e.target.value) })}
                  title="Pre-Tax HSA Contribution"
                />
                <input
                  type={isUnlocked ? 'number' : 'password'}
                  step={100}
                  disabled={!isUnlocked}
                  value={isUnlocked ? career.healthPreTax : '0000'}
                  onChange={(e) => onUpdateCareer({ healthPreTax: Number(e.target.value) })}
                  title="Pre-Tax Health Premiums"
                />
              </div>
            </div>
          </div>

          {/* Mobile-First Tax Breakdown Cards (<= 820px) */}
          {isUnlocked && (
            <div className="mobile-cards-view">
              {report.taxRows.map((r) => {
                const sign = r.isDeduction ? '-' : ''
                return (
                  <div
                    key={r.name}
                    className={`m-card ${r.highlight ? `highlight-${r.highlight}` : ''}`}
                  >
                    <div className="m-card-head">
                      <div>
                        <div className="m-card-title">{r.name}</div>
                        <div className="m-card-sub">{r.notes}</div>
                      </div>
                      <div
                        className={`m-card-primary-val ${
                          r.isDeduction ? 'text-negative' : 'text-positive'
                        }`}
                      >
                        {sign}
                        {fmtDollar(r.annual)}
                      </div>
                    </div>
                    <div className="m-card-metrics-grid two-col">
                      <div className="m-metric">
                        <span className="m-metric-label">Monthly</span>
                        <span className="m-metric-val">
                          {sign}
                          {fmtDollar(r.monthly)}/mo
                        </span>
                      </div>
                      <div className="m-metric">
                        <span className="m-metric-label">Share of W-2</span>
                        <span className="m-metric-val">{r.pctStr}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Desktop Tax Breakdown Table (> 820px) */}
          {isUnlocked && (
            <div className="desktop-table-view table-scroll">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Line Item</th>
                    <th>Annual Amount</th>
                    <th>Monthly Equivalent</th>
                    <th>% of W-2 Gross</th>
                    <th>Tax &amp; Payroll Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {report.taxRows.map((r) => {
                    const sign = r.isDeduction ? '-' : ''
                    const rowClass = r.highlight ? `row-highlight-${r.highlight}` : ''
                    return (
                      <tr key={r.name} className={rowClass}>
                        <td>
                          <strong>{r.name}</strong>
                        </td>
                        <td className="mono">
                          <strong>
                            {sign}
                            {fmtDollar(r.annual)}
                          </strong>
                        </td>
                        <td className="mono">
                          {sign}
                          {fmtDollar(r.monthly)} / mo
                        </td>
                        <td className="mono">{r.pctStr}</td>
                        <td className="cell-sub">{r.notes}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
