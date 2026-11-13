import {
  BookOpen,
  Briefcase,
  Database,
  LineChart,
  Sliders,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CareerView } from './components/CareerView'
import { ControlsPanel } from './components/ControlsPanel'
import { HeaderBar } from './components/HeaderBar'
import { HistoryView } from './components/HistoryView'
import { StrategyView } from './components/StrategyView'
import { SummaryStrip } from './components/SummaryStrip'
import { TrajectoryView } from './components/TrajectoryView'
import {
  CAREER_STORAGE_KEY,
  CAREER_YEAR_DATA,
  DEFAULT_CAREER_SETTINGS,
  DEFAULT_SIMULATION_SETTINGS,
  SAMPLE_CAREER_SETTINGS,
  SAMPLE_HISTORY_SHEETS,
  SAMPLE_SIMULATION_SETTINGS,
  STORAGE_KEY,
} from './constants'
import { computeCareerReport, fetchPayPalQuote } from './engine/career'
import { getHistoryYears } from './engine/history'
import { computeProjectionSummary } from './engine/projection'
import { fetchSheetDashboard, fetchSheetHistory } from './engine/sync'
import type {
  CareerPlanYearKey,
  CareerSettings,
  SheetDataMap,
  SimulationSettings,
  TabId,
} from './types'

function loadSavedSimulationSettings(): SimulationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_SIMULATION_SETTINGS,
        ...parsed,
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_SIMULATION_SETTINGS
}

