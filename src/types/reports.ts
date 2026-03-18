/**
 * Sprint Performance Report Types
 *
 * Defines structures for sprint analytics, performance metrics,
 * and historical trend data used for reporting and forecasting.
 */

/**
 * Velocity trend data point tracking story points completed per sprint
 */
export interface VelocityPoint {
  sprintId: string
  sprintName: string
  velocity: number // story points completed
  plannedVelocity: number // originally planned
  date: string // ISO 8601 date when sprint ended
  sprintDuration: number // days
}

/**
 * Agent-level performance metrics for a sprint
 */
export interface AgentPerformance {
  agentId: string
  agentName: string
  tasksCompleted: number
  tasksInProgress: number
  avgCycleTime: number // hours
  utilization: number // 0-100 percentage
  efficiency: number // completed tasks / assigned tasks
}

/**
 * Daily burndown data point
 */
export interface BurndownPoint {
  day: number // 0-based day in sprint
  date: string // ISO 8601 date
  ideal: number // ideal remaining work
  actual: number // actual remaining work
}

/**
 * Complete sprint report with all analytics sections
 */
export interface SprintReport {
  sprintId: string
  sprintName: string
  startDate: string // ISO 8601
  endDate: string // ISO 8601
  completionRateTrend: Array<{
    sprintId: string
    sprintName: string
    completionRate: number // 0-100 percentage
    date: string // ISO 8601
  }>
  velocityTrend: VelocityPoint[]
  agentPerformance: AgentPerformance[]
  burndownData: BurndownPoint[]
  summary: {
    avgCompletionRate: number // 0-100
    avgVelocity: number
    totalTasksCompleted: number
    avgCycleTime: number // hours
    teamUtilization: number // 0-100
  }
}
