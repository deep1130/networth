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
      <div className="summary-item">
        <span className="summary-label">CURRENT NET WORTH</span>
        <strong>{isUnlocked ? fmtDollar(netWorth) : '$---,---'}</strong>
        <span className="summary-note">Age {summary.currentAge} · Baseline 2027</span>
      </div>

      <div className="summary-item">
        <span className="summary-label">TARGET FUNDED STATUS</span>
        <strong className={isUnlocked && summary.fundedStatus >= 100 ? 'text-positive' : 'text-accent'}>
          {isUnlocked ? `${summary.fundedStatus.toFixed(1)}%` : '---%'}
        </strong>
        <span className="summary-note">
          At {settings.swr.toFixed(2)}% SWR ({(100 / settings.swr).toFixed(1)}× Rule) w/{' '}
          {summary.planBadge}
        </span>
      </div>

      <div className="summary-item">
        <span className="summary-label">SAFE PASSIVE INCOME</span>
        <strong className="text-accent">
          {isUnlocked ? `${fmtDollar(summary.monthlyPassive)} / mo` : '$--- / mo'}
        </strong>
        <span className="summary-note">
          {isUnlocked
            ? `${summary.runway.toFixed(1)} Yrs Runway · Budget: ${fmtDollar(summary.monthlySpend)}/mo`
            : '$--- / month total budget'}
        </span>
      </div>
    </section>
  )
}