function loadSavedCareerSettings(): CareerSettings {
  try {
    const raw =
      localStorage.getItem(CAREER_STORAGE_KEY) ||
      localStorage.getItem('fire_dashboard_career_v2')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_CAREER_SETTINGS,
        ...parsed,
        selectedYear:
          parsed.selectedYear && parsed.selectedYear !== 2026
            ? (String(parsed.selectedYear) as CareerPlanYearKey)
            : '2027',
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_CAREER_SETTINGS
}

function shouldStartSample(): boolean {
  if (typeof window === 'undefined') return true
  // Explicit locked override if requested in URL
  if (
    window.location.search.includes('locked=true') ||
    window.location.hash.includes('locked')
  ) {
    return false
  }
  return true
}

const TABS: {
  id: TabId
  shortLabel: string
  fullLabel: string
  icon: typeof LineChart
}[] = [
  { id: 'chart', shortLabel: 'Trajectory', fullLabel: 'Trajectory & Tiers', icon: LineChart },
  { id: 'controls', shortLabel: 'Controls', fullLabel: 'Simulation Controls', icon: Sliders },
  { id: 'career', shortLabel: 'Career', fullLabel: 'Career & Vesting', icon: Briefcase },
  { id: 'strategy', shortLabel: 'Strategy', fullLabel: 'Tax & ACA Playbook', icon: BookOpen },
  { id: 'history', shortLabel: 'History', fullLabel: 'Financial History', icon: Database },
]

function getInitialTab(): TabId {
  if (typeof window !== 'undefined') {
    const fromQuery = new URLSearchParams(window.location.search).get('tab')
    if (fromQuery && ['chart', 'controls', 'career', 'strategy', 'history'].includes(fromQuery)) {
      return fromQuery as TabId
    }
    const fromHash = window.location.hash.replace(/^#\/?/, '').trim()
    if (fromHash && ['chart', 'controls', 'career', 'strategy', 'history'].includes(fromHash)) {
      return fromHash as TabId
    }
  }
  return 'chart'
}

export function App() {
  const initSample = shouldStartSample()
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab)
  const [isUnlocked, setIsUnlocked] = useState(initSample)
  const [demoMode, setDemoMode] = useState(initSample)
  const sessionKeyRef = useRef<string | null>(null)

  const [netWorth, setNetWorth] = useState(initSample ? 90000 : 0)
  const [liveBaseSpend, setLiveBaseSpend] = useState(initSample ? 42500 : 0)
  const [simSettings, setSimSettings] = useState<SimulationSettings>(SAMPLE_SIMULATION_SETTINGS)
  const [careerSettings, setCareerSettings] = useState<CareerSettings>(SAMPLE_CAREER_SETTINGS)

  const [historySheets, setHistorySheets] = useState<SheetDataMap>((): SheetDataMap =>
    initSample
      ? {
          income: SAMPLE_HISTORY_SHEETS['Income'],
          taxes: SAMPLE_HISTORY_SHEETS['Taxes'],
          taxReturns: SAMPLE_HISTORY_SHEETS['Tax returns'],
          investing: SAMPLE_HISTORY_SHEETS['Investment Contributions'],
          living: SAMPLE_HISTORY_SHEETS['Living'],
          match: SAMPLE_HISTORY_SHEETS['Company Match'],
        }
      : {},
  )
  const [historyStatus, setHistoryStatus] = useState<
    'locked' | 'loading' | 'loaded' | 'empty' | 'error'
  >(initSample ? 'loaded' : 'locked')
  const [historyError, setHistoryError] = useState('')
  const [sheetErrors, setSheetErrors] = useState<{ key: string; message: string }[]>([])

  const [showKeyModal, setShowKeyModal] = useState(false)
  const [authError, setAuthError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusText, setSyncStatusText] = useState(
    initSample
      ? 'SAMPLE PROFILE ACTIVE · ENTER KEY FOR LIVE SHEET'
      : 'LOCKED · ENTER KEY OR CLICK SAMPLE',
  )
  const [isFetchingStock, setIsFetchingStock] = useState(false)

  const updateSimSettings = useCallback(
    (partial: Partial<SimulationSettings>) => {
      setSimSettings((prev) => {
        const next = { ...prev, ...partial }
        if (!demoMode) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            // Ignore
          }
        }
        return next
      })
    },
    [demoMode],
  )

  const updateCareerSettings = useCallback(
    (partial: Partial<CareerSettings>) => {
      setCareerSettings((prev) => {
        const next = { ...prev, ...partial }
        if (!demoMode && isUnlocked) {
          try {
            localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify(next))
          } catch {
            // Ignore
          }
        }
        return next
      })
    },
    [demoMode, isUnlocked],
  )

  const handleSelectPlanYear = useCallback(
    (year: CareerPlanYearKey) => {
      if (!isUnlocked) return
      if (demoMode) {
        const samplePresets: Record<string, { baseSalary: number; bonus: number }> = {
          '2027': { baseSalary: 75000, bonus: 7500 },
          '2028': { baseSalary: 80000, bonus: 8000 },
          '2029': { baseSalary: 85000, bonus: 8500 },
          '2030': { baseSalary: 90000, bonus: 9000 },
        }
        if (year !== 'custom' && samplePresets[year]) {
          const preset = samplePresets[year]
          updateCareerSettings({
            selectedYear: year,
            baseSalary: preset.baseSalary,
            bonus: preset.bonus,
            cashReward: 0,
            rsuVesting: 0,
          })
        } else {
          updateCareerSettings({ selectedYear: 'custom' })
        }
        return
      }
      if (year !== 'custom' && CAREER_YEAR_DATA[year]) {
        const preset = CAREER_YEAR_DATA[year]
        updateCareerSettings({
          selectedYear: year,
          baseSalary: preset.baseSalary,
          bonus: preset.bonus,
          cashReward: preset.cashReward,
          rsuVesting: preset.rsuVesting,
        })
      } else {
        updateCareerSettings({ selectedYear: 'custom' })
      }
    },
    [isUnlocked, demoMode, updateCareerSettings],
  )

  const handleResetDefaults = useCallback(() => {
    if (demoMode || !isUnlocked) {
      setSimSettings(SAMPLE_SIMULATION_SETTINGS)
      return
    }
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
    setSimSettings({
      ...DEFAULT_SIMULATION_SETTINGS,
      baseSpend: liveBaseSpend > 0 ? liveBaseSpend : DEFAULT_SIMULATION_SETTINGS.baseSpend,
    })
  }, [demoMode, isUnlocked, liveBaseSpend])

  const activateSampleProfile = useCallback(() => {
    sessionKeyRef.current = null
    setDemoMode(true)
    setIsUnlocked(true)
    setNetWorth(90000)
    setLiveBaseSpend(42500)
    setSimSettings(SAMPLE_SIMULATION_SETTINGS)
    setCareerSettings(SAMPLE_CAREER_SETTINGS)
    setHistorySheets({
      income: SAMPLE_HISTORY_SHEETS['Income'],
      taxes: SAMPLE_HISTORY_SHEETS['Taxes'],
      taxReturns: SAMPLE_HISTORY_SHEETS['Tax returns'],
      investing: SAMPLE_HISTORY_SHEETS['Investment Contributions'],
      living: SAMPLE_HISTORY_SHEETS['Living'],
      match: SAMPLE_HISTORY_SHEETS['Company Match'],
    })
    setHistoryStatus('loaded')
    setHistoryError('')
    setSheetErrors([])
    setSyncStatusText('SAMPLE PROFILE ACTIVE · ENTER KEY FOR LIVE SHEET')
  }, [])

  const lockDashboard = useCallback(() => {
    sessionKeyRef.current = null
    setDemoMode(false)
    setIsUnlocked(false)
    setNetWorth(0)
    setLiveBaseSpend(0)
    setHistorySheets({})
    setHistoryStatus('locked')
    setHistoryError('')
    setSheetErrors([])
    setSimSettings(SAMPLE_SIMULATION_SETTINGS)
    setCareerSettings(SAMPLE_CAREER_SETTINGS)
    setSyncStatusText('LOCKED · ENTER KEY OR CLICK SAMPLE')
  }, [])

  const handleToggleSample = useCallback(() => {
    if (isUnlocked && !demoMode) {
      if (!window.confirm('Switch from live Google Sheet connection to sample profile?')) {
        return
      }
    }
    activateSampleProfile()
  }, [isUnlocked, demoMode, activateSampleProfile])

  const syncHistory = useCallback(async (key: string) => {
    setHistoryStatus('loading')
    setHistoryError('')
    setSheetErrors([])
    const { sheets, errors } = await fetchSheetHistory(key)
    if (sessionKeyRef.current !== key) return
    setHistorySheets(sheets)
    setSheetErrors(errors)
    const loadedCount = Object.keys(sheets).length
    if (!loadedCount) {
      setHistoryStatus('error')
      setHistoryError(
        errors.map((e) => `${e.key}: ${e.message}`).join(' · ') ||
          'No financial history sheets could be loaded.',
      )
    } else {
      setHistoryStatus(getHistoryYears(sheets).length ? 'loaded' : 'empty')
    }
  }, [])

  const handleUnlockWithKey = useCallback(
    async (rawKey: string): Promise<boolean> => {
      const key = rawKey.trim()
      if (!key) return false
      setAuthError('')
      setIsSyncing(true)
      setSyncStatusText('VERIFYING SECRET KEY AND FETCHING DATA...')
      try {
        const { netWorth: nwVal, liveBaseSpend: spendVal } = await fetchSheetDashboard(key)
        sessionKeyRef.current = key
        setDemoMode(false)
        setIsUnlocked(true)
        setNetWorth(nwVal)
        const savedSim = loadSavedSimulationSettings()
        if (spendVal > 0) {
          setLiveBaseSpend(spendVal)
          setSimSettings(
            savedSim.isCurrentSpendPreset ? { ...savedSim, baseSpend: spendVal } : savedSim,
          )
        } else {
          setSimSettings(savedSim)
        }
        setCareerSettings(loadSavedCareerSettings())
        setShowKeyModal(false)
        setSyncStatusText(`LIVE GOOGLE SHEET CONNECTED (${new Date().toLocaleTimeString()})`)
        await syncHistory(key)
        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed'
        setAuthError(msg)
        setSyncStatusText(`ACCESS DENIED: ${msg}`)
        return false
      } finally {
        setIsSyncing(false)
      }
    },
    [syncHistory],
  )

  const handleManualRefresh = useCallback(async () => {
    if (demoMode) {
      activateSampleProfile()
      return
    }
    const key = sessionKeyRef.current
    if (!isUnlocked || !key) {
      setShowKeyModal(true)
      return
    }
    setIsSyncing(true)
    setSyncStatusText('SYNCING WITH GOOGLE SHEET...')
    try {
      const { netWorth: nwVal, liveBaseSpend: spendVal } = await fetchSheetDashboard(key)
      setNetWorth(nwVal)
      if (spendVal > 0) {
        setLiveBaseSpend(spendVal)
        setSimSettings((prev) =>
          prev.isCurrentSpendPreset ? { ...prev, baseSpend: spendVal } : prev,
        )
      }
      setSyncStatusText(`AUTO-SYNCED WITH SHEET (${new Date().toLocaleTimeString()})`)
      await syncHistory(key)
    } catch {
      setSyncStatusText(`SYNC ERROR (${new Date().toLocaleTimeString()})`)
    } finally {
      setIsSyncing(false)
    }
  }, [demoMode, isUnlocked, activateSampleProfile, syncHistory])

  const handleRefreshStockPrice = useCallback(async () => {
    setIsFetchingStock(true)
    try {
      const price = await fetchPayPalQuote()
      updateCareerSettings({ stockPrice: price })
    } finally {
      setIsFetchingStock(false)
    }
  }, [updateCareerSettings])

  useEffect(() => {
    try {
      localStorage.removeItem('sheet_sync_key')
    } catch {
      // Ignore
    }
  }, [])

  const projectionSummary = useMemo(
    () => computeProjectionSummary(netWorth, simSettings),
    [netWorth, simSettings],
  )

  const careerReport = useMemo(
    () => computeCareerReport(careerSettings, netWorth, simSettings, 854, 26, demoMode),
    [careerSettings, netWorth, simSettings, demoMode],
  )

  const horizonLabel = isUnlocked
    ? `2027 – ${projectionSummary.maxYear} (Age ${projectionSummary.maxAge})`
    : 'WEALTH & COMP ENGINE'

  return (
    <div className="app-shell">
      <HeaderBar
        isUnlocked={isUnlocked}
        demoMode={demoMode}
        isSyncing={isSyncing}
        syncStatusText={syncStatusText}
        horizonLabel={horizonLabel}
        showKeyModal={showKeyModal}
        authError={authError}
        onClearAuthError={() => setAuthError('')}
        onOpenKeyModal={() => {
          setAuthError('')
          setShowKeyModal(true)
        }}
        onCloseKeyModal={() => {
          setAuthError('')
          setShowKeyModal(false)
        }}
        onUnlockWithKey={handleUnlockWithKey}
        onLockDashboard={lockDashboard}
        onToggleSample={handleToggleSample}
        onManualRefresh={handleManualRefresh}
      />

      <SummaryStrip
        isUnlocked={isUnlocked}
        netWorth={netWorth}
        settings={simSettings}
        summary={projectionSummary}
      />

      {/* Main View Tabs matching fantasy-expected-wins */}
      <nav className="view-tabs" aria-label="Dashboard sections">
        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              className={isActive ? 'selected' : ''}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              <span className="tab-label-short">{t.shortLabel}</span>
              <span className="tab-label-full">{t.fullLabel}</span>
            </button>
          )
        })}
      </nav>

      <main className="main-content">
        {activeTab === 'chart' && (
          <TrajectoryView
            isUnlocked={isUnlocked}
            demoMode={demoMode}
            netWorth={netWorth}
            settings={simSettings}
            summary={projectionSummary}
            onUpdateSettings={updateSimSettings}
            onOpenKeyModal={() => setShowKeyModal(true)}
            onSwitchToControlsTab={() => setActiveTab('controls')}
          />
        )}

        {activeTab === 'controls' && (
          <ControlsPanel
            isUnlocked={isUnlocked}
            liveBaseSpend={liveBaseSpend}
            settings={simSettings}
            summary={projectionSummary}
            onUpdateSettings={updateSimSettings}
            onResetDefaults={handleResetDefaults}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}

        {activeTab === 'career' && (
          <CareerView
            isUnlocked={isUnlocked}
            demoMode={demoMode}
            career={careerSettings}
            report={careerReport}
            isFetchingStock={isFetchingStock}
            onUpdateCareer={updateCareerSettings}
            onSelectPlanYear={handleSelectPlanYear}
            onRefreshStockPrice={handleRefreshStockPrice}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}

        {activeTab === 'strategy' && <StrategyView />}

        {activeTab === 'history' && (
          <HistoryView
            isUnlocked={isUnlocked}
            demoMode={demoMode}
            sheets={historySheets}
            status={historyStatus}
            errorMessage={historyError}
            sheetErrors={sheetErrors}
            onOpenKeyModal={() => setShowKeyModal(true)}
          />
        )}
      </main>
    </div>
  )
}

export default App
