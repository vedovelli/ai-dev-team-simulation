import { useQuery } from '@tanstack/react-query'
import type { AgentAvailability, DateRange, UseAgentAvailabilityReturn } from '../types/agent-availability'

/**
 * Fetch and manage agent's availability windows and blackout periods
 *
 * Features:
 * - Caches availability with 60s stale time (availability changes infrequently)
 * - Accepts agentId and date range (from/to)
 * - Provides isAvailable() helper to check availability at specific dates
 * - Considers blackout periods and weekly availability windows
 * - Exponential backoff retry logic
 *
 * @param agentId - ID of the agent
 * @param dateRange - Date range for the query { from: ISO string, to: ISO string }
 * @returns Hook return object with data, loading, error states and isAvailable helper
 *
 * @example
 * const { data, isLoading, isAvailable } = useAgentAvailability('agent-1', {
 *   from: '2024-03-01',
 *   to: '2024-03-31'
 * })
 *
 * // Check if agent is available on a specific date
 * const isAvailableOnDeadline = isAvailable(new Date('2024-03-15'))
 */
export function useAgentAvailability(
  agentId: string,
  dateRange: DateRange
): UseAgentAvailabilityReturn {
  const query = useQuery<AgentAvailability, Error>({
    queryKey: ['agents', agentId, 'availability', { from: dateRange.from, to: dateRange.to }],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      })

      const response = await fetch(`/api/agents/${agentId}/availability?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(
          `Failed to fetch agent availability: ${response.statusCode} ${response.statusText}`
        )
      }

      return response.json() as Promise<AgentAvailability>
    },
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!agentId && !!dateRange.from && !!dateRange.to,
  })

  /**
   * Check if agent is available at a specific date
   * Considers blackout periods and weekly availability windows
   */
  const isAvailable = (date: Date): boolean => {
    if (!query.data) {
      return true // Assume available if data not loaded yet
    }

    const availability = query.data

    // Check if in blackout period
    const dateStr = date.toISOString().split('T')[0]
    const isBlackout = availability.blackoutPeriods.some(
      (period) => dateStr >= period.startDate && dateStr <= period.endDate
    )

    if (isBlackout) {
      return false
    }

    // Check weekly availability window
    const dayOfWeek = getDayOfWeekName(date)
    const window = availability.availabilityWindows.find((w) => w.dayOfWeek === dayOfWeek)

    if (!window) {
      return false // Not available this day of week
    }

    // Check if time is within window (use start of day for date-only checks)
    const hour = date.getHours()
    return hour >= window.startHour && hour < window.endHour
  }

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isAvailable,
  }
}

/**
 * Get day of week name from date
 */
function getDayOfWeekName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}
