export type SprintStatus = 'planning' | 'active' | 'completed' | 'archived'

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
