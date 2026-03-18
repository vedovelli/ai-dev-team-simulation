/**
 * Sprint Retrospective Data Layer Types
 *
 * Comprehensive types for sprint retrospective analytics, including velocity trends,
 * burndown analysis, team performance metrics, and historical comparisons.
 */

/**
 * Velocity data point for trend analysis
 */
export interface VelocityDataPoint {
  sprintId: string
  sprintName: string
  plannedVelocity: number
  actualVelocity: number
  date: string // ISO 8601 end date of sprint
}

/**
 * Burndown analysis for a single sprint
 */
export interface BurndownAnalysis {
  sprintId: string
  sprintName: string
  totalTasks: number
  completedTasks: number
  burndownRate: number // tasks per day
  steadiness: number // 0-100, consistency of daily completion
  hasEarlyBurst: boolean
  hasEndSpurt: boolean
  peakCompletionDay: number
}

/**
 * Comparison of burndown patterns across sprints
 */
export interface BurndownComparison {
  sprintIds: string[]
  averageBurndownRate: number
  mostSteadySprint: string
  mostUnstableSprint: string
  avgSteadiness: number
  improvementTrend: 'improving' | 'stable' | 'declining'
}

/**
 * Team performance metrics for a sprint
 */
export interface TeamPerformanceMetrics {
  sprintId: string
  sprintName: string
  completionRate: number // 0-100 percentage
  avgCycleTime: number // hours
  tasksCompleted: number
  tasksInProgress: number
  tasksCanceled: number
  teamSize: number
  avgTasksPerMember: number
  capacityUtilization: number // 0-100 percentage
}

/**
 * Agent performance data for a sprint
 */
export interface AgentPerformanceData {
  agentId: string
  agentName: string
  tasksCompleted: number
  avgCycleTime: number // hours
  velocityContribution: number // percentage
  capacityUtilization: number // 0-100
}

/**
 * Aggregated team metrics across multiple sprints
 */
export interface TeamPerformanceAggregation {
  sprints: TeamPerformanceMetrics[]
  avgCompletionRate: number
  avgCycleTime: number
  avgCapacityUtilization: number
  completionRateTrend: 'improving' | 'stable' | 'declining'
  cycleTimeTrend: 'improving' | 'stable' | 'declining'
}

/**
 * Data point for chart consumption (generic x, y format)
 */
export interface ChartDataPoint {
  x: string | number
  y: number
}

/**
 * Complete sprint retrospective data aggregation
 */
export interface SprintRetrospectiveData {
  sprintId: string
  sprintName: string
  period: {
    startDate: string
    endDate: string
  }
  velocityTrend: {
    dataPoints: VelocityDataPoint[]
    chartData: ChartDataPoint[]
    average: number
    trend: 'improving' | 'stable' | 'declining'
  }
  burndownAnalysis: {
    current: BurndownAnalysis
    comparison: BurndownComparison
    chartData: ChartDataPoint[]
  }
  teamPerformance: {
    metrics: TeamPerformanceMetrics
    aggregation: TeamPerformanceAggregation
    byAgent: AgentPerformanceData[]
  }
  summary: {
    totalSprintsAnalyzed: number
    healthScore: number // 0-100
    keyInsights: string[]
    recommendations: string[]
  }
}

/**
 * Historical sprint data for retrospective analysis
 */
export interface HistoricalSprintData {
  sprintId: string
  sprintName: string
  status: 'completed' | 'active' | 'planning'
  startDate: string
  endDate: string
  plannedVelocity: number
  actualVelocity: number
  taskCount: number
  completedCount: number
  teamSize: number
}
