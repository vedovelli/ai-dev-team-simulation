export type SprintStatus = 'planning' | 'active' | 'in-review' | 'completed' | 'archived'

export interface SprintHistoryEvent {
  id: string
  sprintId: string
  eventType: 'created' | 'started' | 'completed' | 'archived' | 'restored'
  previousStatus?: SprintStatus
  newStatus: SprintStatus
  timestamp: string
  description: string
}

export interface Sprint {
  id: string
  name: string
  status: SprintStatus
  goals: string
  tasks: string[]
  estimatedPoints: number
  taskCount: number
  completedCount: number
  createdAt: string
  startDate?: string
  endDate?: string
  version: number
}

export type TaskStatus = 'backlog' | 'in-progress' | 'in-review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface SprintTask {
  id: string
  title: string
  status: TaskStatus
  assignee: string
  priority: TaskPriority
  sprintId: string
}

export interface SprintMetrics {
  sprintId: string
  totalPoints: number
  completedPoints: number
  remainingPoints: number
  daysRemaining: number
  daysElapsed: number
  sprintDuration: number
  velocity: number
  onTrack: boolean
  completionPercentage: number
}

export interface BurndownDataPoint {
  day: number
  ideal: number
  actual: number
  date: string
}

export interface SprintHealthData {
  sprint: Sprint
  metrics: SprintMetrics
  burndownData: BurndownDataPoint[]
}

export interface TeamMemberCapacity {
  id: string
  name: string
  role: string
  allocatedPoints: number
  maxCapacity: number
  utilizationRate: number // 0-100
  availability: 'available' | 'busy' | 'unavailable'
}

export interface TeamCapacity {
  sprintId: string
  members: TeamMemberCapacity[]
  totalCapacity: number
  allocatedCapacity: number
  availableCapacity: number
}

/**
 * Historical data point for sprint report trends
 */
export interface SprintReportDataPoint {
  date: string // ISO 8601 timestamp
  velocity: number
  completionRate: number // 0-100 percentage
  tasksCompleted: number
  tasksInProgress: number
  capacityUtilization: number // 0-100 percentage
}

/**
 * Sprint performance report with trends and aggregations
 */
export interface SprintReport {
  sprintId: string
  sprintName: string
  startDate: string
  endDate: string
  dataPoints: SprintReportDataPoint[]
  summary: {
    averageVelocity: number
    averageCompletionRate: number
    totalTasksCompleted: number
    peakCapacityUtilization: number
    lowCapacityUtilization: number
  }
}

/**
 * Request payload for sprint report generation with filters
 */
export interface SprintReportRequest {
  startDate: string // ISO 8601 date
  endDate: string // ISO 8601 date
}

/**
 * Velocity trend data point for historical velocity analysis
 */
export interface VelocityTrendDataPoint {
  sprintId: string
  sprintName: string
  velocity: number // tasks or points completed
  plannedVelocity: number // originally planned
  date: string // ISO 8601 date when sprint ended
}

/**
 * Capacity utilization data point per sprint
 */
export interface CapacityUtilizationDataPoint {
  sprintId: string
  sprintName: string
  utilizationRate: number // 0-100 percentage
  allocatedCapacity: number
  availableCapacity: number
  totalCapacity: number
  date: string // ISO 8601 date
}

/**
 * Burndown pattern analysis showing trends and patterns
 */
export interface BurndownPatternAnalysis {
  sprintId: string
  sprintName: string
  avgDailyCompletionRate: number // tasks/day
  steadiness: number // 0-100, how consistent the completion rate is
  hasEarlyBurst: boolean // high completion early in sprint
  hasEndSpurt: boolean // high completion late in sprint
  peakCompletionDay: number // 0-based day number
}

/**
 * Forecast accuracy comparison data
 */
export interface ForecastAccuracy {
  sprintId: string
  sprintName: string
  projectedCompletionDate: string // ISO 8601 date
  actualCompletionDate: string // ISO 8601 date (or null if not completed)
  daysVariance: number // positive = late, negative = early
  accuracyScore: number // 0-100, 100 = perfect forecast
}

/**
 * Sprint analytics response containing historical metrics and trends
 */
export interface SprintAnalyticsData {
  sprintId: string // current sprint being analyzed against
  range: number // number of past sprints included
  velocityTrends: VelocityTrendDataPoint[]
  capacityUtilization: CapacityUtilizationDataPoint[]
  burndownPatterns: BurndownPatternAnalysis[]
  forecastAccuracy: ForecastAccuracy[]
  summary: {
    averageVelocity: number
    velocityTrend: 'improving' | 'stable' | 'declining'
    averageCapacityUtilization: number
    forecastAccuracyRate: number // 0-100
    recommendedVelocity: number // for planning next sprint
  }
}

/**
 * Raw sprint velocity data point from API
 */
export interface SprintVelocityRaw {
  sprintId: string
  sprintName: string
  plannedPoints: number
  completedPoints: number
  startDate: string // ISO 8601
  endDate: string // ISO 8601
}

/**
 * Transformed velocity data point for chart consumption
 */
export interface VelocityDataPoint {
  name: string // sprint name
  planned: number
  completed: number
  completionRate: number // percentage 0-100
}

/**
 * Sprint velocity response with rolling average
 */
export interface SprintVelocityResponse {
  data: VelocityDataPoint[]
  rollingAverage: number // average of last 3 sprints
}
