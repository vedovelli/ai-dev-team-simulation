/**
 * Agent Capacity Metrics Types
 *
 * Defines the structure for agent capacity tracking, including utilization
 * levels, warning states, and capacity adjustment data.
 */

export type WarningLevel = 'ok' | 'warning' | 'critical'

/**
 * Per-agent capacity metrics
 * Tracks current load, max capacity, and warning levels
 */
export interface AgentCapacityMetric {
  agentId: string
  name: string
  currentLoad: number
  maxCapacity: number
  tasksAssigned: number
  utilizationPct: number // 0-100
  warningLevel: WarningLevel // ok (<80%), warning (80-95%), critical (>95%)
}

/**
 * Response from capacity metrics query
 * Contains multiple agents' capacity data
 */
export interface AgentCapacityMetricsResponse {
  agents: AgentCapacityMetric[]
  timestamp: string
  sprintId: string
}

/**
 * Request to adjust agent capacity
 */
export interface CapacityAdjustmentRequest {
  agentId: string
  newMaxCapacity: number
}

/**
 * Response from capacity adjustment mutation
 */
export interface CapacityAdjustmentResponse {
  agentId: string
  previousCapacity: number
  newCapacity: number
  updatedAt: string
}
