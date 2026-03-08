import { ReactNode, Component, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  /** Optional WebSocket connection status to show UI degradation */
  wsConnected?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  networkOnline: boolean
}

/**
 * Error boundary component for handling WebSocket and network connection failures
 * Gracefully degrades to polling when WebSocket is unavailable
 * Monitors both network status and WebSocket connection state
 */
export class NotificationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Notification error boundary caught:', error, errorInfo)
  }

  componentDidMount() {
    // Monitor WebSocket status
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }

  handleOnline = () => {
    // Network connection restored - reset error if no other error
    this.setState({ networkOnline: true })
    if (this.state.hasError && !this.state.error) {
      this.setState({ hasError: false })
    }
  }

  handleOffline = () => {
    // Network connection lost
    this.setState({ networkOnline: false, hasError: true, error: new Error('Network connection lost') })
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  /**
   * Determine if we should show error UI based on network/WebSocket status
   */
  shouldShowError(): boolean {
    const { wsConnected } = this.props
    const { hasError, networkOnline } = this.state

    // Show if explicit error occurred
    if (hasError) return true

    // Show if network is offline
    if (!networkOnline) return true

    // Show if WebSocket is provided and disconnected (UI degradation warning)
    if (wsConnected === false) return true

    return false
  }

  getErrorMessage(): string {
    const { wsConnected } = this.props
    const { networkOnline, error } = this.state

    if (error?.message) return error.message
    if (!networkOnline) return 'Network connection lost'
    if (wsConnected === false) return 'Real-time connection unavailable'
    return 'Notification service temporarily unavailable'
  }

  render() {
    if (this.shouldShowError()) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-amber-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                Notification Service Temporarily Unavailable
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {this.getErrorMessage()}
              </p>
              <p className="mt-2 text-xs text-amber-600">
                Notifications will be fetched via polling as a fallback. Auto-refresh every 30 seconds.
              </p>
              <button
                onClick={this.resetError}
                className="mt-3 inline-flex items-center rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
