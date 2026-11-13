import {
  Award,
  CheckCircle2,
  Clock,
  LineChart,
  Lock,
} from 'lucide-react'
import { fmtCompact, fmtDollar } from '../constants'
import type { ProjectionSummary, SimulationSettings } from '../types'
import { WealthChart } from './WealthChart'

interface TrajectoryViewProps {
  isUnlocked: boolean
  demoMode: boolean
  netWorth: number
  settings: SimulationSettings
  summary: ProjectionSummary
  onUpdateSettings: (partial: Partial<SimulationSettings>) => void
  onOpenKeyModal: () => void
  onSwitchToControlsTab: () => void
}

const HORIZON_CHIPS = [
  { label: 'Age 45', age: 45 },
  { label: 'Age 55', age: 55 },
  { label: 'Age 65', age: 65 },
  { label: 'Age 75', age: 75 },
  { label: 'Age 85', age: 85 },
  { label: 'Age 100', age: 100 },
]

export function TrajectoryView({
  isUnlocked,
  demoMode,
  netWorth,
  settings,
  summary,
  onUpdateSettings,
  onOpenKeyModal,
}: TrajectoryViewProps) {
  const { yr2027, yrRetire, yrEnd, recurringPostRetireNetChg } = summary
  const surv = yrEnd.survivalRate ?? 100

  return (
    <div className="view-stack">
      {/* 1. CHART FRONT & CENTER */}
      <div className="section-panel">
        <div className="section-head">
          <div className="section-title-wrap">
            <LineChart size={15} className="text-accent" />
            <h2>Compounding &amp; Drawdown Curve</h2>
          </div>
          <div className="horizon-tool-strip">
            <div className="horizon-slider-wrap">
              <span className="mono-sub">
                Horizon: <strong>Age {summary.maxAge}</strong> ({summary.maxYear})
              </span>
              <input
                type="range"
                min={Math.max(35, settings.retireAge)}
                max={100}
                step={1}
                value={summary.maxAge}
                onChange={(e) => onUpdateSettings({ chartMaxAge: Number(e.target.value) })}
              />
            </div>
            <div className="pill-group">
              {HORIZON_CHIPS.map((h) => (
                <button
                  key={h.age}
                  type="button"
                  className={`pill-choice ${summary.maxAge === h.age ? 'active' : ''}`}
                  onClick={() => onUpdateSettings({ chartMaxAge: h.age })}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Canvas */}
        <WealthChart
          isUnlocked={isUnlocked}
          displayedYears={summary.displayedYears}
          retireYear={summary.retireYear}
        />

        {/* Row 1: Core Trajectory Telemetry Strip */}
        <div className="telemetry-bar">
          <div className="telemetry-cell">
            <span className="telemetry-label">2027 STARTING NET WORTH</span>
            <div className="telemetry-value text-accent">
              {isUnlocked ? fmtDollar(yr2027.nominal) : '$---,---'}
            </div>
            <span className="telemetry-sub">
              {isUnlocked
                ? `Age ${yr2027.age} · Real: ${fmtDollar(yr2027.real)}`
                : 'Age 34 · Real: $---'}
            </span>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">AT RETIREMENT (AGE {yrRetire.age}, {yrRetire.year})</span>
            <div className="telemetry-value">
              {isUnlocked ? fmtDollar(yrRetire.nominal) : '$---,---'}
            </div>
            <span className="telemetry-sub">
              {isUnlocked ? `Real: ${fmtDollar(yrRetire.real)} today's $` : '---'}
            </span>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">POST-AGE {yrRetire.age} WITHDRAWAL</span>
            <div className="telemetry-value">
              {isUnlocked ? `-${fmtDollar(summary.totalAnnualSpend)}/yr` : '-$---/yr'}
            </div>
            <span
              className={`telemetry-sub ${
                !isUnlocked
                  ? ''
                  : recurringPostRetireNetChg >= 0
                    ? 'text-positive'
                    : 'text-negative'
              }`}
            >
              {isUnlocked
                ? `${recurringPostRetireNetChg >= 0 ? '+' : '-'}$${Math.round(
                    Math.abs(recurringPostRetireNetChg),
                  ).toLocaleString()}/yr net ${
                    recurringPostRetireNetChg >= 0 ? 'growth' : 'drawdown'
                  }`
                : '---'}
            </span>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">AGE {yrEnd.age} BALANCE ({yrEnd.year})</span>
            <div
              className={`telemetry-value ${
                summary.depletedYear && summary.depletedAge !== null && summary.depletedAge <= summary.maxAge
                  ? 'text-negative'
                  : 'text-positive'
              }`}
            >
              {!isUnlocked
                ? '$---,---'
                : summary.depletedYear && summary.depletedAge !== null && summary.depletedAge <= summary.maxAge
                  ? `$0 (Depleted Age ${summary.depletedAge})`
                  : fmtCompact(yrEnd.nominal)}
            </div>
            <span className="telemetry-sub">
              {!isUnlocked ? '---' : `Real: ${fmtDollar(yrEnd.real)}`}
            </span>
          </div>
        </div>

        {/* Row 2: Targets & Monte Carlo Strip */}
        <div className="telemetry-bar" style={{ marginTop: 10 }}>
          <div className="telemetry-cell">
            <span className="telemetry-label">WEALTH TARGET ({(100 / settings.swr).toFixed(1)}×)</span>
            <div className="telemetry-value text-accent">
              {isUnlocked ? fmtDollar(summary.fireTarget) : '$---,---'}
            </div>
            <span className="telemetry-sub">
              {isUnlocked
                ? `25× (4%): $${(summary.fireTarget4Pct / 1000000).toFixed(2)}M · 28.6× (3.5%): $${(summary.fireTarget35Pct / 1000000).toFixed(2)}M`
                : '25× (4%): $--- · 28.6× (3.5%): $---'}
            </span>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">COAST TARGET (AGE {settings.retireAge})</span>
            <div className="telemetry-value">
              {isUnlocked ? fmtDollar(summary.coastFireTarget) : '$---,---'}
            </div>
            <span
              className={`telemetry-sub ${
                !isUnlocked ? '' : summary.isCoastAchieved ? 'text-positive' : 'text-accent'
              }`}
            >
              {isUnlocked
                ? summary.isCoastAchieved
                  ? `Coast Achieved! (+${fmtDollar(netWorth - summary.coastFireTarget)})`
                  : `${((netWorth / summary.coastFireTarget) * 100).toFixed(1)}% of Coast target`
                : '---'}
            </span>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">MEDIAN (P50 MONTE CARLO)</span>
            <div className="telemetry-value text-accent">
              {isUnlocked ? `${fmtCompact(yrRetire.p50Nominal)} at Age ${yrRetire.age}` : '$---,---'}
            </div>
            <span className="telemetry-sub">
              {isUnlocked
                ? `Real P50: ${fmtDollar(yrRetire.p50Real)} · Age ${yrEnd.age}: ${fmtCompact(yrEnd.p50Nominal)}`
                : '---'}
            </span>
          </div>

          <div className="telemetry-cell">
            <span className="telemetry-label">10TH %ILE (P10 STRESS TEST)</span>
            <div className="telemetry-value">
              {isUnlocked ? `${fmtCompact(yrRetire.p10Nominal)} at Age ${yrRetire.age}` : '$---,---'}
            </div>
            <span className={`telemetry-sub ${surv >= 90 ? 'text-positive' : surv >= 75 ? 'text-accent' : 'text-negative'}`}>
              {isUnlocked
                ? `Age ${yrEnd.age}: ${fmtCompact(yrEnd.p10Nominal)} · ${surv.toFixed(1)}% Survival`
                : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. RETIREMENT INCOME TIERS & MILESTONES ($65k-$200k) */}
      <div className="section-panel">
        <div className="section-head">
          <div className="section-title-wrap">
            <Award size={15} className="text-accent" />
            <h2>Retirement Milestones ($65k – $200k)</h2>
          </div>
          <span className="section-meta-pill">
            {demoMode ? 'SAMPLE DATA' : isUnlocked ? 'LOGARITHMIC SWR MODEL' : 'LOCKED'}
          </span>
        </div>

        {!isUnlocked ? (
          <div className="empty-prompt">
            <Lock size={18} className="text-accent" />
            <p>Retirement income milestones are locked. Enter your secret key or load sample data.</p>
            <button type="button" className="btn btn-primary" onClick={onOpenKeyModal}>
              Unlock Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Cards (<= 820px) */}
            <div className="mobile-cards-view">
              {summary.incomeTiers.map((t) => (
                <div key={t.spend} className={`m-card ${t.isAchieved ? 'achieved-border' : ''}`}>
                  <div className="m-card-head">
                    <div>
                      <div className="m-card-title">{fmtDollar(t.spend)} / yr</div>
                      <div className="m-card-sub">{fmtDollar(t.monthly)}/mo · {t.label}</div>
                    </div>
                    <span className={`status-pill ${t.isAchieved ? 'achieved' : 'pending'}`}>
                      {t.isAchieved ? (
                        <>
                          <CheckCircle2 size={11} /> ACHIEVED
                        </>
                      ) : (
                        <>
                          <Clock size={11} /> {t.pct35.toFixed(1)}%
                        </>
                      )}
                    </span>
                  </div>

                  <div className="m-progress-track">
                    <div
                      className={`m-progress-fill ${t.isAchieved ? 'achieved' : ''}`}
                      style={{ width: `${Math.min(100, Math.max(2, t.pct35)).toFixed(1)}%` }}
                    />
                  </div>

                  <div className="m-card-metrics-grid">
                    <div className="m-metric">
                      <span className="m-metric-label">3.5% Target (28.6×)</span>
                      <span className="m-metric-val">{fmtDollar(t.req35)}</span>
                    </div>
                    <div className="m-metric">
                      <span className="m-metric-label">Surplus / Gap</span>
                      <span className={`m-metric-val ${t.isAchieved ? 'text-positive' : 'text-accent'}`}>
                        {t.isAchieved ? `+${fmtDollar(netWorth - t.req35)}` : `-${fmtDollar(t.gap)}`}
                      </span>
                    </div>
                    <div className="m-metric">
                      <span className="m-metric-label">4.0% Rule (25×)</span>
                      <span className="m-metric-val">{fmtDollar(t.req4)}</span>
                    </div>
                    <div className="m-metric">
                      <span className="m-metric-label">Estimated Year</span>
                      <span className="m-metric-val">{t.estYear}</span>
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
                    <th>Annual Spend</th>
                    <th>Monthly Budget</th>
                    <th>4.0% Rule (25×)</th>
                    <th>3.5% Rule (28.6×)</th>
                    <th>Funded %</th>
                    <th>Surplus / Gap</th>
                    <th>Est. Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.incomeTiers.map((t) => (
                    <tr key={t.spend}>
                      <td>
                        <strong>{fmtDollar(t.spend)}</strong>
                        <div className="cell-sub">{t.label}</div>
                      </td>
                      <td className="mono">{fmtDollar(t.monthly)} / mo</td>
                      <td className="mono">{fmtDollar(t.req4)}</td>
                      <td className="mono">{fmtDollar(t.req35)}</td>
                      <td>
                        <span className={`status-pill ${t.isAchieved ? 'achieved' : 'pending'}`}>
                          {t.isAchieved ? 'ACHIEVED' : `${t.pct35.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="mono">
                        {t.isAchieved ? (
                          <span className="text-positive">+{fmtDollar(netWorth - t.req35)}</span>
                        ) : (
                          <span className="text-accent">-{fmtDollar(t.gap)}</span>
                        )}
                      </td>
                      <td className="mono font-bold">{t.estYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
