import { useEffect, useState } from 'react'

export interface UsePollingWithFocusOptions {
  /** Polling interval in milliseconds, or false to disable (default: false) */
  interval?: number | false
  /** Whether polling is enabled (default: true) */
  enabled?: boolean
}

export interface UsePollingWithFocusReturn {
  /** Value to spread into useQuery refetchInterval option */
  refetchInterval: number | false
}

/**
 * Hook to manage polling intervals that pause when the document is hidden
 *
 * Returns a refetchInterval value to spread into useQuery/useInfiniteQuery options.
 * Automatically pauses polling when document visibility state is 'hidden' and resumes
 * when the document becomes visible again.
 *
 * Features:
 * - Automatically pauses polling when window is hidden (user switched tabs/minimized)
 * - Resumes polling when window is visible again
 * - Properly cleans up event listeners
 * - SSR-safe (checks for typeof document)
 * - Configurable interval and enabled flag
 *
 * Usage:
 * ```tsx
 * const polling = usePollingWithFocus({ interval: 30000, enabled: true })
 * const query = useQuery({
 *   queryKey: ['data'],
 *   queryFn: fetchData,
 *   ...polling,  // spreads { refetchInterval: ... }
 * })
 * ```
 */
export function usePollingWithFocus(
  options: UsePollingWithFocusOptions = {}
): UsePollingWithFocusReturn {
  const { interval = false, enabled = true } = options

  // Track document visibility state
  const [isVisible, setIsVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  )

  // Listen for visibility changes and update state
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Return polling interval when visible and enabled, otherwise false
  const refetchInterval = enabled && isVisible && interval ? interval : false

  return { refetchInterval }
}
