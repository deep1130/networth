import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  LineChart,
  Lock,
  Sliders,
} from 'lucide-react'
import { useState } from 'react'
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
  onSwitchToControlsTab,
}: TrajectoryViewProps) {
  const [showMobileQuickTune, setShowMobileQuickTune] = useState(false)

  const houseNote =
    settings.houseOutlay > 0
      ? ` · House Down Payment -${fmtDollar(settings.houseOutlay)} at Age ${settings.houseAge}`
      : ''

  const horizonDesc = `Modeling 2027 (Age 34) to ${summary.maxYear} (Age ${summary.maxAge}): Saving +${fmtDollar(settings.annualSavings)}/yr until Age ${settings.retireAge} (${summary.retireYear}), then withdrawing -${fmtDollar(summary.totalAnnualSpend)}/yr (inflation-adjusted) through Age ${summary.maxAge}${houseNote}`

  const { yr2027, yrRetire, yrEnd, recurringPostRetireNetChg } = summary
  const surv = yrEnd.survivalRate ?? 100

  return (
    <div className="trajectory-stack">
      {/* Mobile Quick-Tune Bar (Mobile-First Ergonomics) */}
      <div className="mobile-quick-tune-card">
        <div className="mobile-quick-tune-header">
          <button
            type="button"
            className="mobile-quick-tune-toggle"
            onClick={() => setShowMobileQuickTune((v) => !v)}
          >
            <Sliders size={14} className="text-accent" />
            <span>
              Quick Tune: Spend <strong>{fmtDollar(settings.baseSpend)}</strong> · Retire{' '}
              <strong>Age {settings.retireAge}</strong> · SWR <strong>{settings.swr}%</strong>
            </span>
            {showMobileQuickTune ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            type="button"
            className="pill-btn small"
            onClick={onSwitchToControlsTab}
          >
            All Controls
          </button>
        </div>

        {showMobileQuickTune && (
          <div className="mobile-quick-tune-body">
            <div className="quick-slider-row">
              <div className="control-label">
                <span>Base Annual Spend</span>
                <span className="control-value">{fmtDollar(settings.baseSpend)}/yr</span>
              </div>
              <input
                type="range"
                min={30000}
                max={250000}
                step={2500}
                value={settings.baseSpend}
                onChange={(e) =>
                  onUpdateSettings({
                    isCurrentSpendPreset: false,
                    baseSpend: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="quick-slider-row">
              <div className="control-label">
                <span>Target Retirement Age</span>
                <span className="control-value">
                  Age {settings.retireAge} ({summary.retireYear})
                </span>
              </div>
              <input
                type="range"
                min={34}
                max={70}
                step={1}
                value={settings.retireAge}
                onChange={(e) => onUpdateSettings({ retireAge: Number(e.target.value) })}
              />
            </div>

            <div className="quick-slider-row">
              <div className="control-label">
                <span>Annual Savings</span>
                <span className="control-value">{fmtDollar(settings.annualSavings)}/yr</span>
              </div>
              <input
                type="range"
                min={0}
                max={250000}
                step={2500}
                value={settings.annualSavings}
                onChange={(e) => onUpdateSettings({ annualSavings: Number(e.target.value) })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Trajectory & Monte Carlo Panel */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title-group">
              <LineChart size={16} className="text-accent" />
              <h2 className="panel-title">Wealth Compounding &amp; Drawdown Trajectory</h2>
            </div>
            <p className="panel-subtitle">{horizonDesc}</p>
          </div>
          <div className="horizon-badge">
            {isUnlocked
              ? `2027 – ${summary.maxYear} (Age ${summary.maxAge}) · Retire Age ${settings.retireAge}`
              : 'Locked — Enter key to calculate'}
          </div>
        </div>

        {/* Forecast Horizon Controls */}
        <div className="horizon-control-bar">
          <div className="horizon-slider-wrap">
            <span className="horizon-label">
              Forecast Horizon: <strong>Age {summary.maxAge}</strong> ({summary.maxYear})
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
          <div className="chips-row compact">
            {HORIZON_CHIPS.map((h) => (
              <button
                key={h.age}
                type="button"
                className={`chip ${summary.maxAge === h.age ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ chartMaxAge: h.age })}
              >
                {h.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Card Telemetry Strip */}
        <div className="telemetry-grid">
          <div className="telemetry-card">
            <div className="telemetry-label">2027 STARTING NET WORTH</div>
            <div className="telemetry-value accent-blue">
              {isUnlocked ? fmtDollar(yr2027.nominal) : '$---,---'}
            </div>
            <div className="telemetry-sub">
              {isUnlocked
                ? `Year 2027 (Age ${yr2027.age}) · Real: ${fmtDollar(yr2027.real)}`
                : 'Year 2027 (Age 34) · Real: $---'}
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label">
              AT RETIREMENT (AGE {yrRetire.age}, {yrRetire.year})
            </div>
            <div className="telemetry-value accent-amber">
              {isUnlocked ? fmtDollar(yrRetire.nominal) : '$---,---'}
            </div>
            <div className="telemetry-sub">
              {isUnlocked
                ? `Real: ${fmtDollar(yrRetire.real)} in today's $`
                : "Real: $--- in today's $"}
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label">POST-AGE {yrRetire.age} WITHDRAWAL</div>
            <div className="telemetry-value accent-purple">
              {isUnlocked ? `-${fmtDollar(summary.totalAnnualSpend)}/yr` : '-$--- / yr'}
            </div>
            <div
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
                  } after Age ${yrRetire.age}`
                : 'LOCKED'}
            </div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label">
              AGE {yrEnd.age} BALANCE ({yrEnd.year})
            </div>
            <div
              className={`telemetry-value ${
                !isUnlocked
                  ? ''
                  : summary.depletedYear &&
                      summary.depletedAge !== null &&
                      summary.depletedAge <= summary.maxAge
                    ? 'text-negative'
                    : 'text-positive'
              }`}
            >
              {!isUnlocked
                ? '$---,---'
                : summary.depletedYear &&
                    summary.depletedAge !== null &&
                    summary.depletedAge <= summary.maxAge
                  ? `$0 (Depleted Age ${summary.depletedAge})`
                  : fmtCompact(yrEnd.nominal)}
            </div>
            <div className="telemetry-sub">
              {!isUnlocked
                ? 'LOCKED'
                : summary.depletedYear &&
                    summary.depletedAge !== null &&
                    summary.depletedAge <= summary.maxAge
                  ? `Portfolio depleted in ${summary.depletedYear} (Age ${summary.depletedAge})`
                  : `Real: ${fmtDollar(yrEnd.real)} in today's $`}
            </div>
          </div>
        </div>

        {/* 4-Card Official Formulas & Monte Carlo Strip */}
        <div className="telemetry-grid formulas-strip">
          <div className="telemetry-card subtle">
            <div className="telemetry-label">OFFICIAL FIRE NUMBER</div>
            <div className="telemetry-value small">
              {isUnlocked
                ? `${fmtDollar(summary.fireTarget)} (${(100 / settings.swr).toFixed(1)}×)`
                : '$---,---'}
            </div>
            <div className="telemetry-sub">
              {isUnlocked
                ? `25× (4%): $${(summary.fireTarget4Pct / 1000000).toFixed(2)}M · 28.6× (3.5%): $${(summary.fireTarget35Pct / 1000000).toFixed(2)}M`
                : '25× (4% Rule): $--- · 28.6× (3.5%): $---'}
            </div>
          </div>

          <div className="telemetry-card subtle">
            <div className="telemetry-label">COAST FIRE TARGET</div>
            <div className="telemetry-value small">
              {isUnlocked ? fmtDollar(summary.coastFireTarget) : '$---,---'}
            </div>
            <div
              className={`telemetry-sub ${
                !isUnlocked ? '' : summary.isCoastAchieved ? 'text-positive' : 'text-warning'
              }`}
            >
              {!isUnlocked
                ? 'LOCKED — Enter key to calculate'
                : summary.isCoastAchieved
                  ? `Coast FIRE Achieved! (+${fmtDollar(netWorth - summary.coastFireTarget)} above target)`
                  : `${((netWorth / summary.coastFireTarget) * 100).toFixed(1)}% of Coast FIRE target for Age ${settings.retireAge}`}
            </div>
          </div>

          <div className="telemetry-card subtle">
            <div className="telemetry-label">MEDIAN (P50 MONTE CARLO)</div>
            <div className="telemetry-value small accent-purple">
              {isUnlocked
                ? `${fmtCompact(yrRetire.p50Nominal)} at Age ${yrRetire.age}`
                : '$---,---'}
            </div>
            <div className="telemetry-sub">
              {isUnlocked
                ? `Real P50: ${fmtDollar(yrRetire.p50Real)} · Age ${yrEnd.age} P50: ${fmtCompact(yrEnd.p50Nominal)}`
                : 'Retire: $--- · Age 100: $---'}
            </div>
          </div>

          <div className="telemetry-card subtle">
            <div className="telemetry-label">10TH %ILE (P10 STRESS TEST)</div>
            <div className="telemetry-value small accent-rose">
              {isUnlocked
                ? `${fmtCompact(yrRetire.p10Nominal)} at Age ${yrRetire.age}`
                : '$---,---'}
            </div>
            <div
              className={`telemetry-sub ${
                !isUnlocked
                  ? ''
                  : surv >= 90
                    ? 'text-positive'
                    : surv >= 75
                      ? 'text-warning'
                      : 'text-negative'
              }`}
            >
              {isUnlocked
                ? `Age ${yrEnd.age} P10: ${fmtCompact(yrEnd.p10Nominal)} · ${surv.toFixed(1)}% Survival`
                : 'Monte Carlo Survival Rate: ---%'}
            </div>
          </div>
        </div>

        {/* Chart.js Canvas */}
        <WealthChart
          isUnlocked={isUnlocked}
          displayedYears={summary.displayedYears}
          retireYear={summary.retireYear}
        />
      </div>

      {/* Retirement Income Tiers & Milestones ($65k - $200k) */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title-group">
              <Award size={16} className="text-accent" />
              <h2 className="panel-title">Retirement Income Tiers &amp; Milestones ($65k – $200k)</h2>
            </div>
            <p className="panel-subtitle">
              Logarithmic NPER compounding milestones across 4.0% (25×) and 3.5% (28.6×) safe
              withdrawal rules
            </p>
          </div>
          <span className="status-tag">
            {demoMode ? 'SAMPLE DATA' : isUnlocked ? 'LOGARITHMIC SWR MODEL' : 'LOCKED'}
          </span>
        </div>

        {!isUnlocked ? (
          <div className="locked-empty-state">
            <div className="empty-lock-circle">
              <Lock size={20} />
            </div>
            <h3>Retirement Income Milestones Locked</h3>
            <p>
              Portfolio progress, surplus/gap metrics, and milestone timelines remain hidden until
              unlocked. Enter your secret access key above or load the sample profile.
            </p>
            <button type="button" className="btn btn-primary" onClick={onOpenKeyModal}>
              Unlock With Secret Key
            </button>
          </div>
        ) : (
          <>
            {/* Mobile-First Adaptive Card View (<= 820px) */}
            <div className="mobile-cards-view">
              {summary.incomeTiers.map((t) => (
                <div
                  key={t.spend}
                  className={`m-card ${t.isAchieved ? 'achieved-border' : ''}`}
                >
                  <div className="m-card-head">
                    <div>
                      <div className="m-card-title">{fmtDollar(t.spend)} / yr</div>
                      <div className="m-card-sub">
                        {fmtDollar(t.monthly)}/mo · {t.label}
                      </div>
                    </div>
                    <span className={`status-pill ${t.isAchieved ? 'achieved' : 'pending'}`}>
                      {t.isAchieved ? (
                        <>
                          <CheckCircle2 size={12} /> 100% ACHIEVED
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> {t.pct35.toFixed(1)}%
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
                      <span className="m-metric-label">4.0% Rule (25×)</span>
                      <span className="m-metric-val">{fmtDollar(t.req4)}</span>
                    </div>
                    <div className="m-metric">
                      <span className="m-metric-label">3.5% Rule (28.6×)</span>
                      <span className="m-metric-val">{fmtDollar(t.req35)}</span>
                    </div>
                    <div className="m-metric">
                      <span className="m-metric-label">Surplus / Gap</span>
                      <span
                        className={`m-metric-val ${
                          t.isAchieved ? 'text-positive' : 'text-warning'
                        }`}
                      >
                        {t.isAchieved
                          ? `+${fmtDollar(netWorth - t.req35)}`
                          : `-${fmtDollar(t.gap)}`}
                      </span>
                    </div>
                    <div className="m-metric">
                      <span className="m-metric-label">Est. Milestone</span>
                      <span className="m-metric-val">{t.estYear}</span>
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
                    <th>Annual Spend</th>
                    <th>Monthly Budget</th>
                    <th>4.0% Rule (25×)</th>
                    <th>3.5% Rule (28.6×)</th>
                    <th>Funded % (3.5%)</th>
                    <th>Surplus / Gap</th>
                    <th>Est. Milestone Year</th>
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
                          {t.isAchieved ? '100% ACHIEVED' : `${t.pct35.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="mono">
                        {t.isAchieved ? (
                          <span className="text-positive">
                            +{fmtDollar(netWorth - t.req35)} Surplus
                          </span>
                        ) : (
                          <span className="text-warning">-{fmtDollar(t.gap)} Gap</span>
                        )}
                      </td>
                      <td className="mono">
                        <strong>{t.estYear}</strong>
                      </td>
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
