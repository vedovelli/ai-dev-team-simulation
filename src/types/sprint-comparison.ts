import type { SprintMetrics } from './sprint'

/**
 * Delta value for a specific metric with trend direction
 */
export interface DeltaMetric {
  value: number // Absolute change value
  percentage: number // Percentage change
  trend: 'up' | 'down' | 'neutral' // Trend direction based on context
}

/**
 * Sprint comparison result with current, previous, and delta values
 */
export interface SprintComparisonResult {
  current: SprintMetrics
  previous: SprintMetrics | null // null if this is the first sprint
  deltas: {
    velocity: DeltaMetric
    completionRate: DeltaMetric
    tasksCompleted: DeltaMetric
  }
  isFirstSprint: boolean // True if no previous sprint data exists
}
