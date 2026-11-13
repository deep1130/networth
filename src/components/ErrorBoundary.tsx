import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App ErrorBoundary caught:', error, info)
  }

  handleReset = () => {
    try {
      localStorage.clear()
    } catch {
      // Ignore
    }
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '24px', maxWidth: '520px', margin: '40px auto', fontFamily: 'monospace', color: '#f2f4f7' }}>
          <h2 style={{ margin: '0 0 10px', color: '#f87171', fontSize: '16px' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '0 0 14px', color: '#c9ced6', fontSize: '13px', lineHeight: 1.5 }}>
            {this.state.error.message || 'Unexpected application error'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '8px 14px',
              background: '#60a5fa',
              color: '#0a0b0d',
              border: 0,
              borderRadius: '6px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reset &amp; Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
