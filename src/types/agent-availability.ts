/**
 * Agent availability windows, blackout periods, and capacity tracking
 */

/**
 * Day of week enum for availability windows
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

/**
 * Availability window for a specific day of week
 */
export interface AvailabilityWindow {
  dayOfWeek: DayOfWeek
  startHour: number // 0-23
  endHour: number   // 0-23
}

/**
 * Blackout period when agent is unavailable (e.g., vacation, sick leave)
 */
export interface BlackoutPeriod {
  startDate: string // ISO date string
  endDate: string   // ISO date string
  reason: string
}

/**
 * Current task capacity for an agent
 */
export interface CurrentCapacity {
  assigned: number  // Tasks currently assigned
  max: number       // Maximum task capacity
}

/**
 * Complete agent availability information
 */
export interface AgentAvailability {
  agentId: string
  availabilityWindows: AvailabilityWindow[]
  blackoutPeriods: BlackoutPeriod[]
  currentCapacity: CurrentCapacity
}

/**
 * Date range for availability queries
 */
export interface DateRange {
  from: string // ISO date string
  to: string   // ISO date string
}

/**
 * Hook return type for useAgentAvailability
 */
export interface UseAgentAvailabilityReturn {
  data: AgentAvailability | null
  isLoading: boolean
  error: Error | null
  /**
   * Check if agent is available at a specific date
   * Considers blackout periods and weekly availability windows
   */
  isAvailable: (date: Date) => boolean
}
