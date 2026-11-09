import { RotateCcw, Sliders } from 'lucide-react'
import {
  fmtDollar,
  HEALTHCARE_PLANS,
  HOUSE_AGE_PRESETS,
  HOUSE_OUTLAY_PRESETS,
  RETIRE_AGE_PRESETS,
  SPEND_PRESETS,
} from '../constants'
import type { ProjectionSummary, SimulationSettings } from '../types'

interface ControlsPanelProps {
  isUnlocked: boolean
  liveBaseSpend: number
  settings: SimulationSettings
  summary: ProjectionSummary
  onUpdateSettings: (partial: Partial<SimulationSettings>) => void
  onResetDefaults: () => void
  onOpenKeyModal: () => void
}

export function ControlsPanel({
  isUnlocked,
  liveBaseSpend,
  settings,
  summary,
  onUpdateSettings,
  onResetDefaults,
  onOpenKeyModal,
}: ControlsPanelProps) {
  const handleSpendChipClick = (presetVal: 'current' | number) => {
    if (presetVal === 'current') {
      if (!isUnlocked) {
        onOpenKeyModal()
        return
      }
      onUpdateSettings({
        isCurrentSpendPreset: true,
        baseSpend: liveBaseSpend > 0 ? liveBaseSpend : 95000,
      })
    } else {
      onUpdateSettings({
        isCurrentSpendPreset: false,
        baseSpend: presetVal,
      })
    }
  }

  const currentSpendLabel = isUnlocked && liveBaseSpend > 0
    ? `$${(liveBaseSpend / 1000).toFixed(1)}k`
    : '$---'

  const baseSpendDisplay =
    isUnlocked || !settings.isCurrentSpendPreset
      ? `${fmtDollar(settings.baseSpend)}/yr`
      : '$---/yr'

  return (
    <div className="panel controls-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <Sliders size={16} className="text-accent" />
          <h2 className="panel-title">Simulation Controls</h2>
        </div>
        <button
          type="button"
          className="pill-btn"
          onClick={onResetDefaults}
          title="Reset all simulation sliders to default assumptions"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Base Annual Spending Tier */}
      <div className="control-group">
        <div className="control-label">
          <span>Base Annual Spending</span>
          <span className="control-value">{baseSpendDisplay}</span>
        </div>
        <div className="chips-row">
          {SPEND_PRESETS.map((p) => {
            const isActive =
              p.value === 'current'
                ? settings.isCurrentSpendPreset
                : !settings.isCurrentSpendPreset && settings.baseSpend === p.value
            return (
              <button
                key={String(p.value)}
                type="button"
                className={`chip ${isActive ? 'active' : ''}`}
                onClick={() => handleSpendChipClick(p.value)}
              >
                {p.value === 'current' ? `Current (${currentSpendLabel})` : p.label}
              </button>
            )
          })}
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

      {/* 2. 2027 GetCoveredNJ ACA Healthcare Plan */}
      <div className="control-group">
        <div className="control-label">
          <span>2027 GetCoveredNJ Healthcare</span>
          <span className="control-value">+{fmtDollar(settings.healthCost)}/yr</span>
        </div>
        <select
          className="select-input"
          value={settings.healthCost}
          onChange={(e) => onUpdateSettings({ healthCost: Number(e.target.value) })}
        >
          {HEALTHCARE_PLANS.map((group) => (
            <optgroup key={group.group} label={group.group}>
              {group.options.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="control-hint">
          ACA subsidies scale by reported MAGI, not net worth or Roth/principal basis withdrawals.
        </div>
      </div>

      {/* 3. Safe Withdrawal Rate (SWR) */}
      <div className="control-group">
        <div className="control-label">
          <span>Safe Withdrawal Rate (SWR)</span>
          <span className="control-value">
            {settings.swr.toFixed(2)}% ({(100 / settings.swr).toFixed(1)}×)
          </span>
        </div>
        <input
          type="range"
          min={2.5}
          max={5.0}
          step={0.05}
          value={settings.swr}
          onChange={(e) => onUpdateSettings({ swr: Number(e.target.value) })}
        />
      </div>

      {/* 4. Expected Annual Portfolio Return (Nominal) */}
      <div className="control-group">
        <div className="control-label">
          <span>Expected Nominal Return</span>
          <span className="control-value">{settings.nominalReturn.toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min={4.0}
          max={12.0}
          step={0.1}
          value={settings.nominalReturn}
          onChange={(e) => onUpdateSettings({ nominalReturn: Number(e.target.value) })}
        />
      </div>

      {/* 5. Inflation Rate (CPI) + Exact Fisher Real Return */}
      <div className="control-group">
        <div className="control-label">
          <span>Inflation Rate (CPI)</span>
          <span className="control-value">{settings.inflationRate.toFixed(2)}%</span>
        </div>
        <input
          type="range"
          min={1.5}
          max={5.0}
          step={0.25}
          value={settings.inflationRate}
          onChange={(e) => onUpdateSettings({ inflationRate: Number(e.target.value) })}
        />
        <div className="fisher-pill">
          <span>Fisher Real Compounding Rate:</span>
          <strong>{(summary.realReturn * 100).toFixed(2)}% / yr</strong>
        </div>
      </div>

      {/* 6. Annual New Investment Contributions */}
      <div className="control-group">
        <div className="control-label">
          <span>Annual New Savings</span>
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

      {/* 7. Target Retirement Age */}
      <div className="control-group">
        <div className="control-label">
          <span>Target Retirement Age</span>
          <span className="control-value">
            Age {settings.retireAge} ({summary.retireYear} — in{' '}
            {Math.max(0, summary.retireYear - 2027)} yrs)
          </span>
        </div>
        <div className="chips-row">
          {RETIRE_AGE_PRESETS.map((age) => (
            <button
              key={age}
              type="button"
              className={`chip ${settings.retireAge === age ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ retireAge: age })}
            >
              Age {age}
            </button>
          ))}
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

      {/* 8. Future House Down Payment & Purchase Age */}
      <div className="control-group">
        <div className="control-label">
          <span>House Down Payment Outlay</span>
          <span className="control-value">
            {settings.houseOutlay > 0
              ? `${fmtDollar(settings.houseOutlay)} at Age ${settings.houseAge} (${summary.houseYear})`
              : '$0'}
          </span>
        </div>
        <div className="chips-row">
          {HOUSE_OUTLAY_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`chip ${settings.houseOutlay === p.value ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ houseOutlay: p.value })}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={500000}
          step={10000}
          value={settings.houseOutlay}
          onChange={(e) => onUpdateSettings({ houseOutlay: Number(e.target.value) })}
        />

        <div
          className="subcontrol-box"
          style={{ opacity: settings.houseOutlay > 0 ? 1 : 0.55 }}
        >
          <div className="control-label">
            <span>Purchase Age</span>
            <span className="control-value">
              Age {settings.houseAge} ({summary.houseYear} — in{' '}
              {Math.max(0, summary.houseYear - 2027)} yrs)
            </span>
          </div>
          <div className="chips-row">
            {HOUSE_AGE_PRESETS.map((age) => (
              <button
                key={age}
                type="button"
                className={`chip ${settings.houseAge === age ? 'active' : ''}`}
                onClick={() => onUpdateSettings({ houseAge: age })}
              >
                Age {age}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={34}
            max={60}
            step={1}
            value={settings.houseAge}
            onChange={(e) => onUpdateSettings({ houseAge: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}
