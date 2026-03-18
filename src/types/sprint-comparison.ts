import type { SprintMetrics } from './sprint'

/**
 * Trend direction for comparison metrics
 */
export type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * Delta value with trend direction for a single metric
 */
export interface MetricDelta {
  value: number
  trend: TrendDirection
  percentageChange?: number
}

/**
 * Comparison deltas between current and previous sprint metrics
 */
export interface SprintComparisonDeltas {
  velocity: MetricDelta
  completionRate: MetricDelta
  tasksCompleted: MetricDelta
}

/**
 * Result of sprint comparison analysis
 * Current sprint vs. previous sprint with derived delta values and trends
 */
export interface SprintComparisonResult {
  currentSprintId: string
  previousSprintId: string | null
  current: SprintMetrics
  previous: SprintMetrics | null
  deltas: SprintComparisonDeltas
}

/**
 * Options for useSprintComparison hook
 */
export interface UseSprintComparisonOptions {
  /** Enable automatic polling (default: true) */
  enabled?: boolean
  /** Polling interval in milliseconds (default: 30000 = 30s) */
  refetchInterval?: number
}

/**
 * Return type for useSprintComparison hook
 */
export interface UseSprintComparisonReturn {
  data: SprintComparisonResult | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<any>
}
