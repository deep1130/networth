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
import { fetchSheetDashboard, fetchSheetHistory, parseExcelFile } from './engine/sync'
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

function isInitialSampleUrl(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.search.includes('sample=true') ||
    window.location.hash.includes('sample') ||
    window.location.hash.includes('demo')
  )
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
  const initSample = isInitialSampleUrl()
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab)
  const [isUnlocked, setIsUnlocked] = useState(initSample)
  const [demoMode, setDemoMode] = useState(initSample)
  const sessionKeyRef = useRef<string | null>(null)

  const [netWorth, setNetWorth] = useState(initSample ? 90000 : 0)
  const [liveBaseSpend, setLiveBaseSpend] = useState(initSample ? 42500 : 0)
  const [simSettings, setSimSettings] = useState<SimulationSettings>(() =>
    initSample ? SAMPLE_SIMULATION_SETTINGS : loadSavedSimulationSettings(),
  )
  const [careerSettings, setCareerSettings] = useState<CareerSettings>(() =>
    initSample ? SAMPLE_CAREER_SETTINGS : loadSavedCareerSettings(),
  )

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
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusText, setSyncStatusText] = useState(
    initSample
      ? 'SAMPLE PROFILE ACTIVE · NOT CONNECTED TO SPREADSHEET'
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
    [isUnlocked, updateCareerSettings],
  )

  const handleResetDefaults = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
    setSimSettings({
      ...DEFAULT_SIMULATION_SETTINGS,
      baseSpend: liveBaseSpend > 0 ? liveBaseSpend : DEFAULT_SIMULATION_SETTINGS.baseSpend,
    })
  }, [liveBaseSpend])

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
    setSyncStatusText('SAMPLE PROFILE ACTIVE · NOT CONNECTED TO SPREADSHEET')
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
    setSimSettings(loadSavedSimulationSettings())
    setCareerSettings(loadSavedCareerSettings())
    setSyncStatusText('LOCKED · ENTER KEY OR CLICK SAMPLE')
  }, [])

  const handleToggleSample = useCallback(() => {
    if (demoMode) {
      lockDashboard()
    } else {
      if (isUnlocked && !demoMode) {
        window.alert('Lock the live dashboard before loading sample data.')
        return
      }
      activateSampleProfile()
    }
  }, [demoMode, isUnlocked, lockDashboard, activateSampleProfile])

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
    async (rawKey: string) => {
      const key = rawKey.trim()
      if (!key) return
      setIsSyncing(true)
      setSyncStatusText('VERIFYING SECRET KEY AND FETCHING DATA...')
      try {
        const { netWorth: nwVal, liveBaseSpend: spendVal } = await fetchSheetDashboard(key)
        sessionKeyRef.current = key
        setDemoMode(false)
        setIsUnlocked(true)
        setNetWorth(nwVal)
        if (spendVal > 0) {
          setLiveBaseSpend(spendVal)
          setSimSettings((prev) =>
            prev.isCurrentSpendPreset ? { ...prev, baseSpend: spendVal } : prev,
          )
        }
        setCareerSettings(loadSavedCareerSettings())
        setShowKeyModal(false)
        setSyncStatusText(`LIVE GOOGLE SHEET CONNECTED (${new Date().toLocaleTimeString()})`)
        await syncHistory(key)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Connection failed'
        window.alert(`Access Denied / Error: ${msg}`)
        setSyncStatusText(`ACCESS DENIED: ${msg}`)
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

  const handleSelectExcelFile = useCallback(async (file: File) => {
    try {
      const {
        netWorth: parsedNW,
        liveBaseSpend: parsedSpend,
        historySheets: parsedHistory,
      } = await parseExcelFile(file)
      sessionKeyRef.current = null
      setDemoMode(false)
      setIsUnlocked(true)
      if (parsedNW > 0) setNetWorth(parsedNW)
      if (parsedSpend > 0) {
        setLiveBaseSpend(parsedSpend)
        setSimSettings((prev) =>
          prev.isCurrentSpendPreset ? { ...prev, baseSpend: parsedSpend } : prev,
        )
      }
      if (Object.keys(parsedHistory).length > 0) {
        setHistorySheets(parsedHistory)
        setHistoryStatus('loaded')
      }
      setSyncStatusText(`LOADED FROM EXCEL: ${file.name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse workbook'
      window.alert(`Could not read Excel file: ${msg}`)
    }
  }, [])

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
    fetchPayPalQuote().then((price) => {
      setCareerSettings((prev) => ({ ...prev, stockPrice: price }))
    })
  }, [])

  const projectionSummary = useMemo(
    () => computeProjectionSummary(netWorth, simSettings),
    [netWorth, simSettings],
  )

  const careerReport = useMemo(
    () => computeCareerReport(careerSettings, netWorth, simSettings),
    [careerSettings, netWorth, simSettings],
  )

  const horizonLabel = isUnlocked
    ? `2027 – ${projectionSummary.maxYear} (Age ${projectionSummary.maxAge})`
    : 'FIRE & COMP ENGINE'

  return (
    <div className="app-shell">
      <HeaderBar
        isUnlocked={isUnlocked}
        demoMode={demoMode}
        isSyncing={isSyncing}
        syncStatusText={syncStatusText}
        horizonLabel={horizonLabel}
        showKeyModal={showKeyModal}
        onOpenKeyModal={() => setShowKeyModal(true)}
        onCloseKeyModal={() => setShowKeyModal(false)}
        onUnlockWithKey={handleUnlockWithKey}
        onLockDashboard={lockDashboard}
        onToggleSample={handleToggleSample}
        onManualRefresh={handleManualRefresh}
        onSelectExcelFile={handleSelectExcelFile}
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
