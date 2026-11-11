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
    <div className="section-panel controls-card">
      <div className="section-head">
        <div className="section-title-wrap">
          <Sliders size={15} className="text-accent" />
          <h2>Simulation Controls</h2>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onResetDefaults}
          title="Reset to default assumptions"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      <div className="controls-grid">
        {/* 1. Base Annual Spending */}
        <div className="control-item">
          <div className="control-item-head">
            <label>Base Annual Spend</label>
            <span className="mono-val text-accent">{baseSpendDisplay}</span>
          </div>
          <div className="pill-group">
            {SPEND_PRESETS.map((p) => {
              const isActive =
                p.value === 'current'
                  ? settings.isCurrentSpendPreset
                  : !settings.isCurrentSpendPreset && settings.baseSpend === p.value
              return (
                <button
                  key={String(p.value)}
                  type="button"
                  className={`pill-choice ${isActive ? 'active' : ''}`}
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

        {/* 2. 2027 GetCoveredNJ ACA Healthcare */}
        <div className="control-item">
          <div className="control-item-head">
            <label>2027 GetCoveredNJ Healthcare</label>
            <span className="mono-val text-accent">+{fmtDollar(settings.healthCost)}/yr</span>
          </div>
          <select
            className="clean-select"
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
        </div>

        {/* 3. Safe Withdrawal Rate (SWR) */}
        <div className="control-item">
          <div className="control-item-head">
            <label>Safe Withdrawal Rate (SWR)</label>
            <span className="mono-val text-accent">
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

        {/* 4. Expected Nominal Return */}
        <div className="control-item">
          <div className="control-item-head">
            <label>Expected Nominal Return</label>
            <span className="mono-val text-accent">{settings.nominalReturn.toFixed(1)}%</span>
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

        {/* 5. Inflation Rate & Fisher Real Return */}
        <div className="control-item">
          <div className="control-item-head">
            <label>Inflation Rate (CPI)</label>
            <span className="mono-val text-accent">
              {settings.inflationRate.toFixed(2)}% (Fisher Real: {(summary.realReturn * 100).toFixed(2)}%)
            </span>
          </div>
          <input
            type="range"
            min={1.5}
            max={5.0}
            step={0.25}
            value={settings.inflationRate}
            onChange={(e) => onUpdateSettings({ inflationRate: Number(e.target.value) })}
          />
        </div>

        {/* 6. Annual New Savings */}
        <div className="control-item">
          <div className="control-item-head">
            <label>Annual New Savings</label>
            <span className="mono-val text-accent">{fmtDollar(settings.annualSavings)}/yr</span>
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
        <div className="control-item">
          <div className="control-item-head">
            <label>Target Retirement Age</label>
            <span className="mono-val text-accent">
              Age {settings.retireAge} ({summary.retireYear})
            </span>
          </div>
          <div className="pill-group">
            {RETIRE_AGE_PRESETS.map((age) => (
              <button
                key={age}
                type="button"
                className={`pill-choice ${settings.retireAge === age ? 'active' : ''}`}
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

        {/* 8. Future House Outlay */}
        <div className="control-item">
          <div className="control-item-head">
            <label>House Down Payment</label>
            <span className="mono-val text-accent">
              {settings.houseOutlay > 0
                ? `${fmtDollar(settings.houseOutlay)} @ Age ${settings.houseAge}`
                : '$0'}
            </span>
          </div>
          <div className="pill-group">
            {HOUSE_OUTLAY_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`pill-choice ${settings.houseOutlay === p.value ? 'active' : ''}`}
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
          {settings.houseOutlay > 0 && (
            <div className="sub-house-row">
              <span className="mono-sub">Purchase Age: {settings.houseAge}</span>
              <div className="pill-group">
                {HOUSE_AGE_PRESETS.map((age) => (
                  <button
                    key={age}
                    type="button"
                    className={`pill-choice ${settings.houseAge === age ? 'active' : ''}`}
                    onClick={() => onUpdateSettings({ houseAge: age })}
                  >
                    Age {age}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
