import {
  KeyRound,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Unlock,
} from 'lucide-react'
import { useState } from 'react'

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
}: HeaderBarProps) {
  const [inlineKey, setInlineKey] = useState('')
  const [modalKey, setModalKey] = useState('')

  const handleKeyAction = () => {
    if (inlineKey.trim()) {
      onUnlockWithKey(inlineKey.trim())
      setInlineKey('')
      return
    }
    if (isUnlocked && !demoMode) {
      if (window.confirm('Lock dashboard and wipe session credentials from memory?')) {
        setInlineKey('')
        onLockDashboard()
      }
      return
    }
    onOpenKeyModal()
  }

  const handleModalSubmit = () => {
    if (modalKey.trim()) {
      onUnlockWithKey(modalKey.trim())
      setModalKey('')
    }
  }

  const badgeClass = demoMode ? 'demo' : isUnlocked ? 'live' : 'locked'
  const badgeText = demoMode ? 'SAMPLE DATA' : isUnlocked ? 'LIVE SYNC' : 'LOCKED'

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <TrendingUp size={16} strokeWidth={2.4} />
          </div>
          <span>
            WEALTHLEDGER <span className="brand-light">// {horizonLabel}</span>
          </span>
        </div>
        <div className="topbar-right">
          <span className={`live-dot ${badgeClass}`} />
          <span className={`live-label ${badgeClass}`}>{badgeText}</span>
        </div>
      </header>

      <section className="intro">
        <div>
          <p className="eyebrow">
            FIRE TRAJECTORY <span>//</span> COMPENSATION ENGINE
          </p>
          <h1>
            Wealth &amp; <em>Retirement</em> Ledger
          </h1>
          <p className="intro-copy">
            Deterministic &amp; 500-path Monte Carlo compounding, W-2 rewards vesting, and
            GetCoveredNJ ACA tax-shield playbooks.
          </p>
        </div>

        <div className="league-control">
          <div className="control-label-row">
            <label htmlFor="inline-key-input">ACCESS KEY / SHEET SYNC</label>
            <span className="sync-note">{syncStatusText}</span>
          </div>
          <div className="league-input-row">
            <input
              id="inline-key-input"
              type="password"
              value={inlineKey}
              disabled={isUnlocked && !demoMode}
              onChange={(e) => setInlineKey(e.target.value)}
              placeholder={
                isUnlocked && !demoMode
                  ? 'Connected to Google Sheet'
                  : demoMode
                    ? 'Enter access key for live sheet...'
                    : 'Enter access key...'
              }
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleKeyAction()
              }}
            />
            <button
              type="button"
              className={`action-btn-cell ${!isUnlocked || demoMode ? 'primary' : ''}`}
              onClick={handleKeyAction}
              title={isUnlocked && !demoMode ? 'Lock session' : 'Unlock ledger'}
            >
              {isUnlocked && !demoMode ? <Lock size={12} /> : <Unlock size={12} />}
              <span>{isUnlocked && !demoMode ? 'LOCK' : 'UNLOCK'}</span>
            </button>
            <button
              type="button"
              className={`icon-tool-btn ${demoMode ? 'active' : ''}`}
              onClick={onToggleSample}
              title={demoMode ? 'Reload sample profile' : 'Load sample profile'}
            >
              <Sparkles size={13} />
            </button>
            <button
              type="button"
              className="icon-tool-btn"
              onClick={onManualRefresh}
              disabled={isSyncing || (!isUnlocked && !demoMode)}
              title="Refresh sheet data"
            >
              <RefreshCw size={13} className={isSyncing ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </section>

      {showKeyModal && (
        <div className="modal-backdrop" onClick={onCloseKeyModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <KeyRound size={17} className="text-accent" />
              <h3>Unlock Live Financial Ledger</h3>
            </div>
            <p className="modal-desc">
              Enter your Google Apps Script secret key. Held strictly in memory for this session
              only.
            </p>
            <input
              type="password"
              className="modal-input"
              placeholder="Secret access key..."
              value={modalKey}
              autoFocus
              onChange={(e) => setModalKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleModalSubmit()
                if (e.key === 'Escape') onCloseKeyModal()
              }}
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={onCloseKeyModal}>
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
