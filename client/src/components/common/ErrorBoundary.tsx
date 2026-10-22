import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled render error caught by ErrorBoundary:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <main
          className="app-shell"
          style={{
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            minHeight: '100vh',
          }}
        >
          <section
            className="login-card"
            role="alert"
            style={{ textAlign: 'center', maxWidth: '480px', width: '100%' }}
          >
            <p className="eyebrow" style={{ color: '#ef4444' }}>
              APPLICATION ERROR
            </p>
            <h1 style={{ fontSize: '24px', margin: '0 0 12px' }}>
              Something went wrong
            </h1>
            <p className="login-description">
              An unexpected render error occurred in the console. Your session data
              is preserved.
            </p>
            {this.state.error && (
              <div
                className="login-error"
                style={{
                  textAlign: 'left',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: '16px 0',
                }}
              >
                {this.state.error.message}
              </div>
            )}
            <button
              className="login-button"
              type="button"
              onClick={this.handleReset}
            >
              Reload Console
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
