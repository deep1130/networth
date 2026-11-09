import { Activity, DollarSign, Hourglass, Shield } from 'lucide-react'
import { fmtDollar } from '../constants'
import type { ProjectionSummary, SimulationSettings } from '../types'

interface SummaryStripProps {
  isUnlocked: boolean
  netWorth: number
  settings: SimulationSettings
  summary: ProjectionSummary
}

export function SummaryStrip({ isUnlocked, netWorth, settings, summary }: SummaryStripProps) {
  return (
    <section className="summary-strip">
      <div className="summary-card">
        <div className="summary-label-row">
          <span className="summary-label">CURRENT NET WORTH</span>
          <DollarSign size={14} className="summary-icon accent-blue" />
        </div>
        <div className="summary-value accent-blue">
          {isUnlocked ? fmtDollar(netWorth) : '$---,---'}
        </div>
        <div className="summary-sub">Current Age: {summary.currentAge} · Baseline 2027</div>
      </div>

      <div className="summary-card">
        <div className="summary-label-row">
          <span className="summary-label">FIRE FUNDED STATUS</span>
          <Shield size={14} className="summary-icon accent-green" />
        </div>
        <div className="summary-value accent-green">
          {isUnlocked ? `${summary.fundedStatus.toFixed(1)}%` : '---%'}
        </div>
        <div className="summary-sub">
          At {settings.swr.toFixed(2)}% SWR ({(100 / settings.swr).toFixed(1)}× Rule) w/{' '}
          {summary.planBadge}
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-label-row">
          <span className="summary-label">LIQUID RUNWAY</span>
          <Hourglass size={14} className="summary-icon accent-amber" />
        </div>
        <div className="summary-value accent-amber">
          {isUnlocked ? `${summary.runway.toFixed(1)} Years` : '--- Years'}
        </div>
        <div className="summary-sub">
          {isUnlocked
            ? `${fmtDollar(summary.monthlySpend)} / month total budget`
            : '$--- / month total budget'}
        </div>
      </div>

      <div className="summary-card">
        <div className="summary-label-row">
          <span className="summary-label">SAFE PASSIVE INCOME</span>
          <Activity size={14} className="summary-icon accent-purple" />
        </div>
        <div className="summary-value accent-purple">
          {isUnlocked ? `${fmtDollar(summary.monthlyPassive)} / mo` : '$--- / mo'}
        </div>
        <div
          className={`summary-sub ${
            !isUnlocked ? '' : summary.monthlySurplus >= 0 ? 'text-positive' : 'text-negative'
          }`}
        >
          {isUnlocked
            ? `${summary.monthlySurplus >= 0 ? '+' : '-'}$${Math.round(
                Math.abs(summary.monthlySurplus),
              ).toLocaleString()} / mo Cash Flow ${
                summary.monthlySurplus >= 0 ? 'Surplus' : 'Deficit'
              }`
            : 'LOCKED — Enter key to unlock'}
        </div>
      </div>
    </section>
  )
}
