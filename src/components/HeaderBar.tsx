import {
  FileSpreadsheet,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Unlock,
} from 'lucide-react'
import { useRef, useState } from 'react'

interface HeaderBarProps {
  isUnlocked: boolean
  demoMode: boolean
  isSyncing: boolean
  syncStatusText: string
  horizonLabel: string
  showKeyModal: boolean
  onOpenKeyModal: () => void
  onCloseKeyModal: () => void
  onUnlockWithKey: (key: string) => void
  onLockDashboard: () => void
  onToggleSample: () => void
  onManualRefresh: () => void
  onSelectExcelFile: (file: File) => void
}

export function HeaderBar({
  isUnlocked,
  demoMode,
  isSyncing,
  syncStatusText,
  horizonLabel,
  showKeyModal,
  onOpenKeyModal,
  onCloseKeyModal,
  onUnlockWithKey,
  onLockDashboard,
  onToggleSample,
  onManualRefresh,
  onSelectExcelFile,
}: HeaderBarProps) {
  const [inlineKey, setInlineKey] = useState('')
  const [modalKey, setModalKey] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePrimaryKeyAction = () => {
    if (demoMode) {
      onToggleSample()
      return
    }
    if (isUnlocked) {
      if (window.confirm('Lock dashboard and wipe session credentials from memory?')) {
        setInlineKey('')
        onLockDashboard()
      }
      return
    }
    if (inlineKey.trim()) {
      onUnlockWithKey(inlineKey.trim())
      setInlineKey('')
    } else {
      onOpenKeyModal()
    }
  }

  const handleModalSubmit = () => {
    if (modalKey.trim()) {
      onUnlockWithKey(modalKey.trim())
      setModalKey('')
    }
  }

  const badgeState = demoMode ? 'demo' : isUnlocked ? 'live' : 'locked'
  const badgeText = demoMode ? 'SAMPLE DATA' : isUnlocked ? 'LIVE SYNC' : 'LOCKED'

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <TrendingUp size={16} strokeWidth={2.4} />
          </div>
          <span className="brand-name">WEALTHLEDGER</span>
          <span className="brand-sep">//</span>
          <span className="brand-sub">{horizonLabel}</span>
        </div>
        <div className="topbar-meta">
          <span className={`live-dot ${badgeState}`} />
          <span className={`live-label ${badgeState}`}>{badgeText}</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-intro">
          <div className="eyebrow">PERSONAL WEALTH &amp; RETIREMENT ANALYTICS</div>
          <h1>FIRE Trajectory &amp; Compensation Engine</h1>
          <p className="hero-copy">
            Real-time portfolio compounding, 500-path Monte Carlo stress testing, W-2 &amp; equity
            vesting projections, and 2027 GetCoveredNJ tax-shield playbooks.
          </p>
        </div>

        <div className="league-control">
          <div className="input-row">
            <label className="input-prefix" htmlFor="inline-key-input">
              KEY
            </label>
            <input
              id="inline-key-input"
              type="password"
              value={inlineKey}
              disabled={isUnlocked || demoMode}
              onChange={(e) => setInlineKey(e.target.value)}
              placeholder={
                demoMode
                  ? 'Sample Profile Active'
                  : isUnlocked
                    ? 'Connected to Sheet'
                    : 'Secret Access Key'
              }
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePrimaryKeyAction()
              }}
            />
            <button
              type="button"
              className={`action-btn ${!isUnlocked ? 'primary' : ''}`}
              onClick={handlePrimaryKeyAction}
            >
              {isUnlocked ? <Lock size={13} /> : <Unlock size={13} />}
              <span>{demoMode ? 'EXIT' : isUnlocked ? 'LOCK' : 'UNLOCK'}</span>
            </button>
          </div>

          <div className="hero-Secondary-actions">
            <button
              type="button"
              className={`pill-btn ${demoMode ? 'active-sample' : ''}`}
              onClick={onToggleSample}
              title="Load synthetic sample portfolio and compensation profile"
            >
              <Sparkles size={13} />
              <span>{demoMode ? 'EXIT SAMPLE' : 'SAMPLE'}</span>
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Load local Excel (.xlsx) workbook"
            >
              <FileSpreadsheet size={13} />
              <span>EXCEL</span>
            </button>
            <button
              type="button"
              className="pill-btn"
              onClick={onManualRefresh}
              disabled={isSyncing}
              title="Sync now from Google Sheet"
            >
              <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
              <span>{isSyncing ? 'SYNCING' : 'REFRESH'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onSelectExcelFile(file)
                  e.target.value = ''
                }
              }}
            />
          </div>

          <div className="sync-status-line">
            <ShieldCheck size={12} />
            <span>{syncStatusText}</span>
          </div>
        </div>
      </section>

      {!isUnlocked && (
        <div className="unlock-banner">
          <div className="unlock-banner-info">
            <div className="unlock-banner-icon">
              <Lock size={18} />
            </div>
            <div>
              <div className="unlock-banner-title">
                Portfolio &amp; Compensation Figures Protected
              </div>
              <div className="unlock-banner-sub">
                Zero-knowledge privacy: your secret key stays strictly in active memory and is never
                written to disk. Enter your key or tap <strong>SAMPLE</strong> to explore.
              </div>
            </div>
          </div>
          <div className="unlock-banner-actions">
            <button type="button" className="btn btn-secondary" onClick={onToggleSample}>
              <Sparkles size={14} />
              <span>Load Sample Profile</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={onOpenKeyModal}>
              <KeyRound size={14} />
              <span>Enter Access Key</span>
            </button>
          </div>
        </div>
      )}

      {showKeyModal && (
        <div className="modal-backdrop" onClick={onCloseKeyModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <KeyRound size={18} className="text-accent" />
              <h3>Unlock Live Financial Ledger</h3>
            </div>
            <p className="modal-desc">
              Enter your Google Apps Script secret key to sync live net worth, spending, and
              historical sheets. Held strictly in RAM for this tab session only.
            </p>
            <input
              type="password"
              className="modal-input"
              placeholder="Enter secret access key..."
              value={modalKey}
              autoFocus
              onChange={(e) => setModalKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleModalSubmit()
                if (e.key === 'Escape') onCloseKeyModal()
              }}
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onCloseKeyModal}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleModalSubmit}>
                Unlock &amp; Sync
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
